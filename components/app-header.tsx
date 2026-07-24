import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { SignOutButton } from "@/components/sign-out-button";

type CurrentPage = "apps" | "account" | "admin";

export function AppHeader({ current, name, email, isAdmin }: { current: CurrentPage; name: string; email: string; isAdmin: boolean }) {
  return (
    <header className="app-header">
      <div className="app-header-inner">
        <Link href="/dashboard" className="app-logo"><span><ShieldCheck size={20}/></span><strong>GateHub</strong></Link>
        <nav className="app-nav" aria-label="Ana menü">
          <Link className={current === "apps" ? "active" : ""} href="/dashboard">Uygulamalar</Link>
          <Link className={current === "account" ? "active" : ""} href="/account">Hesap ve güvenlik</Link>
          {isAdmin && <Link className={current === "admin" ? "active" : ""} href="/admin">Yönetim</Link>}
        </nav>
        <div className="app-user-menu">
          <span className="app-user-avatar">{name.charAt(0).toUpperCase()}</span>
          <span className="app-user-copy"><strong>{name}</strong><small>{email}</small></span>
          <SignOutButton />
        </div>
      </div>
    </header>
  );
}
