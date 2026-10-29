import { headers } from "next/headers";
import { auth, isAdminUser } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session || !isAdminUser(session.user)) return Response.json({ error: "Yetkisiz." }, { status: 403 });
  const { kind, id, disabled } = await request.json() as { kind?: "user" | "app"; id?: string; disabled?: boolean };
  if (!id || typeof disabled !== "boolean") return Response.json({ error: "Geçersiz istek." }, { status: 400 });
  if (kind === "user") {
    if (id === session.user.id) return Response.json({ error: "Kendini engelleyemezsin." }, { status: 400 });
    await query(`update "user" set "banned" = $2, "banReason" = $3, "banExpires" = null, "updatedAt" = now() where "id" = $1`, [id, disabled, disabled ? "Admin tarafından engellendi" : null]);
    if (disabled) await query(`delete from "session" where "userId" = $1`, [id]);
  } else if (kind === "app") await query(`update "oauthClient" set "disabled" = $2, "updatedAt" = now() where "clientId" = $1`, [id, disabled]);
  else return Response.json({ error: "Geçersiz tür." }, { status: 400 });
  await recordAudit({ action: `admin.${kind}.${disabled ? "disabled" : "enabled"}`, userId: session.user.id, targetType: kind, targetId: id });
  return Response.json({ ok: true });
}
