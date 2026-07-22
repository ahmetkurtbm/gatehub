import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AppHeader } from "@/components/app-header";
import { AccountCenter } from "@/components/account-center";
import { AdvancedSecurity } from "@/components/advanced-security";
import { auth, isAdminUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AccountPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) redirect("/login");
  const [accounts, sessions, consents] = await Promise.all([
    prisma.account.findMany({ where: { userId: session.user.id }, select: { id: true, providerId: true, createdAt: true } }),
    prisma.session.findMany({ where: { userId: session.user.id }, orderBy: { updatedAt: "desc" }, select: { id: true, token: true, userAgent: true, ipAddress: true, createdAt: true, expiresAt: true } }),
    prisma.oauthConsent.findMany({ where: { userId: session.user.id }, include: { oauthclient: true }, orderBy: { updatedAt: "desc" } }),
  ]);
  const hasPassword = accounts.some((account) => account.providerId === "credential");
  return <main className="app-shell"><AppHeader current="account" name={session.user.name} email={session.user.email} isAdmin={isAdminUser(session.user)}/><div className="app-container"><section className="app-page-head"><div><span className="app-eyebrow">Hesap merkezi</span><h1>Hesap ve güvenlik</h1><p>Profilini, giriş yöntemlerini, uygulama izinlerini ve açık oturumlarını yönet.</p></div></section><AccountCenter name={session.user.name} email={session.user.email} accounts={accounts.map(a=>({...a,createdAt:a.createdAt.toISOString()}))} sessions={sessions.map(s=>({...s,createdAt:s.createdAt.toISOString(),expiresAt:s.expiresAt.toISOString(),current:s.token===session.session.token}))} permissions={consents.map(c=>({id:c.id,name:c.oauthclient.name??c.clientId,scopes:c.scopes,updatedAt:c.updatedAt.toISOString()}))}/><AdvancedSecurity enabled={Boolean(session.user.twoFactorEnabled)} hasPassword={hasPassword}/></div></main>;
}
