import "server-only";
import { verifyPassword } from "better-auth/crypto";
import { APIError } from "better-auth/api";
import { prisma } from "@/lib/prisma";

export async function assertPasswordNotReused(userId: string, newPassword: string) {
  const [account, history] = await Promise.all([
    prisma.account.findFirst({ where: { userId, providerId: "credential" }, select: { password: true } }),
    prisma.passwordHistory.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 5, select: { hash: true } }),
  ]);
  const hashes = [account?.password, ...history.map((item) => item.hash)].filter((hash): hash is string => Boolean(hash));
  for (const hash of hashes) {
    if (await verifyPassword({ hash, password: newPassword })) throw new APIError("BAD_REQUEST", { message: "Son 5 parolandan birini tekrar kullanamazsın." });
  }
  return account?.password ?? null;
}

export async function archivePassword(userId: string, hash: string | null) {
  if (!hash) return;
  const exists = await prisma.passwordHistory.findFirst({ where: { userId, hash } });
  if (!exists) await prisma.passwordHistory.create({ data: { userId, hash } });
  const old = await prisma.passwordHistory.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, skip: 5, select: { id: true } });
  if (old.length) await prisma.passwordHistory.deleteMany({ where: { id: { in: old.map((item) => item.id) } } });
}
