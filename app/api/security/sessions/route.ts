import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Yetkisiz." }, { status: 401 });
  const { action, token } = await request.json() as { action?: string; token?: string };
  if (action === "one" && token) await prisma.session.deleteMany({ where: { userId: session.user.id, token, NOT: { token: session.session.token } } });
  else if (action === "others") await prisma.session.deleteMany({ where: { userId: session.user.id, NOT: { token: session.session.token } } });
  else if (action === "all") await prisma.session.deleteMany({ where: { userId: session.user.id } });
  else return Response.json({ error: "Geçersiz işlem." }, { status: 400 });
  await recordAudit({ action: `session.revoke.${action}`, userId: session.user.id });
  return Response.json({ ok: true });
}
