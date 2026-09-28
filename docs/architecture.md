# Mimari

## Stack

- **Next.js 16.3.5** (App Router, React Server Components, Turbopack varsayılan)
- **React 19.2**
- **TypeScript** (strict mode)
- **Tailwind CSS v4**
- **Prisma ORM 7.10.0** — `prisma-client-js` generator (bkz. "Neden `prisma-client-js`" aşağıda)
- **Neon PostgreSQL** (serverless Postgres)
- **Zod** — server action / form doğrulama
- **@node-rs/argon2** — parola hash'leme (Argon2id)

## Önemli mimari kararlar

### Next.js 16 — `proxy.ts`, async APIs

Next.js 16, `middleware.ts` dosya adını `proxy.ts` olarak değiştirdi (fonksiyon adı `proxy`).
`params`, `searchParams`, `cookies()`, `headers()` artık tamamen asenkron — senkron erişim
kaldırıldı. Bu proje baştan itibaren Next.js 16 konvansiyonlarıyla yazıldı; `node_modules/next/dist/docs/`
altındaki paket-içi dokümantasyon, herhangi bir App Router değişikliği yapmadan önce referans
alınmalıdır (`AGENTS.md` bunu zorunlu kılar).

`src/proxy.ts` iki şey yapar:
1. `/admin/*` altında (login hariç) `admin_session` cookie'sinin **varlığını** kontrol eder
   (iyimser/optimistic kontrol — hızlı, DB'ye gitmez).
2. Public rotalar için `Redirect` tablosunu (60 sn'lik bellek-içi cache ile) kontrol edip
   301/308 uygular.

**Önemli:** Next.js'in kendi dokümantasyonu proxy/middleware'e güvenmemeyi, her sunucu
fonksiyonunda/sayfada authentication'ı ayrıca doğrulamayı öneriyor (bir matcher değişikliği
proxy korumasını sessizce kaldırabilir). Bu yüzden gerçek session doğrulaması
(`src/lib/auth/guard.ts` → `requireAdmin()`) her admin layout'unda ve gerektiğinde server
action'larda ayrıca çalışır. Proxy yalnızca hızlı bir "isteğe gerek yok" kısayolu.

### Neden `prisma-client-js` (ESM `prisma-client` değil)

Prisma 7'nin varsayılan yeni generator'ı (`prisma-client`) tamamen ESM çıktısı üretir ve
Next.js'in CommonJS/webpack tabanlı bundling'iyle önceki projelerde (PestShield) `EEXIST` /
modül çözümleme çakışmalarına yol açtığı gözlemlenmişti. Bu projede bilinçli olarak klasik
`prisma-client-js` generator'ı kullanılıyor (`prisma/schema.prisma`).

### Prisma 7 + Neon — driver adapter zorunlu

Prisma 7'de datasource URL'i artık `schema.prisma` içinde değil, `prisma.config.ts` içinde
tanımlanıyor (CLI/migration için). PrismaClient'ın çalışma zamanında bir **driver adapter**'a
ihtiyacı var — `datasources.url` runtime override'ı artık desteklenmiyor. Bu projede
`@prisma/adapter-pg` (standart `pg` sürücüsü) kullanılıyor (bkz. `src/lib/db.ts`).
Neon, standart Postgres wire protokolünü desteklediği için bu adapter sorunsuz çalışıyor;
edge/serverless ortamda `@prisma/adapter-neon` alternatifi de değerlendirilebilir ama bu
proje Node.js runtime'da self-host/Vercel Node runtime hedeflediği için `adapter-pg` tercih
edildi.

### İki connection string: `DATABASE_URL` (pooled) ve `DIRECT_URL` (direct)

Neon'un verdiği bağlantı dizesi `-pooler` host'unu kullanıyor (PgBouncer, transaction modu).
`prisma migrate` gibi şema işlemleri pooled bağlantıda güvenilir çalışmayabilir, bu yüzden
`-pooler` son ekini kaldırarak türetilen bir `DIRECT_URL` de `.env`'e eklendi ve
`prisma.config.ts` migration/CLI işlemlerinde `DIRECT_URL`'i kullanıyor. Runtime Prisma
Client (`src/lib/db.ts`) ise `DATABASE_URL` (pooled) ile bağlanıyor.

### Auth — DB tabanlı session, JWT değil

`AdminUser` + `Session` modelleri kullanılıyor. Login'de rastgele 32 byte token üretilir,
SHA-256 hash'i `Session.tokenHash` içinde saklanır (düz metin token DB'de tutulmuyor),
ham token httpOnly cookie olarak tarayıcıya yazılır. Şifreler Argon2id (`@node-rs/argon2`,
OWASP parametreleriyle: 19 MiB bellek, 2 iterasyon) ile hash'leniyor.

### Caching / revalidation (Phase 9-11A)

Public içerik sayfaları (`/urunler`, `/urun/[slug]`, `/projeler/[slug]`, `/blog/[slug]` vb.)
doğrudan Prisma ile sorgu yapan dinamik Server Component'lerdir — Next.js'in `fetch()`
Data Cache'i yalnızca `fetch()` çağrılarını sarar, doğrudan bir DB istemcisi (Prisma) ile
yapılan sorguları **cachelemez**. Bu proje `cacheComponents`/`"use cache"` kullanmıyor
(bilinçli tercih — Next.js 16 dokümantasyonu bunun rename-only bir değişiklik olmadığını,
`<Suspense>` dışında cachelenmemiş veri için build hatalarına yol açabileceğini belirtiyor).
Sonuç: her istek DB'den taze veri okur, ekstra bir invalidation mekanizmasına gerek yok.

Yine de her admin mutation'ı (`create*/update*/delete*Action`) ilgili public path'lerde
`revalidatePath()` çağırıyor — bunun amacı Data Cache değil, **Next.js Router Cache**'ini
(ziyaretçinin tarayıcısındaki client-side önbellek) ve olası statik/prerender edilmiş
segmentleri güncel tutmak. Örnek: bir ürün yayınlandığında `/urun/[slug]`, `/urunler`,
`/urunler/[categorySlug]`, `/` (öne çıkansa) ve `/sitemap.xml` revalidate edilir.

### Storage abstraction

`src/lib/storage/` — `StorageProvider` interface'i (`upload`/`delete`/`getPublicUrl`).
Şu an tek implementasyon `local` (dev için `public/uploads/` altına yazar). Production'da
S3-uyumlu bir sağlayıcı (`STORAGE_PROVIDER=s3` vb.) eklenmeden önce bu implementasyon
**production için kullanılmamalı** (serverless dosya sistemi kalıcı değildir).

## Klasör yapısı

```
src/
  app/
    (public)/          # Public site — header/footer + Organization/WebSite JSON-LD
      layout.tsx
      page.tsx          # Homepage (şu an minimal — Phase 8'de tamamlanacak)
    admin/               # Admin panel — requireAdmin() ile korumalı
      layout.tsx
      login/
      urunler/, projeler/, blog/, sayfalar/, medya/, talepler/, seo/, menu/, ayarlar/, kullanicilar/
    layout.tsx           # Root layout (html/body/font, admin+public ortak)
    not-found.tsx        # Gerçek 404
    sitemap.ts
    robots.ts
    llms.txt/route.ts
  lib/
    db.ts                # Prisma client singleton (adapter-pg)
    redirects.ts          # Redirect tablosu cache'li lookup (proxy.ts kullanır)
    auth/                # password.ts, session.ts, guard.ts
    seo/                  # metadata.ts, json-ld.ts, site.ts
    storage/               # StorageProvider abstraction
  components/admin/       # Admin shell (sidebar, nav-data, placeholder)
  proxy.ts                 # Route protection (cookie check) + redirect engine
prisma/
  schema.prisma
  seed.ts
  migrations/
prisma.config.ts           # Prisma 7 CLI config (datasource URL, seed command)
```

## Locale mimarisi

Şu an tek içerik dili **tr**, URL'lerde locale önyapısı **yok** (`/urunler`, `/urun/[slug]` vb.
— mevcut sitenin `/tr/` önekinden farklı, bkz. `docs/url-migration-map.md`). Veritabanı
modelleri (`*Translation` tabloları) `locale` alanını serbest `String` olarak tutuyor, böylece
ileride `en`/`de`/`ar`/`ru` eklenmesi migration gerektirmeden mümkün. Çevirisi olmayan bir
locale **yayınlanmamalı** — bu iş kuralı henüz uygulama katmanında (content fetch helper'ları)
inşa edilmedi, CMS/public listing fazında uygulanacak.
