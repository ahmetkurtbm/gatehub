"use client";

import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

export function PasswordRequestForm() {
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true);
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    await authClient.requestPasswordReset({ email, redirectTo: "/reset-password" });
    setStatus("Bu adres kayıtlıysa sıfırlama bağlantısını gönderdik."); setLoading(false);
  }
  return <form className="auth-fields" onSubmit={submit}><label>E-posta<input name="email" type="email" required autoComplete="email" /></label><button className="auth-submit" disabled={loading}>{loading ? "Gönderiliyor…" : "Sıfırlama bağlantısı gönder"}</button>{status && <p className="success-message">{status}</p>}</form>;
}

export function PasswordResetForm({ token }: { token?: string }) {
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null);
    if (!token) return setError("Sıfırlama bağlantısı geçersiz veya eksik.");
    const newPassword = String(new FormData(event.currentTarget).get("password") ?? "");
    const result = await authClient.resetPassword({ newPassword, token });
    if (result.error) setError(result.error.message ?? "Parola sıfırlanamadı.");
    else setStatus("Parolan güncellendi. Artık giriş yapabilirsin.");
  }
  return <form className="auth-fields" onSubmit={submit}><label>Yeni parola<input name="password" type="password" required minLength={12} maxLength={128} autoComplete="new-password" /></label><p className="field-help">En az 12 karakter; büyük harf, küçük harf ve rakam.</p><button className="auth-submit">Parolayı güncelle</button>{status && <p className="success-message">{status}</p>}{error && <p className="error-message">{error}</p>}</form>;
}
