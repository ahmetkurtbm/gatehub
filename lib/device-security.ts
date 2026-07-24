import "server-only";
import { createHash } from "node:crypto";
import { sendNewDeviceAlert } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export async function registerLoginDevice(session: { userId: string; userAgent?: string | null; ipAddress?: string | null }) {
  const userAgent = session.userAgent ?? "unknown";
  const ipAddress = normalizeIp(session.ipAddress);
  const fingerprint = createHash("sha256").update(`${userAgent}|${ipAddress}`).digest("hex");
  const existing = await prisma.knownDevice.findUnique({ where: { userId_fingerprint: { userId: session.userId, fingerprint } } });
  if (existing) {
    await prisma.knownDevice.update({ where: { id: existing.id }, data: { userAgent, ipAddress } });
    return;
  }
  const previousDeviceCount = await prisma.knownDevice.count({ where: { userId: session.userId } });
  await prisma.knownDevice.create({ data: { userId: session.userId, fingerprint, userAgent, ipAddress } });
  if (previousDeviceCount === 0) return;
  const user = await prisma.user.findUnique({ where: { id: session.userId }, select: { email: true, name: true } });
  if (user) await sendNewDeviceAlert(user.email, user.name);
}

function normalizeIp(ip?: string | null) {
  if (!ip) return "unknown";
  const value = ip.split(",")[0]?.trim() ?? "unknown";
  return value.includes(".") ? value.split(".").slice(0, 3).join(".") : value.split(":").slice(0, 4).join(":");
}
