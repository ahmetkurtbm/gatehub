import Image from "next/image";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { OAuthClientForm } from "@/components/oauth-client-form";
import { SignOutButton } from "@/components/sign-out-button";
import { auth } from "@/lib/auth";

export default async function DashboardPage() {
  const requestHeaders = await headers();
  const session = await auth.api.getSession({ headers: requestHeaders });

  if (!session) {
    redirect("/login");
  }

  const clients = (await auth.api.getOAuthClients({
    headers: requestHeaders,
  })) ?? [];

  return (
    <main className="dashboard-shell">
      <nav className="dashboard-nav">
        <Brand />
        <SignOutButton />
      </nav>

      <section className="dashboard-content">
        <div className="dashboard-heading">
          <span className="status-pill success">Oturum aktif</span>
          <h1>Merhaba, {session.user.name}</h1>
          <p>GateHub kimliğin hazır. Bağlı projelerin seni bu hesapla tanıyacak.</p>
        </div>

        <div className="profile-card">
          {session.user.image ? (
            <Image
              className="avatar"
              src={session.user.image}
              alt=""
              width={64}
              height={64}
              unoptimized
            />
          ) : (
            <div className="avatar avatar-fallback" aria-hidden="true">
              {session.user.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <strong>{session.user.name}</strong>
            <span>{session.user.email}</span>
          </div>
          <span className="verified-badge">Google ile doğrulandı</span>
        </div>

        <div className="info-grid">
          <article className="info-card">
            <span>OIDC Issuer</span>
            <code>{process.env.BETTER_AUTH_URL ?? "http://localhost:3000"}/api/auth</code>
          </article>
          <article className="info-card">
            <span>Bağlantı türü</span>
            <strong>OAuth 2.1 + PKCE</strong>
          </article>
        </div>

        <section className="clients-section">
          <div className="section-heading">
            <div>
              <span className="section-kicker">Bağlı projeler</span>
              <h2>OAuth istemcileri</h2>
            </div>
            <span className="client-count">{clients.length} proje</span>
          </div>
          {clients.length > 0 ? (
            <div className="client-list">
              {clients.map((client) => (
                <article key={client.client_id}>
                  <div>
                    <strong>{client.client_name ?? "İsimsiz proje"}</strong>
                    <code>{client.client_id}</code>
                  </div>
                  <span>{client.disabled ? "Devre dışı" : "Aktif"}</span>
                </article>
              ))}
            </div>
          ) : (
            <p className="empty-state">Henüz GateHub’a bağlanmış bir proje yok.</p>
          )}
          <OAuthClientForm />
        </section>
      </section>
    </main>
  );
}
