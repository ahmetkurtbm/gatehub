import { LockKeyhole } from "lucide-react";
import { TwoFactorChallenge } from "@/components/two-factor-challenge";
export default function TwoFactorPage(){return <main className="login-page auth-blue-page"><section className="auth-blue-card compact"><div className="auth-blue-brand"><span><LockKeyhole size={20}/></span><strong>GateHub</strong></div><div className="login-copy"><h1>Girişi doğrula</h1><p>Authenticator uygulamandaki kodu gir.</p></div><TwoFactorChallenge/></section></main>}
