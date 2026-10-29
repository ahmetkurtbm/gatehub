import "server-only";
import { randomUUID } from "node:crypto";
import { verifyPassword } from "better-auth/crypto";
import { APIError } from "better-auth/api";
import { query } from "@/lib/db";

export async function assertPasswordNotReused(userId: string, newPassword: string) {
  const [[account], history] = await Promise.all([
    query<{ password: string | null }>(`select "password" from "account" where "userId" = $1 and "providerId" = 'credential' limit 1`, [userId]),
    query<{ hash: string }>(`select "hash" from "passwordHistory" where "userId" = $1 order by "createdAt" desc limit 5`, [userId]),
  ]);
  const hashes = [account?.password, ...history.map((item) => item.hash)].filter((hash): hash is string => Boolean(hash));
  for (const hash of hashes) {
    if (await verifyPassword({ hash, password: newPassword })) throw new APIError("BAD_REQUEST", { message: "Son 5 parolandan birini tekrar kullanamazsın." });
  }
  return account?.password ?? null;
}

export async function archivePassword(userId: string, hash: string | null) {
  if (!hash) return;
  const [exists] = await query(`select 1 from "passwordHistory" where "userId" = $1 and "hash" = $2`, [userId, hash]);
  if (!exists) await query(`insert into "passwordHistory" ("id", "userId", "hash") values ($1, $2, $3)`, [randomUUID(), userId, hash]);
  // Only the last 5 passwords are kept.
  await query(
    `delete from "passwordHistory" where "id" in (select "id" from "passwordHistory" where "userId" = $1 order by "createdAt" desc offset 5)`,
    [userId],
  );
}
