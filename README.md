# GateHub

GateHub, birden fazla uygulama için merkezi kimlik doğrulama ve SSO altyapısıdır. Kullanıcılar burada oturum açar, diğer uygulamalar (ör. [QuestionToTest](https://github.com/ahmetkurtbm/questiontotest), [CarRenting](https://github.com/ahmetkurtbm/carrenting)) GateHub üzerinden OAuth 2.1 / OpenID Connect ile giriş yapar.

## Özellikler

- **Merkezi oturum açma** — tek kullanıcı hesabı, birden fazla uygulamada tek giriş
- **OAuth istemci yönetimi** — her uygulama için kayıtlı client_id / client_secret (secret veritabanında hash'lenmiş şekilde saklanır)
- **Consent ekranı** — kullanıcıya hangi uygulamanın hangi bilgilere erişeceğini gösteren onay adımı
- **OIDC uyumlu callback akışı** — bağlı uygulamalar standart `/api/auth/callback/gatehub` yoluyla oturum bilgisini alır

## Teknoloji Yığını

| Katman | Teknoloji |
|---|---|
| Uygulama | Next.js (App Router), TypeScript |
| Kimlik | OAuth 2.1 / OpenID Connect sağlayıcı implementasyonu |
| Veri | PostgreSQL + Prisma ORM |

## Canlı Demo

[gatehub-orcin.vercel.app](https://gatehub-orcin.vercel.app/)
