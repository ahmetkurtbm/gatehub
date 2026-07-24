import { headers } from "next/headers";
import { auth, isAdminUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isAdminUser(session.user)) return Response.json({ error: "Yetkisiz." }, { status: 403 });
  const { kind, id, disabled } = await request.json() as { kind?: "user" | "app"; id?: string; disabled?: boolean };
  if (!id || typeof disabled !== "boolean") return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  if (kind === "user") {
    if (id === session.user.id) return Response.json({ error: "Kendini engelleyemezsin." }, { status: 400 });
    await prisma.$transaction([
      prisma.user.update({ where: { id }, data: { banned: disabled, banReason: disabled ? "Admin tarafından engellendi" : null, banExpires: null } }),
      ...(disabled ? [prisma.session.deleteMany({ where: { userId: id } })] : []),
    ]);
  } else if (kind === "app") await prisma.oauthClient.update({ where: { clientId: id }, data: { disabled } });
  else return Response.json({ error: "Geçersiz tür." }, { status: 400 });
  await recordAudit({ action: `admin.${kind}.${disabled ? "disabled" : "enabled"}`, userId: session.user.id, targetType: kind, targetId: id });
  return Response.json({ ok: true });
}
