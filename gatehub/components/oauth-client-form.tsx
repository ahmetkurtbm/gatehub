"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

type CreatedClient = {
  client_id: string;
  client_secret?: string | null;
};

export function OAuthClientForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [redirectUri, setRedirectUri] = useState("");
  const [created, setCreated] = useState<CreatedClient | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setCreated(null);
    setError(null);

    const result = await authClient.oauth2.createClient({
      client_name: name,
      redirect_uris: [redirectUri],
      scope: "openid profile email offline_access",
      token_endpoint_auth_method: "client_secret_basic",
      grant_types: ["authorization_code", "refresh_token"],
      response_types: ["code"],
      type: "web",
    });

    if (result.error) {
      setError(result.error.message ?? "Uygulama kaydedilemedi.");
      setLoading(false);
      return;
    }

    setCreated(result.data);
    setName("");
    setRedirectUri("");
    setLoading(false);
    router.refresh();
  }

  return (
    <div className="client-creator">
      <div>
        <span className="section-kicker">Yeni OAuth istemcisi</span>
        <h2>Bir projeyi GateHub’a bağla</h2>
        <p>Projenin adını ve giriş sonrası dönüş adresini kaydet.</p>
      </div>
      <form onSubmit={submit} className="client-form">
        <label>
          Proje adı
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Örn. ReceiptFlow"
            required
          />
        </label>
        <label>
          Callback URL
          <input
            type="url"
            value={redirectUri}
            onChange={(event) => setRedirectUri(event.target.value)}
            placeholder="https://uygulama.com/api/auth/callback/gatehub"
            required
          />
        </label>
        <button className="primary-button" type="submit" disabled={loading}>
          {loading ? "Oluşturuluyor…" : "İstemci oluştur"}
        </button>
      </form>
      {created && (
        <div className="credential-box" role="status">
          <strong>Bu bilgileri şimdi güvenli bir yere kaydet.</strong>
          <span>Client ID</span>
          <code>{created.client_id}</code>
          <span>Client secret</span>
          <code>{created.client_secret ?? "Public client — secret yok"}</code>
          <small>Client secret daha sonra tekrar gösterilmez.</small>
        </div>
      )}
      {error && <p className="error-message align-left">{error}</p>}
    </div>
  );
}
