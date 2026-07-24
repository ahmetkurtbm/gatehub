# GateHub

GateHub, birden fazla uygulama için merkezi kimlik ve giriş servisidir. Kullanıcılar Google hesabıyla GateHub'a giriş yapar; diğer uygulamalar GateHub'a OAuth 2.1 / OpenID Connect istemcisi olarak bağlanır.

## Özellikler

- Google ile giriş
- PostgreSQL ve Prisma üzerinde kalıcı kullanıcı/oturum verisi
- OAuth 2.1 Authorization Code + PKCE
- OpenID Connect discovery ve UserInfo
- Access token, refresh token, izin ve istemci yönetimi
- Panelden yeni OAuth istemcisi oluşturma
- Uygulama bazlı izin ekranı

## Kurulum

1. Örnek ortam dosyasını `.env` olarak kopyala ve değerleri doldur:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/gatehub"
BETTER_AUTH_SECRET="en-az-32-karakterlik-rastgele-bir-deger"
BETTER_AUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="google-client-id"
GOOGLE_CLIENT_SECRET="google-client-secret"
```

2. Google Cloud Console içinde Web application türünde OAuth istemcisi oluştur. Authorized redirect URI olarak şunu ekle:

```text
http://localhost:3000/api/auth/callback/google
```

Üretimde aynı yolun HTTPS kullanan gerçek alan adını ekle.

3. Bağımlılıkları ve veritabanını hazırla:

```bash
npm install
npm run db:generate
npm run db:deploy
npm run dev
```

Uygulama `http://localhost:3000` adresinde açılır.

## Başka bir projeyi bağlama

1. GateHub'a giriş yap ve panelden OAuth istemcisi oluştur.
2. Projenin callback URL'sini gir.
3. Oluşan `client_id` ve `client_secret` değerlerini projene kaydet.
4. Projede issuer/discovery adresi olarak şunu kullan:

```text
http://localhost:3000/api/auth
```

Discovery belgesi:

```text
http://localhost:3000/api/auth/.well-known/openid-configuration
```

İstenen scope'lar:

```text
openid profile email offline_access
```

## Komutlar

```bash
npm run dev          # geliştirme sunucusu
npm run lint         # kod kalite kontrolü
npm run build        # üretim derlemesi
npm run db:generate  # Prisma Client üret
npm run db:migrate   # yerel migration oluştur/uygula
npm run db:deploy    # mevcut migration'ları uygula
```

`BETTER_AUTH_SECRET` üretimde güçlü ve benzersiz olmalı. `.env` dosyasını Git'e ekleme.
