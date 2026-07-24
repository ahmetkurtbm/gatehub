import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { archivePassword, assertPasswordNotReused } from "@/lib/password-history";

export async function POST(request: Request) {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) return Response.json({ error: "Yetkisiz." }, { status: 401 });
  const { currentPassword, newPassword } = await request.json() as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword) return Response.json({ error: "Parola alanları gerekli." }, { status: 400 });
  try {
    const previousHash = await assertPasswordNotReused(session.user.id, newPassword);
    await auth.api.changePassword({ headers: requestHeaders, body: { currentPassword, newPassword, revokeOtherSessions: true } });
    await archivePassword(session.user.id, previousHash);
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Parola değiştirilemedi." }, { status: 400 });
  }
}
