import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { AppWindow, Filter, ScrollText, Search, UsersRound } from "lucide-react";
import { AdminControl } from "@/components/admin-controls";
import { AppHeader } from "@/components/app-header";
import { auth, isAdminUser } from "@/lib/auth";
import { query } from "@/lib/db";

export default async function AdminPage({searchParams}:{searchParams:Promise<{q?:string;userStatus?:string;appStatus?:string;action?:string}>}){
  const session=await auth.api.getSession({headers:await headers()});if(!session)redirect("/login");if(!isAdminUser(session.user))notFound();
  const filters=await searchParams;const q=filters.q?.trim()??"";
  const [users,apps,logs]=await Promise.all([
    // An empty filter is passed as '' and matches everything ("ilike '%%'").
    query<{id:string;name:string;email:string;role:string|null;banned:boolean|null}>(
      `select "id","name","email","role","banned" from "user"
       where ("name" ilike '%'||$1||'%' or "email" ilike '%'||$1||'%')
         and ($2 = '' or ($2 = 'banned' and "banned" is true) or ($2 = 'active' and "banned" is not true))
       order by "createdAt" desc limit 100`,[q,filters.userStatus??""]),
    query<{id:string;name:string|null;clientId:string;disabled:boolean|null}>(
      `select "id","name","clientId","disabled" from "oauthClient"
       where (coalesce("name",'') ilike '%'||$1||'%' or "clientId" ilike '%'||$1||'%')
         and ($2 = '' or ($2 = 'disabled' and "disabled" is true) or ($2 = 'active' and "disabled" is not true))
       order by "createdAt" desc limit 100`,[q,filters.appStatus??""]),
    query<{id:string;action:string;createdAt:Date;userEmail:string|null}>(
      `select l."id",l."action",l."createdAt",u."email" as "userEmail" from "auditLog" l left join "user" u on u."id" = l."userId"
       where l."action" ilike '%'||$1||'%' and ($2 = '' or l."action" ilike '%'||$2||'%' or u."email" ilike '%'||$2||'%')
       order by l."createdAt" desc limit 150`,[filters.action??"",q]),
  ]);
  return <main className="app-shell"><AppHeader current="admin" name={session.user.name} email={session.user.email} isAdmin/><div className="app-container"><section className="app-page-head"><div><span className="app-eyebrow">Yönetim</span><h1>GateHub yönetimi</h1><p>Kullanıcıları, uygulamaları ve son güvenlik hareketlerini kontrol et.</p></div></section>
    <form className="admin-filter-bar" method="get"><label><Search size={16}/><input name="q" defaultValue={q} placeholder="Kullanıcı, e-posta, uygulama veya olay ara"/></label><select name="userStatus" defaultValue={filters.userStatus??""}><option value="">Tüm kullanıcılar</option><option value="active">Aktif kullanıcılar</option><option value="banned">Engelli kullanıcılar</option></select><select name="appStatus" defaultValue={filters.appStatus??""}><option value="">Tüm uygulamalar</option><option value="active">Aktif uygulamalar</option><option value="disabled">Kapalı uygulamalar</option></select><input name="action" defaultValue={filters.action??""} placeholder="Audit olayı: auth.login"/><button className="ui-button ui-button-primary"><Filter size={15}/>Filtrele</button><a className="ui-button ui-button-neutral" href="/admin">Temizle</a></form>
    <div className="admin-grid"><section className="admin-panel"><div className="card-title"><span><UsersRound size={18}/></span><div><h2>Kullanıcılar</h2><p>{users.length} sonuç</p></div></div><div className="admin-rows">{users.map(u=><div key={u.id}><span className="app-user-avatar">{u.name.charAt(0).toUpperCase()}</span><div><strong>{u.name}</strong><small>{u.email} · {u.role??"user"}</small></div>{u.id!==session.user.id&&<AdminControl kind="user" id={u.id} disabled={Boolean(u.banned)}/>}</div>)}</div></section><section className="admin-panel"><div className="card-title"><span><AppWindow size={18}/></span><div><h2>Uygulamalar</h2><p>{apps.length} sonuç</p></div></div><div className="admin-rows">{apps.map(a=><div key={a.id}><span className="permission-icon"><AppWindow size={17}/></span><div><strong>{a.name??a.clientId}</strong><small>{a.clientId}</small></div><AdminControl kind="app" id={a.clientId} disabled={Boolean(a.disabled)}/></div>)}</div></section><section className="admin-panel admin-full"><div className="card-title"><span><ScrollText size={18}/></span><div><h2>Güvenlik kayıtları</h2><p>{logs.length} sonuç</p></div></div><div className="audit-rows">{logs.map(l=><div key={l.id}><code>{l.action}</code><span>{l.userEmail??"Sistem"}</span><small>{l.createdAt.toLocaleString("tr-TR")}</small></div>)}</div></section></div></div></main>;
}
