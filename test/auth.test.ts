import { beforeEach, describe, expect, it, vi } from "vitest";

const requestHeaders = vi.hoisted(() => ({ current: new Headers() }));

vi.mock("next/headers", () => ({
  headers: async () => requestHeaders.current,
  cookies: async () => ({ get: () => undefined, set: () => {}, getAll: () => [] }),
}));
vi.mock("@/lib/email", () => ({
  sendNewDeviceAlert: vi.fn(async () => {}),
  sendPasswordResetEmail: vi.fn(async () => {}),
  sendVerificationEmail: vi.fn(async () => {}),
}));

import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { DELETE as deleteClient } from "@/app/api/oauth-clients/[id]/route";
import { DELETE as revokeConsent } from "@/app/api/permissions/[id]/route";
import { POST as changePassword } from "@/app/api/security/change-password/route";
import { recordAudit } from "@/lib/audit";
import { auth, isAdminUser } from "@/lib/auth";
import { DEMO_ACCOUNT, parseList, query } from "@/lib/db";
import { registerLoginDevice } from "@/lib/device-security";
import { sendNewDeviceAlert } from "@/lib/email";
import { archivePassword, assertPasswordNotReused } from "@/lib/password-history";

const BASE = "http://localhost:3000/api/auth";
const PASSWORD = "GucluParola12345";

// Hız sınırı IP başına çalışır; hız sınırını sınamayan istekler birbirini etkilemesin.
let requests = 0;
const uniqueIp = () => `10.0.${Math.floor(++requests / 250)}.${(requests % 250) + 1}`;

function post(path: string, body: unknown, headers: Record<string, string> = {}) {
  return auth.handler(
    new Request(`${BASE}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: "http://localhost:3000", "x-forwarded-for": uniqueIp(), ...headers },
      body: JSON.stringify(body),
    }),
  );
}

let counter = 0;
async function newUser() {
  const email = `kullanici${++counter}@test.dev`;
  const response = await post("/sign-up/email", { email, password: PASSWORD, name: "Test" });
  expect(response.status).toBe(200);
  const { user } = (await response.json()) as { user: { id: string } };
  return { id: user.id, email };
}

async function signIn(email: string, password = PASSWORD) {
  const response = await post("/sign-in/email", { email, password });
  expect(response.status).toBe(200);
  const cookie = response.headers.getSetCookie().map((value) => value.split(";")[0]).join("; ");
  requestHeaders.current = new Headers({ cookie, origin: "http://localhost:3000" });
}

const params = (id: string) => ({ params: Promise.resolve({ id }) });

async function newClient(userId: string) {
  const clientId = randomUUID();
  await query(`insert into "oauthClient" ("id", "clientId", "userId", "redirectUris") values ($1, $2, $3, '[]')`, [randomUUID(), clientId, userId]);
  return clientId;
}

beforeEach(() => {
  requestHeaders.current = new Headers();
  vi.mocked(sendNewDeviceAlert).mockClear();
});

describe("kayıt ve giriş", () => {
  it.each([
    ["kısa", "Kisa1"],
    ["büyük harfsiz", "gucluparola12345"],
    ["küçük harfsiz", "GUCLUPAROLA12345"],
    ["rakamsız", "GucluParolaOlsun"],
  ])("%s parolayı reddeder", async (_name, password) => {
    const response = await post("/sign-up/email", { email: `zayif${++counter}@test.dev`, password, name: "Test" });
    expect(response.status).toBe(400);
  });

  it("doğru parolayla girer, yanlış parolayı reddeder", async () => {
    const { email } = await newUser();
    expect((await post("/sign-in/email", { email, password: PASSWORD })).status).toBe(200);
    expect((await post("/sign-in/email", { email, password: "YanlisParola12345" })).status).toBe(401);
  });

  it("demo hesabıyla giriş çalışır", async () => {
    const response = await post("/sign-in/email", { email: DEMO_ACCOUNT.email, password: DEMO_ACCOUNT.password });
    expect(response.status).toBe(200);
  });

  it("art arda hatalı girişi hız sınırına takar", async () => {
    const { email } = await newUser();
    const headers = { "x-forwarded-for": "203.0.113.7" };
    const statuses: number[] = [];
    for (let attempt = 0; attempt < 7; attempt++) {
      statuses.push((await post("/sign-in/email", { email, password: "YanlisParola12345" }, headers)).status);
    }
    expect(statuses).toContain(429);
  });
});

describe("parola geçmişi", () => {
  it("mevcut parolanın tekrarını reddeder, yenisini kabul eder", async () => {
    const { id } = await newUser();
    await expect(assertPasswordNotReused(id, PASSWORD)).rejects.toThrow("Son 5 parolandan");
    await expect(assertPasswordNotReused(id, "BambaskaParola12345")).resolves.toEqual(expect.any(String));
  });

  it("yalnızca son 5 parolayı saklar, aynısını iki kez yazmaz", async () => {
    const { id } = await newUser();
    for (const hash of ["h1", "h1", "h2", "h3", "h4", "h5", "h6", "h7"]) await archivePassword(id, hash);
    await archivePassword(id, null);
    const rows = await query(`select "hash" from "passwordHistory" where "userId" = $1`, [id]);
    expect(rows).toHaveLength(5);
  });

  it("parola değiştirince eskisi tekrar kullanılamaz", async () => {
    const { email } = await newUser();
    await signIn(email);
    const change = (currentPassword: string, newPassword: string) =>
      changePassword(new Request("http://localhost:3000/api/security/change-password", { method: "POST", body: JSON.stringify({ currentPassword, newPassword }) }));

    expect((await change(PASSWORD, "YeniGucluParola123")).status).toBe(200);
    await signIn(email, "YeniGucluParola123");
    const reused = await change("YeniGucluParola123", PASSWORD);
    expect(reused.status).toBe(400);
    expect(((await reused.json()) as { error: string }).error).toContain("Son 5 parolandan");
  });

  it("oturum yoksa parola değiştirmez", async () => {
    const response = await changePassword(new Request("http://localhost:3000/x", { method: "POST", body: "{}" }));
    expect(response.status).toBe(401);
  });
});

describe("bilinen cihazlar", () => {
  it("ilk cihazda ve tanıdık cihazda bildirim göndermez, yeni cihazda gönderir", async () => {
    const { id, email } = await newUser();
    await query(`delete from "knownDevice" where "userId" = $1`, [id]);
    vi.mocked(sendNewDeviceAlert).mockClear();
    const device = { userId: id, userAgent: "Firefox", ipAddress: "10.0.0.1" };

    await registerLoginDevice(device);
    await registerLoginDevice(device);
    expect(sendNewDeviceAlert).not.toHaveBeenCalled();

    await registerLoginDevice({ ...device, userAgent: "Chrome" });
    expect(sendNewDeviceAlert).toHaveBeenCalledExactlyOnceWith(email, "Test");
  });

  it("IP'nin son bölümünü saklamaz, aynı ağı aynı cihaz sayar", async () => {
    const { id } = await newUser();
    await query(`delete from "knownDevice" where "userId" = $1`, [id]);
    await registerLoginDevice({ userId: id, userAgent: "Firefox", ipAddress: "1.2.3.4, 9.9.9.9" });
    await registerLoginDevice({ userId: id, userAgent: "Firefox", ipAddress: "1.2.3.200" });
    const rows = await query<{ ipAddress: string }>(`select "ipAddress" from "knownDevice" where "userId" = $1`, [id]);
    expect(rows).toEqual([{ ipAddress: "1.2.3" }]);
  });
});

describe("yetki sınırları", () => {
  it("oturum olmadan izin ve istemci silinemez", async () => {
    expect((await revokeConsent(new Request("http://x"), params("yok"))).status).toBe(401);
    expect((await deleteClient({} as NextRequest, params("yok"))).status).toBe(401);
  });

  it("başkasının OAuth iznini iptal edemez", async () => {
    const [owner, attacker] = [await newUser(), await newUser()];
    const clientId = await newClient(owner.id);
    const consentId = randomUUID();
    await query(`insert into "oauthConsent" ("id", "clientId", "userId", "createdAt", "updatedAt") values ($1, $2, $3, now(), now())`, [consentId, clientId, owner.id]);

    await signIn(attacker.email);
    expect((await revokeConsent(new Request("http://x"), params(consentId))).status).toBe(404);
    expect(await query(`select 1 from "oauthConsent" where "id" = $1`, [consentId])).toHaveLength(1);

    await signIn(owner.email);
    expect((await revokeConsent(new Request("http://x"), params(consentId))).status).toBe(200);
    expect(await query(`select 1 from "oauthConsent" where "id" = $1`, [consentId])).toHaveLength(0);
  });

  it("başkasının OAuth istemcisini silemez", async () => {
    const [owner, attacker] = [await newUser(), await newUser()];
    const clientId = await newClient(owner.id);

    await signIn(attacker.email);
    expect((await deleteClient({} as NextRequest, params(clientId))).status).toBe(404);
    expect(await query(`select 1 from "oauthClient" where "clientId" = $1`, [clientId])).toHaveLength(1);

    await signIn(owner.email);
    expect((await deleteClient({} as NextRequest, params(clientId))).status).toBe(204);
  });
});

describe("yardımcılar", () => {
  it("parseList her biçimi diziye çevirir", () => {
    expect(parseList(["a", 1])).toEqual(["a", "1"]);
    expect(parseList('["a","b"]')).toEqual(["a", "b"]);
    expect(parseList("bozuk")).toEqual([]);
    expect(parseList('{"a":1}')).toEqual([]);
    expect(parseList(null)).toEqual([]);
  });

  it("isAdminUser yalnızca admin rolünü kabul eder", () => {
    expect(isAdminUser({ id: "1", role: "admin" })).toBe(true);
    expect(isAdminUser({ id: "1", role: "user" })).toBe(false);
  });

  it("denetim kaydı yazar, veritabanı hatasında isteği düşürmez", async () => {
    const action = `test.${randomUUID()}`;
    await recordAudit({ action, targetType: "test" });
    expect(await query(`select "targetType" from "auditLog" where "action" = $1`, [action])).toEqual([{ targetType: "test" }]);

    const logged = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(recordAudit({ action: "test.fk", userId: "olmayan-kullanici" })).resolves.toBeUndefined();
    expect(logged).toHaveBeenCalled();
    logged.mockRestore();
  });
});
