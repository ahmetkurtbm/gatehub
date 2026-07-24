"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { authClient } from "@/lib/auth-client";

export function AuthForm({ googleEnabled }: { googleEnabled: boolean }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true); setError(null); setMessage(null);
    const data = new FormData(event.currentTarget);
    const submittedEmail = String(data.get("email") ?? "").trim();
    const password = String(data.get("password") ?? "");
    const result = mode === "register"
      ? await authClient.signUp.email({ name: String(data.get("name") ?? "").trim(), email: submittedEmail, password, callbackURL: "/dashboard" })
      : await authClient.signIn.email({ email: submittedEmail, password, callbackURL: "/dashboard" });

    if (result.error) setError(result.error.message ?? "İşlem tamamlanamadı.");
    else if (mode === "register") setMessage("Doğrulama bağlantısını e-posta adresine gönderdik.");
    else window.location.href = "/dashboard";
    setLoading(false);
  }

  async function resendVerification() {
    if (!email.includes("@")) {
      setError("Önce geçerli bir e-posta adresi yaz.");
      return;
    }
    setLoading(true); setError(null); setMessage(null);
    const result = await authClient.sendVerificationEmail({ email: email.trim(), callbackURL: "/dashboard" });
    if (result.error) setError(result.error.message ?? "Doğrulama e-postası gönderilemedi.");
    else setMessage("Yeni doğrulama bağlantısını e-posta adresine gönderdik.");
    setLoading(false);
  }

  async function googleSignIn() {
    setLoading(true); setError(null);
    const result = await authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" });
    if (result.error) { setError(result.error.message ?? "Google girişi başlatılamadı."); setLoading(false); }
  }

  return (
    <div>
      <div className="auth-tabs" role="tablist">
        <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")} type="button">Giriş yap</button>
        <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")} type="button">Kayıt ol</button>
      </div>
      <form className="auth-fields" onSubmit={submit}>
        {mode === "register" && <label>Ad soyad<input name="name" autoComplete="name" required minLength={2} /></label>}
        <label>E-posta<input name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
        <label>Parola<input name="password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} required minLength={12} maxLength={128} /></label>
        {mode === "register" && <p className="field-help">En az 12 karakter; büyük harf, küçük harf ve rakam.</p>}
        {mode === "login" && <Link className="auth-forgot" href="/forgot-password">Şifremi unuttum</Link>}
        <button className="auth-submit" disabled={loading} type="submit">{loading ? "Lütfen bekle…" : mode === "login" ? "Giriş yap" : "Hesap oluştur"}</button>
        {mode === "register" && <button className="auth-resend-button" disabled={loading || !email} type="button" onClick={resendVerification}>Doğrulama e-postasını tekrar gönder</button>}
      </form>
      <div className="auth-divider"><span>veya</span></div>
      <button className="google-button" type="button" onClick={googleSignIn} disabled={!googleEnabled || loading}><GoogleIcon />Google ile devam et</button>
      {!googleEnabled && <p className="login-config-note">Google girişi henüz yapılandırılmamış.</p>}
      {message && <p className="success-message">{message}</p>}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}

function GoogleIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" width="20" height="20"><path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.06H12v3.9h5.38a4.6 4.6 0 0 1-2 3.02v2.53h3.24c1.9-1.75 2.98-4.33 2.98-7.39Z"/><path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.38l-3.25-2.53c-.9.6-2.05.96-3.38.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.61A10 10 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.39 13.92A6 6 0 0 1 6.07 12c0-.67.12-1.32.32-1.92V7.47H3.04A10 10 0 0 0 2 12c0 1.61.38 3.14 1.04 4.53l3.35-2.61Z"/><path fill="#EA4335" d="M12 5.95c1.47 0 2.79.5 3.83 1.5l2.87-2.87A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.47l3.35 2.61C7.18 7.71 9.39 5.95 12 5.95Z"/></svg>;
}
