# Neon Setup

## Bağlantı yapısı

Neon, bir proje için iki host adı sunar:

- **Pooled** (PgBouncer, transaction modu) — host adında `-pooler` son eki var.
  Uygulama runtime bağlantıları (Prisma Client, `@prisma/adapter-pg`) bunu kullanır.
- **Direct** — `-pooler` son eki olmadan aynı host. Şema migration'ları (prepared
  statement / advisory lock gerektiren işlemler) için önerilir.

Bu projede:

- `DATABASE_URL` → pooled host, `src/lib/db.ts` runtime Prisma Client'ı bunu kullanır.
- `DIRECT_URL` → pooled host adından `-pooler` çıkarılarak türetildi, `prisma.config.ts`
  migration/CLI işlemlerinde bunu kullanır.

İki URL de bağlantı testinden geçti (`npx prisma db execute --stdin` ile `SELECT 1`) ve
ilk migration (`prisma migrate dev --name init`) başarıyla Neon'a uygulandı.

## Driver adapter

Prisma 7, PrismaClient için bir driver adapter zorunlu kılıyor (bkz. `docs/architecture.md`).
`@prisma/adapter-pg` (standart `pg` paketi) kullanılıyor — Neon standart Postgres wire
protokolünü desteklediği için ek bir Neon-specific sürücüye (`@prisma/adapter-neon`,
WebSocket tabanlı) ihtiyaç yok. Edge runtime'da çalıştırma ihtiyacı doğarsa (bu proje şu an
Node.js runtime hedefliyor) `@prisma/adapter-neon`'a geçiş değerlendirilebilir.

## Connection pooling / serverless davranışı

`src/lib/db.ts`, development'ta hot-reload sırasında birden fazla `PrismaClient` örneği
oluşmasını önlemek için `globalThis` üzerinde singleton pattern kullanıyor (Next.js/Prisma'nın
standart önerisi). Production'da (Vercel gibi serverless platformlarda) her fonksiyon
instance'ı kendi bağlantı havuzunu açacağından, Neon'un pooled bağlantısı (`DATABASE_URL`)
bu senaryo için zaten doğru seçim.

## Bilinen, engelleyici olmayan uyarı

`pg` sürücüsü, `sslmode=require` (Neon'un varsayılan connection string'inde kullandığı mod)
için gelecekteki bir major sürümde davranış değişikliği konusunda bir deprecation uyarısı
basıyor (`SECURITY WARNING: The SSL modes 'prefer', 'require'... are treated as aliases for
'verify-full'`). Şu an fonksiyonel bir sorun değil, sadece bilgilendirme. İleride connection
string'e `uselibpqcompat=true` eklenmesi değerlendirilebilir.

## Kimlik bilgileri

`DATABASE_URL` / `DIRECT_URL` değerleri yalnızca `.env` içinde tutuluyor (`.gitignore`'da
`.env*` zaten hariç tutulmuş durumda — hiçbir zaman commit edilmedi). Production deployment'ta
bu değerler hosting platformunun (Vercel vb.) environment variable panelinden ayrıca
girilmelidir.
