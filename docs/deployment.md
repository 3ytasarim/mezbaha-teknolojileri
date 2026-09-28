# Deployment

**Durum: Bu proje henüz production'a deploy edilmedi.** Bu belge, foundation aşamasında
bilinen gereksinimleri ve Phase 16'da izlenecek adımları özetler.

## Ortam değişkenleri (production'da ayrıca girilmesi gereken)

Bkz. `.env.example` için tam liste. Özellikle:

- `DATABASE_URL`, `DIRECT_URL` — Neon connection string'leri
- `NEXT_PUBLIC_SITE_URL` — production canonical origin (www/non-www kararı burada sabitlenir)
- `AUTH_SECRET` — rastgele, güçlü bir değer (bu repo'daki dev değeri **production'da
  kullanılmamalı**, yeniden üretilmeli)
- `STORAGE_PROVIDER` + ilgili `STORAGE_*` değerleri — **local provider production için uygun
  değil** (serverless dosya sistemi kalıcı değil); production'a geçmeden önce S3-uyumlu bir
  implementasyon eklenmeli.
- `SEED_ADMIN_EMAIL` / `SEED_ADMIN_PASSWORD` — yalnızca ilk seed için, production seed'i
  yanlışlıkla tekrar çalıştırılırsa mevcut kullanıcı varsa atlanır (bkz. `prisma/seed.ts`).

## Migration stratejisi

- Development: `npm run db:migrate`
- Production: `npm run db:deploy` (`prisma migrate deploy`) — **destructive reset komutları
  hiçbir zaman production akışına eklenmemeli.**

## Canonical domain / www kararı

`NEXT_PUBLIC_SITE_URL` tüm canonical/OG/sitemap URL'lerinin kaynağı. www ↔ non-www ve
HTTP→HTTPS yönlendirmeleri bu projede (Next.js seviyesinde) değil, deployment platformu
seviyesinde (Vercel/Cloudflare) 301/308 ile uygulanmalı — henüz bir platform seçilmediği için
bu adım dokümante edilmiş ama uygulanmamış durumda.

## Bilinmeyenler / Phase 16'da netleştirilecek

- Hedef hosting platformu (Vercel önerilir, master prompt DevOps bölümünde de belirtiliyor)
- CDN/WAF (Cloudflare)
- Sentry / uptime monitoring kurulumu
- CI/CD pipeline (lint, typecheck, build, Lighthouse CI)
