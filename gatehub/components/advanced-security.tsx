"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { KeyRound, ShieldCheck, Trash2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function AdvancedSecurity({ enabled, hasPassword }: { enabled: boolean; hasPassword: boolean }) {
  const [qr, setQr] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function enable() {
    setBusy(true); setMessage(null);
    const result = await authClient.twoFactor.enable({ password: hasPassword ? password : undefined, issuer: "GateHub" });
    if (result.error) setMessage(result.error.message ?? "2FA başlatılamadı.");
    else if (result.data) {
      setQr(await QRCode.toDataURL(result.data.totpURI, { width: 220, margin: 1 }));
      setBackupCodes(result.data.backupCodes);
    }
    setBusy(false);
  }

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage(null);
    const code = String(new FormData(event.currentTarget).get("code") ?? "");
    const result = await authClient.twoFactor.verifyTotp({ code });
    if (result.error) setMessage(result.error.message ?? "Kod geçersiz.");
    else { setMessage("İki aşamalı doğrulama etkinleştirildi."); setTimeout(() => window.location.reload(), 800); }
    setBusy(false);
  }

  async function disable() {
    if (!confirm("İki aşamalı doğrulama kapatılsın mı?")) return;
    setBusy(true);
    const result = await authClient.twoFactor.disable({ password: hasPassword ? password : undefined });
    setMessage(result.error ? (result.error.message ?? "2FA kapatılamadı.") : "İki aşamalı doğrulama kapatıldı.");
    if (!result.error) setTimeout(() => window.location.reload(), 800);
    setBusy(false);
  }

  async function deleteAccount() {
    if (!confirm("GateHub hesabın, uygulamaların ve tüm oturumların kalıcı olarak silinecek. Emin misin?")) return;
    setBusy(true); setMessage(null);
    const result = await authClient.deleteUser({ password: hasPassword ? password : undefined, callbackURL: "/login" });
    if (result.error) { setMessage(result.error.message ?? "Hesap silinemedi."); setBusy(false); }
    else window.location.href = "/login";
  }

  return <div className="account-layout advanced-security-grid">
    <section className="account-card account-wide">
      <div className="card-title-row"><div className="card-title"><span><ShieldCheck size={18}/></span><div><h2>İki aşamalı doğrulama</h2><p>Authenticator uygulaması ve tek kullanımlık yedek kodlar</p></div></div><span className={`status-badge ${enabled ? "on" : "off"}`}>{enabled ? "Etkin" : "Kapalı"}</span></div>
      {hasPassword && <label className="security-password-field">Mevcut parola<input value={password} onChange={(event)=>setPassword(event.target.value)} type="password" autoComplete="current-password" placeholder="Güvenlik işlemleri için"/></label>}
      {!enabled && !qr && <button className="ui-button ui-button-primary" disabled={busy || (hasPassword && !password)} onClick={enable}><KeyRound size={15}/>2FA kurulumu başlat</button>}
      {qr && <div className="two-factor-setup"><Image src={qr} alt="Authenticator QR kodu" width={220} height={220} unoptimized/><div><h3>QR kodunu tara</h3><p>Google Authenticator, Microsoft Authenticator veya uyumlu bir uygulamayla tara; ardından oluşan 6 haneli kodu gir.</p><form onSubmit={verify}><input name="code" inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="000000" required/><button className="ui-button ui-button-primary" disabled={busy}>Doğrula ve etkinleştir</button></form></div></div>}
      {backupCodes.length > 0 && <div className="backup-code-box"><strong>Yedek kodlarını güvenli bir yere kaydet</strong><div>{backupCodes.map((code)=><code key={code}>{code}</code>)}</div></div>}
      {enabled && <button className="ui-button ui-button-danger" disabled={busy || (hasPassword && !password)} onClick={disable}>2FA&apos;yı kapat</button>}
      {message && <p className="account-notice">{message}</p>}
    </section>
    <section className="account-card account-wide danger-zone"><div className="card-title-row"><div className="card-title"><span><Trash2 size={18}/></span><div><h2>Hesabı sil</h2><p>Profil, oturum, izin ve OAuth uygulamalarını kalıcı olarak siler</p></div></div><button className="ui-button ui-button-danger" disabled={busy || (hasPassword && !password)} onClick={deleteAccount}><Trash2 size={15}/>Hesabı kalıcı sil</button></div></section>
  </div>;
}
