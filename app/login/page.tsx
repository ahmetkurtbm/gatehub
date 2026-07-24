import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { auth, isGoogleConfigured } from "@/lib/auth";

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const isOAuthFlow = typeof params.client_id === "string";
  const session = await auth.api.getSession({ headers: await headers() });
  if (session && !isOAuthFlow) redirect("/dashboard");

  return (
    <main className="login-page auth-blue-page">
      <div className="login-orb login-orb-one" />
      <div className="login-orb login-orb-two" />
      <section className="auth-blue-card">
        <div className="auth-blue-brand"><span><LockKeyhole size={20} /></span><strong>GateHub</strong></div>
        <div className="login-copy">
          <h1>Hesabına giriş yap</h1>
          <p>{isOAuthFlow ? "Uygulamaya güvenle devam etmek için giriş yap." : "Hesabına erişmek için bilgilerini gir."}</p>
        </div>
        <AuthForm googleEnabled={isGoogleConfigured()} />
      </section>
    </main>
  );
}
