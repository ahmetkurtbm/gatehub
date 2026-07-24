"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";

export function ConsentActions({ scope }: { scope?: string }) {
  const [loading, setLoading] = useState<"accept" | "deny" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(accept: boolean) {
    setLoading(accept ? "accept" : "deny");
    setError(null);

    const result = await authClient.oauth2.consent({
      accept,
      scope: accept ? scope : undefined,
    });

    if (result.error) {
      setError(result.error.message ?? "İzin tercihi kaydedilemedi.");
      setLoading(null);
      return;
    }

    if (result.data?.url) {
      window.location.assign(result.data.url);
      return;
    }

    setError("Yönlendirme adresi alınamadı.");
    setLoading(null);
  }

  return (
    <div className="consent-actions">
      <button
        className="primary-button"
        type="button"
        onClick={() => decide(true)}
        disabled={loading !== null}
      >
        {loading === "accept" ? "Bağlanıyor…" : "İzin ver ve devam et"}
      </button>
      <button
        className="secondary-button"
        type="button"
        onClick={() => decide(false)}
        disabled={loading !== null}
      >
        {loading === "deny" ? "Reddediliyor…" : "Reddet"}
      </button>
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}
