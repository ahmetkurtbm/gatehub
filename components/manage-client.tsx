"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, Settings2, X } from "lucide-react";

export function ManageClient({ clientId, name, callbackUrl }: { clientId: string; name: string; callbackUrl: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [secret, setSecret] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError(null);
    const data = new FormData(event.currentTarget);
    const response = await fetch(`/api/oauth-clients/${encodeURIComponent(clientId)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: data.get("name"), redirectUri: data.get("redirectUri") }) });
    if (!response.ok) setError("Uygulama güncellenemedi."); else { setOpen(false); router.refresh(); }
    setBusy(false);
  }

  async function rotate() {
    if (!confirm("Mevcut client secret hemen geçersiz olacak. Devam edilsin mi?")) return;
    setBusy(true); setError(null);
    const response = await fetch(`/api/oauth-clients/${encodeURIComponent(clientId)}`, { method: "POST" });
    const body = await response.json();
    if (!response.ok) setError(body.error ?? "Secret yenilenemedi."); else setSecret(body.client_secret);
    setBusy(false);
  }

  return <>
    <button type="button" className="ui-button ui-button-neutral" onClick={() => setOpen((value) => !value)}><Settings2 size={15}/>{open ? "Kapat" : "Düzenle"}</button>
    {open && <div className="client-editor-inline">
      <div className="client-editor-head"><div><strong>Uygulamayı düzenle</strong><span>Ad, callback adresi ve secret yönetimi</span></div><button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="Kapat"><X size={17}/></button></div>
      <form onSubmit={save} className="client-editor-form"><label>Uygulama adı<input name="name" defaultValue={name} required/></label><label>Callback URL<input name="redirectUri" type="url" defaultValue={callbackUrl} required/></label><div className="editor-actions"><button className="ui-button ui-button-primary" disabled={busy}>Değişiklikleri kaydet</button><button type="button" className="ui-button ui-button-neutral" disabled={busy} onClick={rotate}><KeyRound size={15}/>Client secret yenile</button></div></form>
      {secret && <div className="secret-result"><strong>Yeni secret</strong><code>{secret}</code><small>Bu değer tekrar gösterilmez. Bağlı projendeki eski secret ile değiştir.</small></div>}
      {error && <p className="form-error">{error}</p>}
    </div>}
  </>;
}
