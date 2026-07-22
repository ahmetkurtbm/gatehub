import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { PasswordResetForm } from "@/components/password-request-form";

export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  return <main className="login-page auth-blue-page"><section className="auth-blue-card compact"><div className="auth-blue-brand"><span><LockKeyhole size={20}/></span><strong>GateHub</strong></div><div className="login-copy"><h1>Yeni parola belirle</h1><p>Hesabın için güçlü ve daha önce kullanmadığın bir parola seç.</p></div><PasswordResetForm token={token}/><Link className="auth-back-link" href="/login">Giriş ekranına dön</Link></section></main>;
}
