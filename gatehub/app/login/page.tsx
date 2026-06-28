import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { GoogleSignIn } from "@/components/google-sign-in";
import { auth, isGoogleConfigured } from "@/lib/auth";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const isOAuthFlow = typeof params.client_id === "string";
  const session = await auth.api.getSession({ headers: await headers() });

  if (session && !isOAuthFlow) {
    redirect("/dashboard");
  }

  return (
    <main className="login-page">
      <div className="login-decoration login-decoration-one" />
      <div className="login-decoration login-decoration-two" />

      <section className="login-card">
        <div className="login-logo" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="28" height="28">
            <path
              d="M7.5 10V7.5a4.5 4.5 0 0 1 9 0V10m-10 0h11a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
            <path
              d="M12 14v3"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <div className="login-heading">
          <h1>Giriş yap</h1>
          <p>Devam etmek için Google hesabınızı kullanın.</p>
        </div>

        <GoogleSignIn enabled={isGoogleConfigured()} />
      </section>
    </main>
  );
}
