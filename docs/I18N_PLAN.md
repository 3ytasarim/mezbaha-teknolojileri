# Çok dilli site planı (TR / EN / RU / DE / FR / AR)

> **Not (27 Eylül 2026):** Bu belgenin ilk bölümleri (aşağıda) ilk planlama sırasında yazıldı ve dönemin kararlarını yansıtır (o zaman TR köktü, altıncı dil FA idi). Güncel mimari ve karar değişiklikleri için dosyanın sonundaki "Durum: Varsayılan dil EN + Farsça → Fransızca" bölümüne bakın.

Durum: PLAN — onay bekliyor. Kaynak: eski site (mezbahateknolojileri.com) sitemap'leri ve Norm-Yacht'ın dil yapısı.

## Karar
- Her dil **ayrı URL** + karşılıklı **hreflang** (canonical kendi sayfasını gösterir; diller arası canonical YOK).
- Türkçe kökte kalır (`/urunler/...`); diğerleri önek alır: `/en`, `/ru`, `/de`, `/fa`, `/ar`.
- FA ve AR **sağdan sola (RTL)**: `<html lang dir>`, Tailwind `rtl:` varyantları, ok/simge yönleri.
- Çevirisi olmayan sayfa o dilde **üretilmez** ve hreflang'a eklenmez (boş/Türkçe metinli sayfa yok).
- Çeviriler eski sitenin ilgili dil sayfalarından alınır (kaynak URL + tarih provenance dosyasında). Eşleşme yoksa uydurma çeviri yazılmaz.

## Eski site envanteri (sitemap sayıları)
TR 99 · EN 98 · RU 62 · (fa, de, ar sayfaları da var; sayıları Faz 0'da çıkarılacak)
- EN eski sitede **kökte** (`/slaughterhouse-equipments/`) → yeni `/en/...` için eski kök İngilizce adreslerden 301.
- RU slug'ları Latin transliterasyon (`/ru/kamera-krugovoj-obrezki/`) → aynen korunur.

## Teknik tasarım
1. **Şema (yalnızca ekleme):** `*Translation` tablolarına `slug String?` (locale başına benzersiz: `@@unique([locale, slug])`). Mevcut `slug` (ana kayıt) Türkçe kalır.
2. **Yönlendirme:** `src/app/(public)/[lang]/...` altına taşıma; `proxy.ts` önek yokken `/tr` olarak **rewrite** (URL değişmez), geçersiz dil → 404. Admin (`/admin`) etkilenmez.
3. **Yerelleştirilmiş route haritası:** `src/lib/i18n/routes.ts` (ör. `urunler` ↔ `products` ↔ `produkty`) — Norm-Yacht `routes.ts` mantığı.
4. **Arayüz sözlüğü:** `src/lib/i18n/dictionaries/{tr,en,ru,de,fa,ar}.ts` (buton, filtre, form, hata metinleri).
5. **Veri:** `queries.ts` `locale` parametresi alır; dil kaydı yoksa `null` (sayfa 404, listede gizli).
6. **SEO:** dil başına `<html lang>`, hreflang (+ x-default = TR), dil başına sitemap girdileri (`xhtml:link`), JSON-LD `inLanguage`, dil başına OG `locale`, `llms.txt` dil bölümleri, kırıntı ve iç bağlantılar dile göre.
7. **Dil seçici:** header (masaüstü + mobil). Tarayıcı diline göre otomatik yönlendirme YOK (botlar için güvenli); yalnızca öneri.
8. **Admin:** ürün/kategori/proje/blog/sayfa formlarında dil sekmeleri (TR/EN/RU/DE/FA/AR); boş dil = o dilde sayfa yok. SEO ekranı dil başına denetim.
9. **Yönlendirmeler:** eski EN kök adresleri, eski `/de/ /fa/ /ar/` adresleri (eşleşen yeni sayfaya 301).

## Fazlar
- **Faz 0** Envanter: eski sitede her dil için tüm URL'ler, sayfa türü eşlemesi (TR↔EN↔RU↔DE↔FA↔AR), eksikler raporu. (salt okunur)
- **Faz 1** Altyapı: şema (ekleme), `[lang]` taşıma, proxy, route haritası, sözlük iskeleti, RTL, hreflang/sitemap, dil seçici.
- **Faz 2** Admin: dil sekmeleri ve dil bazlı SEO denetimi.
- **Faz 3** İçerik aktarımı: eski siteden çeviriler (provenance ile), slug'lar, görsel alt metinleri.
- **Faz 4** Arayüz sözlüğü çevirileri (TR kaynaklı; EN/RU/DE/FA/AR — dilbilimsel gözden geçirme gerekir).
- **Faz 5** QA: hreflang karşılıklılığı, sitemap, RTL görsel kontrol, yönlendirme zincirleri, Lighthouse.

## Riskler
- Rota taşıma tüm genel sayfaları etkiler; her adım `tsc` + smoke test + mevcut SEO testleriyle doğrulanır.
- Canlı veritabanı: yalnızca **ekleyici** migration; içerik yazımı idempotent betiklerle.
- Arayüz çevirileri (Faz 4) eski sitede yoktur; makine çevirisi olacağı için özellikle FA/AR/RU'da uzman gözden geçirmesi şart.

---

## DURUM (2026-09-26)

### Bitti
- [x] Faz 0: eski site envanteri (docs/i18n-inventory.*), TR↔EN↔RU eşleşme tablosu (docs/i18n-pairing-review.md)
- [x] Yedek noktaları (`_backups/…`), DB dışa aktarımı, geri alma SQL'i (docs/i18n-rollback.sql)
- [x] DB: çeviri tablolarına `slug` kolonu (eklemeli migration)
- [x] Dil altyapısı: config, route haritası (EN/RU/DE/FA/AR), proxy yeniden yazma, `<html lang dir>`
- [x] Sorgular dile duyarlı (çeviri + dile özel slug yoksa kayıt görünmez)
- [x] `Link` sarmalayıcısı, LocaleProvider, sözlük mekanizması (TR→EN→dil yedeği)
- [x] Header/footer/mobil menü + tüm genel sayfalar ve formlar sözlüğe bağlı (TR/EN/RU metinleri yazıldı)
- [x] `buildMetadata` locale + hreflang desteği (henüz sayfalar `alternates` geçirmiyor)

### Kaldı (sırayla)
1. İçerik aktarımı (EN/RU): kategori, ürün, proje, blog, hizmet sayfaları — eşleşme incelemesi sonrası
2. Sayfalara hreflang/`alternates` bağlama
3. Sitemap: dil bazlı girdiler + `xhtml:link`
4. Dil seçici (header + mobil)
5. 301 yönlendirmeleri (eski EN kök adresleri, eski /de /fa /ar)
6. Admin: dil sekmeleri, dil başına SEO denetimi, dil başına slug
7. DE / FA / AR: sözlük, RTL, ana sayfa (eski sitede yalnızca ana sayfa var)
8. Tamlık kontrolü (`i18n:check`) + dil açma (`ENABLED_LOCALES`)
9. QA: hreflang karşılıklılığı, sitemap, Lighthouse, RTL görsel kontrol
10. llms.txt / robots / JSON-LD `inLanguage` dil bölümleri

### Güncelleme (2026-09-26, 2. tur)
- [x] EN/RU içerik aktarımı: kategori (4), ürün (54 EN / 50 RU), blog (32 EN / 1 RU), kapasite paketleri (7, elle çeviri) — rapor: docs/i18n-import-report.md
- [x] hreflang (sayfa `<head>`) + dil bazlı sitemap + dil seçici
- [x] 301 yönlendirmeleri eklendi ama PASİF (162 kayıt): dilleri açarken `npx tsx prisma/migration/add-i18n-redirects.ts --activate`
- [x] Admin > Çeviriler: kapsam tablosu + dil sekmeli düzenleme (ürün, kategori, proje, blog, hizmet sayfası); slug benzersizlik denetimi, HTML temizleme, RTL alan yönü
- Bilerek çevrilmeyenler: 19 referans proje (ince içerik), "Endüstriyel Soğutma Sistemleri" hizmet sayfası (kaynak metin şablon/spun; gerekirse Admin > Çeviriler'den eklenir), blog etiketleri
- Kalan: DE/FA/AR (sözlük+RTL), admin SEO denetiminde dil başına kontrol, llms.txt/robots/JSON-LD dil bölümleri, i18n:check + dil açma, QA

### Güncelleme (2026-09-26, 3. tur)
- [x] JSON-LD `inLanguage` (WebSite/Product/BlogPosting/Blog/Service), llms.txt dil bölümleri (etkin dil + var olan sayfalar), robots (değişiklik gerekmedi)
- [x] Admin > SEO Yönetimi dil sekmeli (çevirisi olmayanlar Çeviriler ekranına yönlendirilir)
- [x] EN/RU SEO açıklamaları 160 karaktere kısaltıldı (trim-i18n-seo.ts)
- [x] DE / FA / AR: sözlük (ana sayfa, iletişim, teklif) + sınırlı sayfa kümesi (`LOCALE_PAGES`: /, /iletisim, /teklif-al); olmayan sayfalar 404, menü/sitemap/hreflang/llms.txt'ten çıkarıldı; sağdan sola: mantıksal Tailwind sınıfları, ikon aynalama, hero düzeni
- [x] `npm run i18n:check`: tüm diller TAMAM; production build (next build) başarılı
- Dilleri açmak için: `ENABLED_LOCALES` (src/lib/i18n/config.ts) + `npx tsx prisma/migration/add-i18n-redirects.ts --activate` + yeniden build (sitemap build sırasında üretilir)
- Kalan: ana dili konuşan gözden geçirmesi (RU, DE, FA, AR, EN yeni metinler), Lighthouse/QA, admin arayüzünde elle tıklama testi

### Güncelleme (2026-09-26, 4. tur — QA)
- [x] Tam tarama (prisma/migration/i18n-crawl.cjs): 358 sitemap URL'si (6 dil) → HTTP 200, title/description/tek h1/canonical/`<html lang>`/img alt/hreflang karşılıklılığı/iç bağlantılar: 0 sorun
- [x] Lighthouse: a11y/BP/SEO 100 (docs/lighthouse-results-i18n.md); masaüstü perf 98–100; mobil 79–84 (ana sayfa 54→79)
- Denenip GERİ ALINAN: `experimental.inlineCss` (HTML 2× büyüdü, LCP düzelmedi)
- [x] Renk lekeleri blur yerine radyal gradyan; hero ilk görsel giriş animasyonsuz
- AÇIK: mobil LCP ≈ 4.5–6.6 s (metin öğesi, render gecikmesi ≈ 2.3 s): ~200 KB yazı tipi (4 preload) + ~1.0 s render-engelleyici CSS. Aday: Archivo/Inter'i değişken yazı tipine geçirmek, ağırlıkları azaltmak

---

## Durum: DE / FA / AR tam site (26 Eylül 2026)

- `LOCALE_PAGES` boşaltıldı: Almanca, Farsça, Arapça artık TR/EN/RU ile aynı tüm sayfalara sahip (ürün, kategori, proje, referans, blog, kataloglar, kurumsal, videolar, hizmetler, iletişim, teklif).
- Arayüz sözlüğü: `dictionaries/{de,fa,ar}.pages.ts` (ui, products, projects, references, blog, about, catalogs, videos, services); `de.ts/fa.ts/ar.ts` bunları `...Pages` ile birleştirir. `npm run i18n:check` tüm dillerde TAMAM.
- İçerik (DB, her dilde): 4 ürün kategorisi, 55 ürün (+ Kurban Pro teknik özellikleri), 26 proje (19 referans + 7 kapasite paketi), 32 blog yazısı = 117 kayıt/dil. Slug: DE için Almanca ASCII başlık; FA/AR için İngilizce slug.
- Araçlar: `prisma/migration/i18n-dump-en.ts` + `i18n-dump-specs.ts` (İngilizce döküm), `store-loc-batch.cjs` (parti → `data/loc/<dil>/*.json`), `import-locale-content.ts <de|fa|ar> [--apply]`, `gen-loc-projects.cjs` (şablonlu proje metinleri), `clean-en-blog.ts` (İngilizce kaynak kusurları: dev alt metin, Türkçe alt, boş başlık, "drilling").
- Ana sayfa uzun metin bölümü de DE/FA/AR için eklendi (`src/content/legacy/home-seo.json`).
- Doğrulama: üretim derlemesi + `i18n-crawl.cjs` → sitemap 807 URL, sorun 0 (önceki 358).
- Açık: anadili konuşan biri tarafından DE/FA/AR (ve RU) metin incelemesi; admin panelde çeviri tıklaması (kullanıcı); mobil LCP.

---

## Durum: Varsayılan dil EN + Farsça → Fransızca (27 Eylül 2026)

**Değişiklik talebi:** kök adres (önek yok) artık **İngilizce**; Türkçe `/tr/...` önekine taşındı. Farsça (FA) tamamen kaldırıldı, yerine Fransızca (FR) eklendi (DE/AR ile aynı kapsamda: tüm sayfalar).

### Mimari: DEFAULT_LOCALE ≠ CANONICAL_LOCALE
İki ayrı sabit tanıtıldı (`src/lib/i18n/config.ts`):
- `DEFAULT_LOCALE` — **routing**: önek almayan dil. Artık `"en"`.
- `CANONICAL_LOCALE` — **veri**: içeriğin taban tablolarda (Product.slug, description...) doğrudan saklandığı dil. Her zaman `"tr"`, routing'den bağımsız (admin CRUD formları hâlâ Türkçe yazıyor).

Bu ikisinin karıştırılması (`row.slug`'ı `DEFAULT_LOCALE` anahtarına atamak gibi) `src/app/sitemap.ts`'te kategori/ürün/proje/blog sayfalarının tamamen sitemap'ten düşmesine yol açan bir hataydı — düzeltildi.

Dokunulan dosyalar (DEFAULT_LOCALE → CANONICAL_LOCALE, routing anlamı değişmeyenler hariç): `queries.ts`, `content-fallback.ts`, `hero-slides.ts`, `i18n/slug.ts`, `admin-translations.ts`, `ceviriler/actions.ts`, `ceviriler/[kind]/[id]/page.tsx`, `admin/seo/page.tsx`, `sitemap.ts`, `prisma/migration/i18n-check.ts`. `routes.ts`/`proxy.ts`/`config.ts` yeniden yazıldı: `localizePath`/`resolvePublicPath` artık önek atlamayı parça çevirisinden ayırıyor (EN önek almaz ama `/urunler`→`/products` çevirisi hâlâ uygulanır). `llms.txt` artık her dil için (varsayılan dahil) aynı tam blok formatını basıyor.

### FA → FR veri/sözlük geçişi
- `dictionaries/fa.ts` + `fa.pages.ts` silindi → `fr.ts` + `fr.pages.ts` (aynı kapsam: DE/AR ile bire bir).
- DB: tüm `locale: "fa"` satırları silindi (kategori 4, ürün 55, spec 3, proje 26, blog 32); aynı 117 kayıt için Fransızca yeniden üretildi/çevrildi ve `import-locale-content.ts fr --apply` ile yazıldı.
- `gen-loc-projects.cjs`, `store-loc-batch.cjs`, `import-locale-content.ts`: `fa` yerine `fr` (FR slug: DE gibi ASCII başlık, AR gibi İngilizce değil).
- `src/content/legacy/home-seo.json`: `fa` anahtarı kaldırıldı, `fr` eklendi (uzun SEO metni). `home-seo-text.tsx` BADGE haritası güncellendi.

### Yönlendirme tablosu düzeltmesi (canlı veri)
Kök adresin TR→EN değişmesi, `Redirect` tablosundaki ~300 kayrın çoğunu etkiledi (hepsi eski "önek yoksa Türkçe" varsayımıyla kurulmuştu):
- 101 kayıt: hedef `/en/...` → önek kaldırıldı (`/...`), sonra kaynak=hedef olan 5 kaydı (corporate, contact-us, catalogs, projects, references) pasifleştirdik.
- 195 kayıt: hedef Türkçe iç yol (`/urunler/x`, `/blog/x`...) idi, artık `/tr` öneki eklendi.
- 6 kayıt (`/tr`, `/tr/iletisim`, `/tr/blog`, `/tr/kataloglar`, `/tr/projeler`, `/tr/referanslar`): eski "/tr/..." kalıcı bağlantıları artık **yeni gerçek Türkçe sayfa adresleriyle birebir çakışıyor** → pasifleştirildi (silinmedi).
- Türkçe blog içeriğine (rich-text) gömülü 43 ham `<a href="/urun/...">` bağlantısı (25 yazıda) `/tr` önekiyle güncellendi; İngilizce içerikteki bozuk `href="/en"` (kendine referans) `href="/"` yapıldı.
- **Hiçbir kayıt silinmedi**, yalnızca `destinationPath` düzeltildi veya `active=false` yapıldı (geri alınabilir).

### Doğrulama
`npx tsc --noEmit` ✓ · `npx eslint src` ✓ · `npm run i18n:check` (en/ru/de/fr/ar TAMAM) ✓ · production build ✓ · `i18n-crawl.cjs` → **807 sitemap URL, 0 sorun** (redirect çakışmaları dahil tam temiz).

### Açık (canlıya almadan önce)
- Kökteki Türkçe URL'ler (`/urunler`, `/urun/x`...) daha önce Google'da indekslenmiş olabilir; `/tr` öneki olmadan artık İngilizce içerik döner. Bu URL'ler için TR→`/tr/...` 301 haritası (yeni) henüz oluşturulmadı — canlıya almadan önce Search Console'da izlenmeli, gerekirse eski indeksli TR URL'lerinden yeni `/tr/...` adreslerine 301 eklenmeli.
- Google Search Console'da mülk/sitemap yeniden gönderimi ve hreflang değişikliğinin izlenmesi gerekir.
- Fransızca içerik (55 ürün + 32 blog + 26 proje + 4 kategori) makine çevirisi; anadili konuşan gözden geçirmesi henüz yapılmadı (DE/AR/RU için de aynı durum).
