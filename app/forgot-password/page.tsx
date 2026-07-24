import Link from "next/link";
import { LockKeyhole } from "lucide-react";
import { PasswordRequestForm } from "@/components/password-request-form";

export default function ForgotPasswordPage() {
  return <main className="login-page auth-blue-page"><section className="auth-blue-card compact"><div className="auth-blue-brand"><span><LockKeyhole size={20}/></span><strong>GateHub</strong></div><div className="login-copy"><h1>Parolanı sıfırla</h1><p>E-posta adresini gir; sana güvenli bir bağlantı gönderelim.</p></div><PasswordRequestForm/><Link className="auth-back-link" href="/login">Giriş ekranına dön</Link></section></main>;
}
