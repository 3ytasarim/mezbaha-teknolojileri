# Database

Bkz. `prisma/schema.prisma` — tek kaynak (source of truth).

## Model özeti

| Model | Amaç |
|---|---|
| `AdminUser`, `Session` | Admin authentication (Argon2id + DB-backed session) |
| `ProductCategory` (+ `ProductCategoryTranslation`) | Ürün kategorileri, çok dilli |
| `Product` (+ `ProductTranslation`, `ProductImage`, `ProductSpecification`, `ProductDocument`) | Ürünler |
| `Project` (+ `ProjectTranslation`, `ProjectImage`) | Referans projeler VE kapasite paketleri (bkz. "Project.type kararı" altında) |
| `BlogCategory`, `BlogTag`, `BlogPost` (+ `BlogPostTranslation`) | Blog |
| `Page` (+ `PageTranslation`) | Serbest CMS sayfaları (Hakkımızda, İletişim metni vb.) |
| `Media` | Merkezi medya kütüphanesi (dosya *içeriği* değil, metadata + URL) |
| `ContactSubmission`, `QuoteRequest` | Form gönderimleri |
| `SiteSetting` | Anahtar/değer site ayarları |
| `Redirect` | 301/308 yönlendirme tablosu (`proxy.ts` tarafından cache'li okunur) |
| `NavigationItem` | Nested menü (header/footer), `parentId` self-relation |

## Kimlik stratejisi

Tüm modellerde `@default(cuid())` ile `String` id kullanılıyor (UUID değil) — proje genelinde
tutarlı.

## Çok dilli içerik

Her içerik modeli, ayrı bir `*Translation` tablosuna sahip; `unique(parentId, locale)`
constraint'i ile bir içerik/locale kombinasyonu tek satır. `locale` alanı serbest `String`
(enum değil) — yeni bir dil eklemek migration gerektirmez, sadece uygulama katmanında
desteklenen locale listesine eklenir.

## Index stratejisi

Master prompt'ta belirtilen sorgu paternlerine göre index'lendi:

- `slug` alanları zaten `@unique` (otomatik index)
- `status`, `featured`, `categoryId`, `publishedAt`, `createdAt`, `locale` alanlarında
  ayrık index'ler var (bkz. şemadaki `@@index` satırları)
- `Session.expiresAt` ve `Session.tokenHash` (`@unique`) — login/logout hot path
- `Redirect.sourcePath` `@unique` — proxy lookup

## Project.type kararı (Phase 9-11A)

Inventory'de (`current-site-inventory.md` §4) iki farklı "proje" kavramı tespit edildi:
gerçek uluslararası referans projeler (ülke/şehir/kapasite ile) ve C-50...C-300 "kapasite
paketleri" (Türkiye'deki hazır tesis paketleri). Bunlar farklı içerik türleri olduğu için
ayrı entity'ler gibi görünse de, alan şeması (isim/ülke/kapasite/alan/görsel/açıklama)
neredeyse birebir örtüşüyor — ayrı tablo oluşturmak gereksiz karmaşıklık olurdu.

**Karar:** Tek `Project` modeli korundu, ayırt edici olarak `ProjectType` enum'ı
(`REFERENCE` / `CAPACITY_SOLUTION`) eklendi (bkz. migration
`20260918144717_project_type_and_related_content`). Public sorgular
(`src/lib/queries.ts` → `getReferenceProjects()`, `getCapacitySolutions()`) bu alana göre
filtreleniyor. `/projeler` sayfası her iki türü de ayrı bölümlerde gösteriyor.

Aynı migrationda `Product ↔ Project ↔ BlogPost` arasında üç adet implicit many-to-many
ilişki eklendi (`relatedProjects`, `relatedPosts` vb.) — admin editörlerinde "İlgili
Ürünler/Projeler/Makaleler" çoklu-seçim alanlarını besliyor, public sayfalarda gerçek
`<a href>` linkleri olarak render ediliyor.

Ayrıca `Project.sortOrder` (varsayılan `0`) eklendi (migration
`20260918145941_project_sort_order`) — diğer tüm içerik modellerinde zaten var olan alan
Project'te eksikti; kapasite paketlerinin (C-50 → C-300) doğru sırada listelenebilmesi için
gerekliydi.

## Migration disiplini

- **Geliştirme:** `npm run db:migrate` (`prisma migrate dev`)
- **Production:** `npm run db:deploy` (`prisma migrate deploy`) — **asla** `db push --force-reset`
  veya production'da destructive reset kullanılmaz.
- İlk migration: `prisma/migrations/20260918074050_init/` — Neon'a uygulandı ve doğrulandı.

## Seed

`prisma/seed.ts` — yalnızca `SEED_ADMIN_EMAIL` + `SEED_ADMIN_PASSWORD` env değişkenleri
tanımlıysa ve o e-posta ile kullanıcı yoksa bir `SUPERADMIN` oluşturur. Parola asla log'a
yazılmaz (yalnızca "oluşturuldu" mesajı basılır). Çalıştırma: `npm run db:seed`.

## Bağlantı mimarisi (Neon)

Bkz. `docs/neon-setup.md`.
