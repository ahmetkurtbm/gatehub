import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { query } from "@/lib/db";

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return Response.json({ error: "Yetkisiz." }, { status: 401 });
  const { action, token } = await request.json() as { action?: string; token?: string };
  const userId = session.user.id;
  const current = session.session.token;
  if (action === "one" && token) await query(`delete from "session" where "userId" = $1 and "token" = $2 and "token" <> $3`, [userId, token, current]);
  else if (action === "others") await query(`delete from "session" where "userId" = $1 and "token" <> $2`, [userId, current]);
  else if (action === "all") await query(`delete from "session" where "userId" = $1`, [userId]);
  else return Response.json({ error: "Geçersiz işlem." }, { status: 400 });
  await recordAudit({ action: `session.revoke.${action}`, userId: session.user.id });
  return Response.json({ ok: true });
}
