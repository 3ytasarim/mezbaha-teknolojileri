# Mezbaha Teknolojileri — Website + Admin CMS

Next.js 16 (App Router, RSC) + Prisma 7 + Neon PostgreSQL ile geliştirilen kurumsal website
ve headless admin CMS. Bkz. `docs/` için mimari, database, SEO/GEO ve deployment detayları.

**Durum:** Foundation aşaması tamamlandı (Phase 0-6). Detaylı rapor için son commit mesajına
veya proje sohbet geçmişine bakın.

## Gereksinimler

- Node.js 22+ (Next.js 16 minimum 20.9.0 gerektiriyor)
- Bir Neon PostgreSQL veritabanı

## Kurulum

```bash
npm install
cp .env.example .env   # sonra gerçek DATABASE_URL / DIRECT_URL vb. değerleri girin
npm run db:migrate
npm run db:seed         # SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD .env'de tanımlıysa
npm run dev
```

`http://localhost:3000` — public site, `http://localhost:3000/admin` — admin panel.

## Script'ler

| Komut | Açıklama |
|---|---|
| `npm run dev` | Geliştirme sunucusu (Turbopack) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:migrate` | Yeni migration oluştur + uygula (dev) |
| `npm run db:deploy` | Bekleyen migration'ları uygula (production) |
| `npm run db:seed` | Seed script'ini çalıştır (superadmin oluşturur) |
| `npm run db:studio` | Prisma Studio |

## Dokümantasyon

- [`docs/architecture.md`](docs/architecture.md) — mimari kararlar ve gerekçeleri
- [`docs/database.md`](docs/database.md) — Prisma şema özeti
- [`docs/neon-setup.md`](docs/neon-setup.md) — Neon bağlantı mimarisi
- [`docs/admin-cms.md`](docs/admin-cms.md) — admin panel durumu
- [`docs/seo-geo-architecture.md`](docs/seo-geo-architecture.md) — SEO/GEO mimarisi
- [`docs/deployment.md`](docs/deployment.md) — deployment gereksinimleri
- [`docs/acceptance-tests.md`](docs/acceptance-tests.md) — curl tabanlı kabul testleri
- [`docs/current-site-inventory.md`](docs/current-site-inventory.md) — mevcut sitenin envanteri
- [`docs/url-migration-map.md`](docs/url-migration-map.md) — eski→yeni URL eşleme planı
