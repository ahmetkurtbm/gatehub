import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { AccountCenter } from "@/components/account-center";
import { AdvancedSecurity } from "@/components/advanced-security";
import { auth, isAdminUser } from "@/lib/auth";
import { parseList, query } from "@/lib/db";

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const [accounts, sessions, consents] = await Promise.all([
    query<{ id: string; providerId: string; createdAt: Date }>(`select "id", "providerId", "createdAt" from "account" where "userId" = $1`, [session.user.id]),
    query<{ id: string; token: string; userAgent: string | null; ipAddress: string | null; createdAt: Date; expiresAt: Date }>(
      `select "id", "token", "userAgent", "ipAddress", "createdAt", "expiresAt" from "session" where "userId" = $1 order by "updatedAt" desc`, [session.user.id]),
    query<{ id: string; clientId: string; clientName: string | null; scopes: string; updatedAt: Date }>(
      `select c."id", c."clientId", o."name" as "clientName", c."scopes", c."updatedAt" from "oauthConsent" c left join "oauthClient" o on o."clientId" = c."clientId" where c."userId" = $1 order by c."updatedAt" desc`, [session.user.id]),
  ]);
  const hasPassword = accounts.some((account) => account.providerId === "credential");
  return <main className="app-shell"><AppHeader current="account" name={session.user.name} email={session.user.email} isAdmin={isAdminUser(session.user)}/><div className="app-container"><section className="app-page-head"><div><span className="app-eyebrow">Hesap merkezi</span><h1>Hesap ve güvenlik</h1><p>Profilini, giriş yöntemlerini, uygulama izinlerini ve açık oturumlarını yönet.</p></div></section><AccountCenter name={session.user.name} email={session.user.email} accounts={accounts.map(a=>({...a,createdAt:a.createdAt.toISOString()}))} sessions={sessions.map(s=>({...s,createdAt:s.createdAt.toISOString(),expiresAt:s.expiresAt.toISOString(),current:s.token===session.session.token}))} permissions={consents.map(c=>({id:c.id,name:c.clientName??c.clientId,scopes:parseList(c.scopes),updatedAt:c.updatedAt.toISOString()}))}/><AdvancedSecurity enabled={Boolean(session.user.twoFactorEnabled)} hasPassword={hasPassword}/></div></main>;
}
