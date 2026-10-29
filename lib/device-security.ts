import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { sendNewDeviceAlert } from "@/lib/email";
import { query } from "@/lib/db";

export async function registerLoginDevice(session: { userId: string; userAgent?: string | null; ipAddress?: string | null }) {
  const userAgent = session.userAgent ?? "unknown";
  const ipAddress = normalizeIp(session.ipAddress);
  const fingerprint = createHash("sha256").update(`${userAgent}|${ipAddress}`).digest("hex");
  const [existing] = await query<{ id: string }>(`select "id" from "knownDevice" where "userId" = $1 and "fingerprint" = $2`, [session.userId, fingerprint]);
  if (existing) {
    await query(`update "knownDevice" set "userAgent" = $2, "ipAddress" = $3, "lastSeenAt" = now() where "id" = $1`, [existing.id, userAgent, ipAddress]);
    return;
  }
  const [{ count: previousDeviceCount }] = await query<{ count: number }>(`select count(*)::int as count from "knownDevice" where "userId" = $1`, [session.userId]);
  await query(
    `insert into "knownDevice" ("id", "userId", "fingerprint", "userAgent", "ipAddress", "lastSeenAt") values ($1, $2, $3, $4, $5, now())`,
    [randomUUID(), session.userId, fingerprint, userAgent, ipAddress],
  );
  if (previousDeviceCount === 0) return;
  const [user] = await query<{ email: string; name: string }>(`select "email", "name" from "user" where "id" = $1`, [session.userId]);
  if (user) await sendNewDeviceAlert(user.email, user.name);
}

function normalizeIp(ip?: string | null) {
  if (!ip) return "unknown";
  const value = ip.split(",")[0]?.trim() ?? "unknown";
  return value.includes(".") ? value.split(".").slice(0, 3).join(".") : value.split(":").slice(0, 4).join(":");
}
