# GateHub

GateHub, birden fazla uygulama için merkezi kimlik doğrulama ve SSO altyapısıdır. Kullanıcılar burada oturum açar, bağlı uygulamalar GateHub üzerinden OAuth 2.1 / OpenID Connect ile giriş yapar. Örnek istemci: [ControlPanel](https://github.com/ahmetkurtbm/controlpanel).

## Özellikler

- **Merkezi oturum açma** — tek kullanıcı hesabı, birden fazla uygulamada tek giriş
- **OAuth istemci yönetimi** — her uygulama için kayıtlı client_id / client_secret (secret veritabanında hash'lenmiş şekilde saklanır)
- **Consent ekranı** — kullanıcıya hangi uygulamanın hangi bilgilere erişeceğini gösteren onay adımı
- **OIDC uyumlu callback akışı** — bağlı uygulamalar standart `/api/auth/callback/gatehub` yoluyla oturum bilgisini alır
- **Hesap güvenliği** — iki adımlı doğrulama, son 5 parolanın tekrar kullanılamaması, yeni cihaz uyarısı, oturum yönetimi, hız sınırı
- **Yönetim** — kullanıcı ve uygulama engelleme, aranabilir güvenlik kayıtları (audit log)

## Çalışma modları

| Mod | Ne zaman | Veritabanı |
|---|---|---|
| **Demo** | `DATABASE_URL` boşken (Vercel) | [PGlite](https://pglite.dev): Postgres sunucu sürecinin içinde çalışır, migration'lar ve bir demo yönetici hesabı açılışta yüklenir. Girişte "Demo hesabıyla gir" düğmesi vardır; e-posta doğrulaması kapalıdır. |
| **Yerel** | `DATABASE_URL` tanımlıyken | Docker'daki PostgreSQL 17; veri kalıcıdır, e-posta doğrulaması açıktır |

ORM kullanılmaz: kendi sorgular düz SQL ile `lib/db.ts` üzerinden, better-auth ise aynı veritabanına
doğrudan (`pg` havuzu ya da PGlite için Kysely dialect'i) bağlanır.

## Kurulum

```bash
npm install
docker compose up -d   # PostgreSQL 17, localhost:5437
npm run db:setup       # migration'lar
npm run dev            # http://localhost:3000
```

`.env` içinde `DATABASE_URL=postgres://gatehub:gatehub@localhost:5437/gatehub`, `BETTER_AUTH_SECRET` ve
`BETTER_AUTH_URL` gerekir. Google girişi ve e-posta gönderimi (Gmail SMTP) isteğe bağlıdır.

## Veritabanı

Şema `db/migrations/` altındadır ve sırayla uygulanır (`schema_migrations` tablosunda tutulur).
`npm run db:reset` yerel veritabanını silip baştan kurar; uzak bir sunucuda çalışmayı reddeder.

**Yedekleme:** Kalıcı veri yalnızca yerel veritabanındadır. Gerekirse
`docker compose exec db pg_dump -U gatehub gatehub > yedek.sql` ile alınır.

## Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Uygulama | Next.js 16 (App Router), TypeScript |
| Kimlik | better-auth + OAuth 2.1 / OpenID Connect sağlayıcı eklentisi |
| Veri | PostgreSQL (düz SQL, `pg`) · demo modunda PGlite |

## Canlı Demo

[gatehub-ahmetkurt.vercel.app](https://gatehub-ahmetkurt.vercel.app/)
