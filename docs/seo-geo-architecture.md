# SEO + GEO Mimarisi

## SSR/SSG durumu

Tüm public sayfalar React Server Components ile render ediliyor; `(public)` route
group'undaki layout ve homepage tamamen server component (client JS'e bağımlı içerik yok).
İçerik ilk HTTP response'ta HTML olarak geliyor — crawler'a farklı içerik verilmiyor
(cloaking yok).

## Metadata

`src/lib/seo/metadata.ts` → `buildMetadata()` — her sayfa için tek, tutarlı bir noktadan:
title, description, canonical (`alternates.canonical`), robots, Open Graph, Twitter Card
üretiyor. Absolute URL'ler `NEXT_PUBLIC_SITE_URL`'den (`metadataBase`, root layout'ta
tanımlı) türetiliyor.

## Structured Data (JSON-LD)

`src/lib/seo/json-ld.ts` — reusable generator fonksiyonları:

- `organizationJsonLd()`, `websiteJsonLd()` — şu an `(public)/layout.tsx`'te her public
  sayfada render ediliyor (`jsonLdScriptProps()` helper'ı ile `<script type="application/ld+json">`
  olarak).
- `breadcrumbListJsonLd()`, `productJsonLd()`, `blogPostingJsonLd()` — fonksiyonlar hazır
  ama henüz hiçbir sayfada kullanılmıyor (ürün/proje/blog detay sayfaları henüz yok —
  Phase 9-11'de bağlanacak).

**Kural:** Şema, görünür içerikle uyuşmalı. Sahte `AggregateRating`, `Review`, ödül veya
sertifika şeması **eklenmeyecek** (master prompt bölüm 26/51) — bu tür veriler mevcut sitede
tespit edilmedi (`docs/current-site-inventory.md` bölüm 6).

## Sitemap

`src/app/sitemap.ts` — dinamik, DB'den besleniyor (Phase 9-11A). Homepage ve sabit
sayfaların (`/urunler`, `/projeler`, `/blog`, `/hakkimizda`, `/iletisim`) yanında, Neon'dan
`active` kategoriler, `PUBLISHED + active` ürünler, `PUBLISHED` projeler ve `PUBLISHED`
blog yazıları çekilip URL'e ekleniyor. `lastModified`, her kaydın gerçek `updatedAt`
alanından geliyor. Taslak (`DRAFT`) veya arşivlenmiş (`ARCHIVED`) içerik hiçbir zaman
sitemap'e girmiyor — sorgular zaten `status: PUBLISHED` filtresiyle çalışıyor.

## robots.txt

`src/app/robots.ts` — `*` için `/admin` ve `/api` disallow, geri kalan her şey allow.
Ayrıca master prompt bölüm 28'de istenen AI crawler'lar için (GPTBot, OAI-SearchBot,
ChatGPT-User, ClaudeBot, Claude-SearchBot, Claude-User, PerplexityBot, Perplexity-User,
Googlebot, Google-Extended, Bingbot) aynı politika ayrı ayrı tanımlı — hiçbiri toptan
engellenmiyor, sadece `/admin` ve `/api` hariç tutuluyor. `sitemap.xml` referansı dahil.

## llms.txt

`src/app/llms.txt/route.ts` — opsiyonel, minimal. Şu an sadece şirket adı + tek cümlelik
gerçek (doğrulanmış) açıklama + site URL'i içeriyor. Ürün/proje/blog URL'leri eklenmedi
(henüz gerçek route'ları yok) — içerik fazlarında genişletilecek. SSR/sitemap/structured
data'nın **yerine** kullanılmıyor, sadece onları tamamlıyor (bölüm 29).

## 404

`src/app/not-found.tsx` — gerçek Next.js 404 mekanizması (`notFound()` / eşleşmeyen route),
`noindex, nofollow` metadata'sı var, canonical üretmiyor, sitemap'e girmiyor. Bilinmeyen bir
URL homepage'e yönlendirilmiyor (bölüm 31/51 — "return 200 for nonexistent pages" yasak).

## Redirect engine

`Redirect` tablosu (Prisma) + `src/lib/redirects.ts` (60 sn TTL'li bellek-içi cache) +
`src/proxy.ts` (lookup + 301/308 uygulama). `docs/url-migration-map.md`'deki eski→yeni URL
eşlemesi, içerik migration'ı sırasında bu tabloya yazılacak (henüz otomatik yüklenmedi —
foundation fazında sadece motor hazır).

## Kabul testleri

Bkz. `docs/acceptance-tests.md` — curl tabanlı SSR/AI-crawler/sitemap/404 testleri.
