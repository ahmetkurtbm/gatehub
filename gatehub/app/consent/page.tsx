import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Brand } from "@/components/brand";
import { ConsentActions } from "@/components/consent-actions";
import { auth } from "@/lib/auth";

const scopeLabels: Record<string, string> = {
  openid: "GateHub kimlik numaranı doğrulama",
  profile: "Adını ve profil fotoğrafını görme",
  email: "E-posta adresini görme",
  offline_access: "Sen çevrimdışıyken oturumu yenileme",
};

export default async function ConsentPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session) {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (typeof value === "string") query.set(key, value);
    }
    redirect(`/login?${query.toString()}`);
  }

  // Get client details to show project name instead of ID
  const clientId = typeof params.client_id === "string" ? params.client_id : "Bilinmeyen uygulama";
  
  let clientName = clientId;
  try {
    const requestHeaders = await headers();
    const clients = await auth.api.getOAuthClients({ headers: requestHeaders });
    const client = clients?.find((c) => c.client_id === clientId);
    if (client?.client_name) {
      clientName = client.client_name;
    }
  } catch {
    // Fallback to client_id if we can't get client details
  }

  const scope = typeof params.scope === "string" ? params.scope : "openid profile email";
  const scopes = scope.split(" ").filter(Boolean);

  return (
    <main className="auth-shell">
      <div className="auth-backdrop" aria-hidden="true" />
      <section className="auth-card consent-card">
        <Brand />
        <div className="auth-copy">
          <span className="status-pill">Erişim isteği</span>
          <h1>&ldquo;{clientName}&rdquo; hesabına erişmek istiyor</h1>
          <p>
            Aşağıdaki bilgilere erişmek için izin istiyor.
          </p>
        </div>
        <ul className="scope-list">
          {scopes.map((item) => (
            <li key={item}>
              <span className="scope-check">✓</span>
              <span>{scopeLabels[item] ?? item}</span>
            </li>
          ))}
        </ul>
        <div className="signed-in-as">
          <span>Şu hesapla devam ediyorsun</span>
          <strong>{session.user.email}</strong>
        </div>
        <ConsentActions scope={scope} />
      </section>
    </main>
  );
}
