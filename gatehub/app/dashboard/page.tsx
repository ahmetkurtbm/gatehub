import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Activity, AppWindow, KeyRound, Link2 } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { DeleteClientButton } from "@/components/delete-client-button";
import { ManageClient } from "@/components/manage-client";
import { OAuthClientForm } from "@/components/oauth-client-form";
import { auth, isAdminUser } from "@/lib/auth";

export default async function DashboardPage() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });
  if (!session) redirect("/login");
  const clients = (await auth.api.getOAuthClients({ headers: requestHeaders })) ?? [];
  const activeCount = clients.filter((client) => !client.disabled).length;

  return (
    <main className="app-shell">
      <AppHeader current="apps" name={session.user.name} email={session.user.email} isAdmin={isAdminUser(session.user)}/>
      <div className="app-container">
        <section className="app-page-head">
          <div><span className="app-eyebrow">Uygulama yönetimi</span><h1>Bağlı uygulamalar</h1><p>Projelerinin OAuth bilgilerini, callback adreslerini ve erişim anahtarlarını tek yerden yönet.</p></div>
          <span className="app-count-badge">{clients.length} uygulama</span>
        </section>

        <section className="app-stats" aria-label="Özet">
          <article><span className="stat-icon blue"><AppWindow size={19}/></span><div><small>Toplam uygulama</small><strong>{clients.length}</strong></div></article>
          <article><span className="stat-icon green"><Activity size={19}/></span><div><small>Aktif uygulama</small><strong>{activeCount}</strong></div></article>
          <article><span className="stat-icon violet"><KeyRound size={19}/></span><div><small>Kimlik doğrulama</small><strong>OAuth 2.0</strong></div></article>
        </section>

        <section className="apps-layout">
          <div className="apps-list-panel">
            <div className="panel-heading"><div><h2>Uygulamalar</h2><p>Bağlantı bilgileri ve uygulama durumu</p></div></div>
            <div className="apps-list">
              {clients.length ? clients.map((client) => (
                <article className="app-client-card" key={client.client_id}>
                  <div className="client-card-main">
                    <span className="client-app-icon"><AppWindow size={21}/></span>
                    <div className="client-identity"><div><h3>{client.client_name ?? "İsimsiz uygulama"}</h3><span className={`status-badge ${client.disabled ? "off" : "on"}`}>{client.disabled ? "Devre dışı" : "Aktif"}</span></div><code>{client.client_id}</code></div>
                    <div className="client-callback"><small>Callback adresi</small><span><Link2 size={14}/>{client.redirect_uris?.[0] ?? "Tanımlanmamış"}</span></div>
                    <ManageClient clientId={client.client_id} name={client.client_name ?? "Uygulama"} callbackUrl={client.redirect_uris?.[0] ?? ""}/>
                    <DeleteClientButton clientId={client.client_id} clientName={client.client_name ?? "Uygulama"}/>
                  </div>
                </article>
              )) : <div className="apps-empty"><AppWindow size={28}/><h3>Henüz uygulama yok</h3><p>Sağdaki formdan ilk uygulamanı ekleyebilirsin.</p></div>}
            </div>
          </div>
          <aside className="create-client-panel"><OAuthClientForm/></aside>
        </section>
      </div>
    </main>
  );
}
