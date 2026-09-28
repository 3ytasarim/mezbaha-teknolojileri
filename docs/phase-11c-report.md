# Phase 11C Report — Production Readiness & Migration Gap Closure

Tarih: 2026-09-23 · Kapsam: production build (`next start`) üzerinde yerel doğrulama. **Deploy yapılmadı, push yapılmadı, DB reset/silme yapılmadı.**

## Özet

| # | Madde | Durum |
|---|---|---|
| 1 | Production SITE URL | **BLOKE — alan adı dokümanlarda kesin değil, sizden değer gerekiyor.** Mekanizma doğrulandı. |
| 2 | 3 eski URL | 1 redirect eklendi; 2 tanesi yeni sayfa kararı bekliyor (redirect UYDURULMADI) |
| 3 | 3 ölü iç link | 2 gerçek eşleme, 1 link kaldırıldı; ayrıca 22 eski-ana-sayfa linki göreli yapıldı |
| 4 | Ürün PDF'leri | **0 doküman var** (kaynakta hiç PDF yok). Phase 11B'deki "fileSize 0 doküman" notu yanlıştı — düzeltildi. |
| 5 | Görsel denetimi | 65 dosya >500 KB (101.6 MB); teslimat WebP ~33 KB @640w. Orijinallere dokunulmadı. |
| 6 | Uzun title / BÜYÜK HARF | Rapor üretildi; DB'ye yazılmadı. |
| 7 | Yayın tarihleri | 29 yazı için kaynak-destekli tarih yazıldı; 0 belirsiz kaldı. 3 eski damgalı tarih dokunulmadan raporlandı. |
| 8 | Featured | Rapor üretildi; hiçbir bayrak değişmedi. |
| 9 | Admin UI | Kimlik bilgisiz yapılabilen her şey test edildi; kalan tıklama testleri `phase-11c-manual-actions.md`'de. |
| 10 | Lighthouse | 14 çalıştırma; A11y/BP/SEO = 100, masaüstü Perf 98–100, mobil Perf 83–90. |
| 11 | Final doğrulama | tsc / lint / build temiz; sitemap, link, redirect, metadata, JSON-LD, SSR, AI-crawler geçti. |
| 12 | Güvenlik | Hiçbir sır yazılmadı/basılmadı; rotasyon prosedürü manual-actions'ta. |

## 1. Production Site URL — BLOKE

- `NEXT_PUBLIC_SITE_URL` şu an `http://localhost:3000` (`.env`, `.env.example`). `src/lib/seo/site.ts` yalnızca bu değişkeni okur.
- Dokümanlarda yeni sitenin üretim alan adı **belirtilmemiş**: `docs/url-migration-map.md` yalnızca ESKİ sitenin `https://www.mezbahateknolojileri.com` olduğunu söyler; `docs/deployment.md` "www ↔ non-www kararı"nı açıkça **verilmemiş** olarak işaretler. Tahmin edilmedi. → **Sizden gereken: tam origin** (ör. `https://www…` mı apex mi). Bkz. manual-actions #1.
- **Mekanizma kanıtı** (sahte `https://placeholder-origin.example` ile ayrı bir build; sonra normal build'e dönüldü): 123/123 sitemap `<loc>`, `robots.txt` `Sitemap:`, canonical, `og:url`, `og:image`, JSON-LD `url`/`image`, `llms.txt` — hepsi değişkeni izliyor, çıktıda **0 `localhost`**. Değeri verdiğinizde başka kod değişikliği gerekmiyor.
- Not: `src/content/home.ts` içindeki 3 **fallback** blog linki (DB boşken kullanılır) eski sitenin mutlak `/tr/...` URL'lerine işaret ediyor; DB doluyken görünmez. Alan adı kesinleşince göreli yapılması önerilir.

## 2. Eski URL'ler

Eski sitede gerçek içerik incelendi:

| Eski URL | Gerçekte ne | Karar |
|---|---|---|
| `/tr/online-magazamiz-yayinda/` | Kısa duyuru: harici bir online satış sitesini duyuruyor. Aynı içerik zaten yeni sitede yazı olarak var (`/blog/online-magazamiz-yayinda`). | **301 eklendi** → `/blog/online-magazamiz-yayinda` (1:1). Map'teki "doğrulanmadı" notu yüzünden importer atlamıştı; not, sayfa incelenerek düzeltildi. |
| `/tr/mezbaha-makina-sistemleri-katalog/` | "2018 Mezbaha Sistemleri Katalog" — 155 sayfalık **görüntü tabanlı flipbook** (PDF değil, 164 img). | **Redirect YOK.** Map'in önerdiği `/teklif-al` yeni sitede yok; kataloğun anlamsal karşılığı bir **Kataloglar sayfası**. Yeni sayfa gerekiyor (bkz. Kararlar). |
| `/tr/mezbaha-sistemleri-videolar-941/` | 17 gömülü YouTube videosu galerisi. | **Redirect YOK.** Map'in `/projeler#videolar` hedefi yok. Anlamsal karşılık bir **Videolar sayfası** (video ID'leri gerçek veri, içerik uydurmayı gerektirmez). |

Ek keşif: `/tr/endustriyel-sogutma-sistemleri/` eski sitede **200** dönen gerçek bir hizmet sayfası (~3000 karakter metin); sitemap'te ve map'te yoktu → şu an yeni sitede karşılığı yok, redirect eklenmedi. Yeni "Soğutma Sistemleri" hizmet sayfası kararı bekliyor.

Ayrıca `/tr/kataloglar/` (katalog listesi) da eşlenmemiş durumda (Kataloglar sayfasıyla aynı karar).

## 3. Ölü iç blog linkleri

Eski sitede doğrulama: `/mezbaha-makinalari` ve `/robotik-mezbaha-sistemleri` **zaten 404**; `/endustriyel-sogutma-sistemleri` (`/tr/`siz) 404.

| Link | Yazılar | Karar |
|---|---|---|
| `/mezbaha-makinalari` (anchor: "mezbaha makineleri", "kesimhane malzemeleri", "Modern kesim makineleri") | 5 yazı | → `/urunler` (tüm makine kataloğu, gerçek anlamsal eşleşme) |
| `/robotik-mezbaha-sistemleri` (anchor: "Robotik") | 1 yazı | → `/blog/robotik-mezbaha-sistemleri-nedir` (aynı konuda yayınlı makale) |
| `/endustriyel-sogutma-sistemleri` (anchor: "Soğutma sistemleri") | 1 yazı | Yeni sitede uygun hedef yok → **link kaldırıldı, metin korundu** (sayfa kararı gelince geri eklenebilir) |
| Eski sitenin ana sayfası (`https://mezbahateknolojileri.com/`) | 21 yazı + 1 ürün | → göreli `/` (kesinleşmemiş mutlak alan adına sabitlenmedi) |

Uygulama: `prisma/migration/link-overrides.ts` (+ `fix-blog-links.ts`). Importer aynı dönüşümü uyguluyor → tekrar çalıştırma 0 fark üretiyor (dry-run: 55 ürün / 32 yazı atlandı, 0 güncelleme).
Doğrulama: DB'de içerik alanlarında eski alan adına **0 ölü link**; 123 iç link hedefi 0 kırık / 0 yönlendirmeli; 101 redirect'in 101'i 301 + tek adım + hedef 200.

## 3b. Yeni bulgu: gövde görselleri hotlink'liydi (düzeltildi)

Blog gövdelerindeki **99 `<img>`'in tamamı** eski alan adından (`mezbahateknolojileri.com/uploads/news/...`) hotlink'liydi — Phase 11B "görseller yerel, hotlink yok" kuralına aykırı; cutover sonrası kırılacaktı. Yerel kopyaların hepsi zaten vardı: 99/99 yerel yola çevrildi (31 yazı), gerçek `width`/`height` eklendi (CLS), eksik kopya 0. `prisma/migration/localize-images.ts` + `fix-blog-images.ts`; importer'a da eklendi. Sanitizer'a `loading` özniteliği izni eklendi.

## 4. Ürün PDF dokümanları

- DB: `ProductDocument` = **0** kayıt. Kaynak JSON'larda (55 ürün) `documents` = 0. 45 önbellekli + 11 canlı ürün sayfası ve `/tr/kataloglar/`, `/tr/mezbaha-makina-sistemleri-katalog/` taranarak `.pdf/.doc/.xls/.zip/.rar` ve `download` özniteliği aranmış: **hiç yok**.
- Sonuç: indirilecek/başarısız PDF **yok**; placeholder PDF üretilmedi. **Phase 11B raporundaki "ürün dokümanları kaynak URL ile fileSize 0 saklı" ifadesi yanlıştı** (importer destekliyor ama veri yoktu) — düzeltildi.
- 2018 katalog PDF değil, görüntü flipbook'u; PDF'ye dönüştürüp yayınlamak yeni içerik üretimi olur → karar sizde (Kararlar).

## 5. Görsel optimizasyon denetimi (`docs/image-optimization-audit.md`)

- >500 KB: **65 dosya / 101.6 MB** (60 taşınan ürün görseli + hero + 4 eski ürün PNG). Tümü 1280×1280 (2'si 1280×853, 1'i 1280×960, hero 1920×700), çoğu PNG.
- `/_next/image` ile teslimat (WebP, q=75): ortalama **33 KB @640w, 86 KB @1200w**, 0 hata → ziyaretçi tarafında orijinal boyut **hiç iletilmiyor**.
- Orijinali küçültmenin ek faydası: kullanıcı için ~yok (optimizer zaten çıktıyı üretip cache'liyor). Kalan kazanç: depo/yedek boyutu, ilk (cache-miss) istekte optimizer CPU süresi. **Orijinallere dokunulmadı.**
- Öneri (uygulanmadı): `images.formats: ["image/avif","image/webp"]` (AVIF varsayılan değil); orijinalleri ileride kayıpsız PNG→WebP/lossless optimize etmek, uzun vadede CDN/Blob'a taşımak.

## 6. Editoryal rapor — `docs/editorial-review.md`

Şablonla render edilen title >70 karakter: **39** (14 ürün, 23 yazı, 2 proje) — Phase 11B'de 40 sayılmıştı; `cleanTitle` sonrası 39. **20** BÜYÜK HARF ürün adı. Her satırda tür, mevcut title, uzunluk, kaynak URL ve **ÖNERİ (onaysız)** var. Öneriler mekanik üretildi ve **DB'ye yazılmadı**.

## 7. Yayın tarihleri — `docs/publish-date-evidence.md`

- Kaynak JSON-LD/meta/`<time>` **yok**. Kanıt: kaynak `/tr/blog/` listesindeki her kartın `title="30 December 2025 08:12"` tooltip'i (yıl dahil; 32/32 kart). Her tarih, yazı sayfasından çıkarılan gün+ay ile **birebir eşleşince** kabul edildi; gelecek tarih reddedilecekti (0 red).
- **29 yazıya `publishedAt` yazıldı** (yalnızca NULL olanlara), yalnızca **tarih** (UTC 00:00) — kaynaktaki saat alanı güvenilmez (dakika hanesi ay numarasını taşıyor), saat uydurulmadı. Kanıt tablosu yazı başına dokümanda. Şu an `publishedAt=NULL` olan yazı: **0**. JSON-LD `datePublished` 32/32 sayfada var.
- Dürüstlük notları: (a) kart↔yazı eşleşmesi aynı kaynak alanın iki görünümünü doğrular, bağımsız ikinci kaynak değil; tarihler Ağu 2025–Mar 2026 arasında toplanıyor (bir tanesi 2018) — sitenin gösterdiği "yayın tarihi" olarak alındı, gerçek ilk yayın tarihi olmayabilir. (b) `online-magazamiz-yayinda` → 2018-09-09 (8 yıllık duyuru; hâlâ PUBLISHED ve sitemap'te — editoryal karar). (c) **3 yazıda eski damgalı tarih var (2026-09-18 = önceki faz zamanı)**, kaynak tarihi farklı: `mezbaha-hijyeni-nasil-saglanir` (kaynak 2025-08-13), `mezbaha-kurulum-maliyeti` (2025-08-05), `rayli-tasima-…-ikizray-…` (2026-03-25). Kapsam dışı olduğu için **değiştirilmedi**; onayınızla düzeltilebilir.

## 8. Featured — `docs/featured-content-review.md`

Şu an featured: 2 ürün, 2 yazı, 4 referans proje. Ana sayfada 4 ürün ve 1 yazı "top-up" (featured değil, kontenjan doldurma). Hiçbir bayrak değişmedi; aday listeleri raporda.

## 9. Admin (kimlik bilgisiz)

Test edildi: 18 admin rotasının tamamı oturumsuz **307 → /admin/login**; login sayfası `noindex,nofollow`, etiketli e-posta/parola alanları, doğru `autocomplete`; DB seviyesinde ürün düzenle → public sayfada anında görünür → birebir geri al (11B) ; admin liste sorguları 55 ürün ≈1.0 s (soğuk bağlantı), 32 yazı ≈0.3 s. **Bulgu:** `/admin/kullanicilar` yalnızca yer tutucu (parola değiştirme arayüzü yok). Kalan yetkili testler manual-actions'ta.

## 10. Lighthouse (production build, yerel; `docs/lighthouse-results.md`)

Lighthouse 13.5, headless Chrome, yerel `next start`. Mobil = varsayılan emülasyon + simüle 4G/4×CPU; masaüstü = desktop preset. **Ağ/CDN yok — canlıda farklı olabilir.**

| Sayfa | Mobil P/A/BP/SEO | LCP | Masaüstü P/A/BP/SEO | LCP |
|---|---|---|---|---|
| Ana sayfa | 87/100/100/100 | 4.1 s | 98/100/100/100 | 1.1 s |
| Kategori | 85/100/100/100 | 4.3 s | 99/100/100/100 | 0.9 s |
| Ürün | 86/100/100/100 | 4.0 s | 100/100/100/100 | 0.8 s |
| Projeler | 88/100/100/100 | 3.7 s | 100/100/100/100 | 0.8 s |
| Proje detay | 90/100/100/100 | 3.6 s | 99/100/100/100 | 0.9 s |
| Blog index | 85/100/100/100 | 4.3 s | 98/100/100/100 | 1.2 s |
| Blog yazısı | 83/100/100/100 | 4.3 s | 99/100/100/100 | 0.8 s |

CLS = 0 her yerde; TBT 0–80 ms; FCP 0.2–1.4 s.

**İlk ölçümden bu yana bulunup düzeltilen gerçek sorunlar** (skor için işlevsellik silinmedi):
1. **Metadata `</head>` sonrasında akıyordu** (dinamik sayfalarda streaming metadata). OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot (ve Googlebot) için description/canonical/OG gövdenin sonundaydı (bayt ~54 000, `</head>` ~2 000); Next'in varsayılan bot listesi bunları kapsamıyor. `htmlLimitedBots: /.*/` ile kapatıldı → tüm UA'larda `</head>` içinde. (Phase 11B'deki "AI crawler parity" kontrolü kelime sayısı bakıyordu, konumu bakmıyordu — bu açık kapandı ve denetim betiğine konum kontrolü eklendi.) SEO 91–92 → 100.
2. **Renk kontrastı (WCAG AA) tüm sayfalarda başarısızdı**: accent metin/butonlar 3.89–4.32:1, koyu zeminde gri metin 3.87:1. `--accent` `#c85a2e→#b04a20` (≥4.7:1 açık zeminde, beyaz metinle 5.46:1), koyu yüzeyler için `--accent-light: #e0703f` (5.73:1) ve `neutral-500→#8a8a8a` (koyu bölümlerde). A11y 91–96 → 100. **Marka turuncusu hafifçe koyulaştı — tasarım onayınız gerekir.**
3. `role="tablist"` içinde radio input (geçersiz ARIA) → `role="radiogroup"`.
4. LCP görselleri `priority` (Next 16'da deprecated, `fetchpriority` eklemiyor) → `fetchPriority="high" loading="eager"`; kategori sayfasında LCP olan ilk ürün kartı lazy'ydi → ilk 3 kart eager. Blog gövde görselleri boyutsuzdu (CLS) → width/height.
5. Sayfa + `generateMetadata` aynı kaydı iki kez sorguluyordu → `React.cache` (ürün/proje/yazı getter'ları).
6. Ek güvenlik başlıkları eklendi (aşağıda).

**Kalan bulgular (aksiyon alınabilir, önem sırasıyla):** mobil LCP 3.6–4.3 s (simüle yavaş ağda; görsel teslimatı 52 KiB tasarruf potansiyeli, kart görsellerinde `sizes` ince ayarı); kullanılmayan JS ~28 KiB ve legacy JS ~13 KiB (Next/React çekirdeği + istemci bileşenleri — build hedef tarayıcıları daraltılarak azaltılabilir); render-blocking CSS ~60 ms; bfcache engelleri (2 neden, ayrıntı ham JSON'da); ilk istek TTFB 630–690 ms tek örnekte (dinamik sayfa, soğuk DB bağlantısı). Mobil Perf'i 90+ yapmak için AVIF + `sizes` ince ayarı + statik/ISR kategori sayfaları önerilir.

## 11. Final doğrulama (production build, `next start`)

| Kontrol | Sonuç |
|---|---|
| `npx tsc --noEmit` | temiz |
| `npm run lint` | temiz |
| `npm run build` | temiz (33 sayfa) |
| Sitemap (`docs/sitemap-validation.md`) | 123 URL, 123×200, 123 self-canonical, 0 noindex, 0 tekrar; DB'deki tüm PUBLISHED kayıtlar (55 ürün, 32 yazı, 26 proje, 4 kategori) sitemap'te — eksik 0 |
| İç linkler (`docs/internal-link-audit.md`) | 123 benzersiz hedef, 0 kırık, 0 yönlendirmeli, 0 orphan (kapasite paketi sayfaları artık `/projeler`'den linkli) |
| Redirect | 101/101: 301 + tek adım + hedef 200 (100 önceki + 1 yeni) |
| Metadata (`docs/metadata-audit.md`) | Tekrarlayan title/description 0; canonical/OG/Twitter 123/123; H1=1 123/123; `<main>` 123/123; alt'sız img 0; ince içerik 0. Uyarı: 40 title >70 karakter (kaynak SEO title'ları, editoryal rapor), 2 description >170 |
| JSON-LD | 0 parse hatası; ürün: Product+Breadcrumb; yazı: BlogPosting (datePublished 32/32); proje/kategori: Breadcrumb; hepsinde Organization+WebSite |
| SSR/içerik | Yazı gövdesi sunucu HTML'inde var, istemci JS chunk'larında **0** eşleşme; kategori sayfaları sunucu render (büyükbaş 44 ürün linkli) |
| AI crawler (Normal/OAI-SearchBot/ChatGPT-User/Claude-SearchBot) | 8 örnek sayfada kelime sayıları özdeş; description+canonical+og:title **tüm UA'larda `</head>` içinde** |
| Entity temsili | DB: 4 kategori, 55 ürün, 26 proje, 32 yazı, 317 medya, 101 redirect, 0 ürün dokümanı; provenance 117 kayıt |
| İdempotens | Importer tekrar dry-run: yeni 0, güncelleme 0, tümü atlandı |

## Değişen dosyalar

Uygulama kodu: `next.config.ts` (güvenlik başlıkları, `poweredByHeader:false`, `htmlLimitedBots`), `src/lib/queries.ts`, `src/lib/sanitize.ts`, `src/app/globals.css`, `src/components/home/capacity-solutions.tsx`, `src/components/home/hero.tsx`, `src/app/(public)/{urun/[slug],projeler/[slug],blog/[slug],urunler/[categorySlug],projeler}/page.tsx`, `src/lib/seo/metadata.ts` (11B'den; `cleanTitle`, varsayılan OG görseli).
Migration araçları (yeni): `prisma/migration/{link-overrides,localize-images,fix-blog-links,fix-blog-images,recover-publish-dates,editorial-reports,audit-images,audit-site,source-manifest}.ts`; güncellenen: `prisma/migrate-content.ts` (her koşuyu `docs/migration-runs/` altına arşivler; provenance'ta ilk `importedAt` korunur), `import-blog.ts`, `import-products.ts`, `extract-buyukbas.ts`.
Dokümanlar (yeni): `phase-11c-report.md`, `phase-11c-manual-actions.md`, `publish-date-evidence.md`, `editorial-review.md`, `featured-content-review.md`, `image-optimization-audit.md`, `lighthouse-results.md`, `audit-extra.json`, `migration-runs/*`; güncellenen: `url-migration-map.md` (1 satırın notu), `sitemap-validation.md`, `metadata-audit.md`, `internal-link-audit.md`, `migration-provenance.json`.

Not (yan etki, dürüstçe): `--dry-run` tekrarları `docs/migration-dry-run.md`'yi, ikinci gerçek koşu `docs/migration-import-report.md`'yi **ezmişti** (ilk koşuların tam raporları kayboldu). Kalan konsol kaydı `docs/migration-runs/2026-phase11b-first-dry-run.console.md`'de arşivlendi; artık her koşu zaman damgalı arşivleniyor. İlk gerçek import sayıları (konsoldan): kategori 2 yeni/1 güncel/1 atlandı; proje 23/1/2; ürün 51/4; yazı 29/3; redirect 96; medya 317. Provenance dosyasındaki `importedAt`, 11B'nin ikinci koşusunda yenilenmişti (ilk zaman kayıp; artık korunuyor).

## DB değişiklikleri (yıkıcı değil, şema değişikliği yok)

- `Redirect`: +1 (`/tr/online-magazamiz-yayinda` → `/blog/online-magazamiz-yayinda`), toplam 101.
- `BlogPost.publishedAt`: 29 kayıt NULL → kaynak tarihi.
- `BlogPostTranslation.content`: 6 çeviride ölü link düzeltmesi; 21 yazıda eski-ana-sayfa linki → `/`; 31 yazıda 99 görsel yerel yola + width/height.
- `ProductTranslation.description`: 1 üründe (`cizme-yikama-istasyonu`) eski-ana-sayfa linki → `/`.
- Silme/reset yok. Featured bayrakları, title'lar, ürün adları değişmedi.

## Bilinen sorunlar

1. Production alan adı kesinleşmedi (bloke). 2. Kataloglar / Videolar / Soğutma için yeni sayfa kararları bekliyor; bu 3 eski URL ile `/tr/kataloglar/` şu an yeni sitede 404. 3. CSP eklenmedi (nonce tabanlı politika ayrı tasarlanıp test edilmeli); HSTS localhost'ta etkisiz. 4. Yerel dosya depolama serverless'ta kalıcı değil (`deployment.md`). 5. 3 yazıda eski damgalı yayın tarihi. 6. `online-magazamiz-yayinda` 2018 tarihli duyuru hâlâ yayında. 7. Mobil Perf 83–90 (yerel, simüle). 8. `/admin/kullanicilar` yer tutucu — parola değiştirme UI'ı yok.

## Kimlik/güvenlik teyidi

Bu fazda hiçbir kimlik bilgisi/sır yazdırılmadı, kopyalanmadı, dokümana girmedi; admin'e giriş yapılmadı; sızmış süper-admin parolası **ele geçirilmiş** sayılıyor ve rotasyon yapılmadı (prosedür `phase-11c-manual-actions.md`'de). Üretilen dokümanlar sır kalıpları için tarandı (temiz).

## Deploy/push teyidi

Hiçbir şey deploy edilmedi, push edilmedi, commit atılmadı; git'te reset/clean/stash/checkout yapılmadı. Ortam: yerel `next start` (port 3700/3701, iş bitiminde kapatıldı).
