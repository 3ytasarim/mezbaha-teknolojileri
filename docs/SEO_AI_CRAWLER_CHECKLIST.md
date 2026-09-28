# SEO, AI Search ve Crawler Kontrol Listesi — Mezbaha Teknolojileri

Kaynak: "backend update.pdf" (B2BVoice için hazırlanan 22 maddelik SEO / AI-crawler revizyon listesi). Bu liste, aynı maddelerin
**Mezbaha Teknolojileri sitesindeki durumunu** gösterir.

- Denetim tarihi: 25 Eylül 2026
- Denetlenen: yerel sunucu (`http://localhost:3700`), sitemap'teki **165 URL**'nin tamamı, ilk HTTP HTML cevabı üzerinden (JavaScript çalıştırılmadan)
- Ham veri: [`seo-url-inventory.csv`](seo-url-inventory.csv) — her URL için durum kodu, title, description, canonical, H1 sayısı, schema türleri, robots

Durum işaretleri: ✅ Tamam (ölçüldü) · 🟡 Kısmen / not var · ⏳ Sunucuya çıkınca doğrulanacak · 👤 Manuel iş (geliştirici işi değil)

> **"Kaynağı görüntüle'de kod göremiyorum" notu.** Sayfanın ilk HTML'i dolu: `<title>`, `<meta name="description">`, canonical, Open Graph,
> JSON-LD ve `<h1>` hepsi kaynakta var (ana sayfa ilk HTML'i ~450 KB). Sorun genellikle şudur: Next.js HTML'i **tek satıra sıkıştırıp**
> gönderir, kaynak görünümünde okunmaz uzun bir satır gibi durur. Kontrol için `Ctrl+U` açıp `Ctrl+F` ile `<title`, `application/ld+json` veya `<h1`
> aratın; ya da terminalden `curl -s http://localhost:3700/blog | findstr /i "<title <h1 canonical"` çalıştırın.
> Ayrıca `next.config.ts` içindeki `htmlLimitedBots: /.*/` ayarı sayesinde meta etiketleri **`<head>` içinde** gelir (Next 16 varsayılanı bunları
> tarayıcılara sonradan gövdeye akıtır).

---

## Özet

| # | Madde | Durum |
|---|---|---|
| 1 | Yedek ve URL envanteri | 🟡 |
| 2 | Public sayfalar SSR/SSG (ilk HTML dolu) | ✅ |
| 3 | Blog için tek içerik kaynağı | ✅ |
| 4 | Semantik HTML, tek H1 | ✅ |
| 5 | Sayfaya özel metadata, canonical, OG | ✅ |
| 6 | Canonical domain ve HTTPS yönlendirmeleri | ⏳ |
| 7 | Gerçek 404 | ✅ |
| 8 | Gerçek sitemap.xml | ✅ |
| 9 | robots.txt | ✅ |
| 10 | CDN / firewall / hosting crawler erişimi | ⏳ |
| 11 | Schema ilk HTML'de | ✅ |
| 12 | Görsellerin semantik açıklaması | 🟡 |
| 13 | Görsel performansı | 🟡 |
| 14 | Internal linking | ✅ |
| 15 | Mevcut URL yapılarını koruma | ✅ |
| 16 | JS/CSS, sıkıştırma, cache | ⏳ |
| 17 | Mobil kullanılabilirlik ve erişilebilirlik | ✅ |
| 18 | Index/noindex, HTTPS, kırık link | ✅ |
| 19 | Search Console ve Bing | 👤 |
| 20 | Backlink / dış otorite | 👤 |
| 21 | RSS ve llms.txt | ✅ |
| 22 | Yayın sonrası kabul testleri | ⏳ |

---

## Madde madde

### 1. Yedek ve URL envanteri — 🟡
- ✅ URL envanteri hazır: 165 URL, title/description/H1/durum kodu ([`seo-url-inventory.csv`](seo-url-inventory.csv)). Eski/yeni karşılaştırma için de kullanılabilir; eski sitenin envanteri `docs/current-site-inventory.md` ve 105 yönlendirme (`Redirect` tablosu) ile korunuyor.
- 🟡 Yedek/geri dönüş: bu site henüz yayında değil, kodda `git commit` yapılmadı. **Yayına çıkmadan önce** eski sitenin (canlıdaki) yedeğini alın ve yeni sürümü önce staging/origin IP'ye karşı `deploy/smoke-test.sh` ile deneyin.
- ✅ Mevcut URL'ler değiştirilmedi; eski adresler `301` ile korunuyor.

### 2. Public sayfalar SSR/SSG — ✅
165 URL'nin tamamı sunucu tarafında üretiliyor: gerçek başlık, metin, bağlantı ve görseller ilk HTML'de. Boş `<div id="root">` yok. Blog, ürün, proje, kategori, hizmet, etiket ve iletişim sayfalarının hepsi bu şekilde. Admin paneli ayrı ve indekslenmiyor.

### 3. Blog için tek içerik kaynağı — ✅
- Blog yazıları yalnızca veritabanında (Prisma) yönetiliyor; `/api/blog` gibi boş bir uç nokta yok.
- Her yazı kendi URL'sinde bağımsız HTML. Metinler JavaScript paketine gömülmüyor.
- `dangerouslySetInnerHTML` içeriği kaydedilirken temizleniyor (`sanitizeContentHtml`).
- Yeni yazı yayınlanınca sayfa, sitemap kaydı ve RSS otomatik oluşuyor.

### 4. Semantik HTML, tek H1 — ✅
165/165 sayfada: **tam 1 `<main>`, tam 1 `<h1>`**, iç içe `<article>` yok, blogda gerçek `<time datetime>`.
Bu denetimde bulunan sorun düzeltildi: 4 kategori sayfasında başlık sırası H1 → H3 atlıyordu, kart başlıkları H2 yapıldı. Şu an başlık atlaması: **0**.

### 5. Metadata, canonical, OG — ✅
165/165 sayfada: benzersiz `title` (tekrar eden: 0), benzersiz `description` (tekrar eden: 0), kendine işaret eden `canonical`, `og:type`, `og:title`, `og:description`, `og:url` (canonical ile aynı), sayfaya özel mutlak `og:image`, `twitter:card`, `twitter:title`, `twitter:image`, `<html lang="tr">`, `robots: index, follow`. Blog yazıları kendi OG bilgisini (kapak görseli, `article`) kullanıyor.
> Not: yerelde canonical/OG adresleri `localhost:3000` görünür; yayında `NEXT_PUBLIC_SITE_URL=https://www.mezbahateknolojileri.com` kullanılır (bkz. `.env.production`).

### 6. Canonical domain ve HTTPS — ⏳
- Kod hazır: `src/proxy.ts` tüm sürümleri (http, apex, www) **tek adımda** ana domaine yönlendirir; sondaki `/` için `308`.
- ✅ Yerelde doğrulandı: `/blog/` → `308 → /blog`, `/urunler/` → `308 → /urunler`.
- ⏳ Canlıda doğrulanacak (Bölüm 22, E). Ana domain **`https://www.mezbahateknolojileri.com`** (www) olarak seçildi; apex ona yönlenir.

### 7. Gerçek 404 — ✅
`/olmayan-sayfa`, `/blog/olmayan-yazi`, `/urun/olmayan-urun` → hepsi **404**, `noindex`, canonical yok, sitemap'te yok. İlgisiz eski URL'ler ana sayfaya yönlendirilmiyor.

### 8. Gerçek sitemap.xml — ✅
`Content-Type: application/xml`, 165 mutlak URL: ana sayfa, `/blog`, tüm yazılar, ürün/kategori/proje, hizmet, iletişim, teklif, 36 blog etiket sayfası. Noindex, yönlendirme ve 404 URL'si yok.
Bu denetimde düzeltildi: sabit sayfalarda "her zaman şimdi" şeklinde uydurma `lastmod` vardı; artık `lastmod` yalnızca gerçek güncelleme tarihi olan sayfalarda yazılıyor (ana sayfa, ürünler, projeler, blog, yazılar, etiketler), diğerlerinde hiç yazılmıyor.

### 9. robots.txt — ✅
`OAI-SearchBot`, `ChatGPT-User`, `GPTBot`, `Claude-SearchBot`, `Claude-User`, `ClaudeBot`, `Google-Extended`, `Googlebot` (+ `Bingbot`, `PerplexityBot`, `Perplexity-User`) için açık `Allow: /`; `/admin` ve `/api` kapalı; `Sitemap:` satırı var.

### 10. CDN / firewall / hosting — ⏳
- ✅ Yerelde: OpenAI botu, Claude botu ve normal tarayıcı user-agent'ı **aynı içeriği** alıyor (title, tek H1, BlogPosting schema; yanıt boyutu ±13 bayt farkla aynı). Kullanıcı-agent'a göre farklı/gizli içerik yok.
- ⏳ Sunucuda kontrol edilecek: Cloudflare Bot Fight / WAF'ın OAI-SearchBot ve Claude-SearchBot'u engellemediği, 403/CAPTCHA/429 vermediği, `deploy/nginx` rate-limit ayarının normal tarama hızında 429 üretmediği. Bölüm 22-B komutlarıyla doğrulayın.

### 11. Schema ilk HTML'de — ✅
JSON-LD kaynakta (JavaScript ile eklenmiyor).

| Sayfa | Schema |
|---|---|
| Ana sayfa | Organization, WebSite |
| Blog listesi | **Blog** (yazı bağlantılarıyla) + BreadcrumbList |
| Blog yazısı | **BlogPosting** (headline, description, image, datePublished, dateModified, author, publisher + logo, mainEntityOfPage, url, inLanguage, keywords) + BreadcrumbList |
| Ürün | Product + BreadcrumbList |
| Hizmet | Service + BreadcrumbList |
| Diğer alt sayfalar | BreadcrumbList |

Görünür SSS olmadığı için FAQPage eklenmedi; uydurma puan/yorum (AggregateRating) yok — liste bunu zaten yasaklıyor. Bu denetimde BlogPosting'e publisher logosu, mainEntityOfPage ve inLanguage eklendi, blog listesine `Blog` schema'sı eklendi.
⏳ Canlı adreste Google Rich Results Test ve Schema.org Validator ile bir kez doğrulayın.

### 12. Görsellerin semantik açıklaması — 🟡
- ✅ Tüm `<img>` etiketlerinde `alt` var (165 sayfa, eksik: 0). Ürün görseli bağlantılarına ürün adı alt olarak verildi (boş bağlantı kalmadı).
- ✅ Dekoratif görseller `alt=""`.
- ✅ Yönetim panelinde alt metin girilebiliyor: ürün / blog / proje **kapak görseli** (görselin altındaki "Görsel alt metni" alanı), ürün ve proje **galeri** görselleri (görsel başına alt + açıklama), **slider** (görsel açıklaması) ve **Medya Kütüphanesi** (her görsele alt metin; eksik olanlar amber çerçeveyle uyarılır). Alt metin boşsa sitede ürün/yazı/proje adı kullanılır. Yüklenen dosyaların adı da SEO dostu (`dairesel-kesim-hucresi-a1b2c3d4.webp`).
- 🟡 Ürün banner'ları (görselin üstünde "HİDROLİK DERİ YÜZME MAKİNASI" gibi yazı olan) için `alt` ürün adıyla aynı olduğundan görseldeki yazı metinle eşleşiyor; ayrıca `figcaption` yok. Görsel üstünde uzun açıklama/infografik yok.

### 13. Görsel performansı — 🟡
- ✅ Görseller `next/image` ile WebP olarak, `srcset` + `sizes` ile ve ekran altındakiler `lazy` yükleniyor; hero (LCP) görseli `preload` ile öncelikli.
- 🟡 `fill` kullanılan görsellerde HTML'de `width/height` yok; bunun yerine kutular CSS `aspect-ratio` ile ayrılıyor (liste bu yöntemi de kabul ediyor), yani yer kayması olmuyor.
- ⏳ Lighthouse / Core Web Vitals ölçümü canlıda yapılacak (`docs/lighthouse-results*.md` önceki ölçümler).

### 14. Internal linking — ✅
- Menüde Blog var; `/blog` sayfasındaki tüm yazı bağlantıları gerçek `<a href>`.
- Bu denetimde eklendi: her yazının altında **"İlgili Yazılar"** (ortak etikete göre en çok 4 yazı) ve yanında "Son Gönderiler".
- Görünür breadcrumb var. "Buraya tıklayın" gibi anlamsız bağlantı metni yok.
- **228 benzersiz iç bağlantı tarandı: kırık 0. Sitemap'teki 165 URL'nin hepsine en az bir bağlantıdan ulaşılıyor: yetim sayfa 0.**
- 🟡 İsteğe bağlı: blog yazılarının sonuna hizmet/teklif CTA'sı ("Teklif alın") eklenebilir.

### 15. URL yapıları — ✅
Küçük harf, tire, kısa slug, parametresiz. Eski adresler için 105 adet `301` yönlendirme; yönlendirmeler artık panelden (Admin → SEO → Redirectler) yönetiliyor.

### 16. JavaScript, CSS, sıkıştırma, cache — ⏳
- ✅ Route bazlı kod bölme Next.js tarafından otomatik; blog metinleri JS paketinde değil (SSR).
- ⏳ Yayında: sıkıştırma Cloudflare kenarında (brotli/gzip; nginx gzip bilinçli kapalı), `/_next/static` için `immutable` uzun cache başlığı, HTML için ayrı politika (`deploy/nginx/...conf`). Canlıda `curl -I` ile başlıklar doğrulanmalı.
- ⏳ Core Web Vitals hedefleri: LCP ≤ 2,5 sn, INP ≤ 200 ms, CLS ≤ 0,1 — canlıda ölçülecek.

### 17. Mobil ve erişilebilirlik — ✅
`<meta name="viewport" content="width=device-width, initial-scale=1">` (maximum-scale yok, zoom serbest); formlarda gerçek `<label>`; menü ve butonlar 44–48 px dokunma alanı; odak halkaları var.
🟡 Gerçek telefonda (yatay kayma, menü, form) elle bir kez deneyin.

### 18. Index/noindex, HTTPS, kırık link — ✅
- 165/165 URL `200 OK`, hiçbirinde `noindex` yok, `X-Robots-Tag: noindex` yok.
- `/admin/login` ve yönetim sayfaları `noindex, nofollow`; robots.txt'de kapalı.
- Kırık iç bağlantı: 0. Redirect zinciri: yok (trailing slash tek `308`).
- ⏳ HTTPS ve karışık içerik (mixed content) canlıda kontrol edilecek; HSTS başlığı kodda tanımlı.

### 19. Search Console ve Bing — 👤 (yayından sonra)
Domain property doğrulaması, sitemap gönderimi (`https://www.mezbahateknolojileri.com/sitemap.xml`), ana sayfa / `/blog` / önemli yazılarda URL Inspection + Request Indexing, Page Indexing / Crawl Stats / Core Web Vitals / structured data raporları, Bing Webmaster Tools kurulumu ve sitemap.

### 20. Backlink ve dış otorite — 👤
Geliştirici işi değil; teknik işler bitince yürütülür: güvenilir şirket profilleri, sektörel dizinler, gerçek referanslar, konuk yazılar, tutarlı şirket adı/adresi. Toplu/kalitesiz link paketi ve sahte yorum kullanılmamalı.

### 21. RSS ve llms.txt — ✅
- `/blog/rss.xml` (RSS 2.0, son 30 yazı) eklendi; `/blog` sayfasında `<link rel="alternate" type="application/rss+xml">` var.
- `/llms.txt` mevcut.
- Bunlar SSR/sitemap yerine geçmez; öncelikli işler tamamlandıktan sonra eklendi.

### 22. Yayın sonrası kabul testleri — ⏳
Yayına çıkınca aşağıdaki komutları çalıştırın (`<...>` yerine gerçek adres). Hazır otomatik test için: `bash deploy/smoke-test.sh`.

```bash
# A. İlk HTML
curl -s https://www.mezbahateknolojileri.com/            | grep -i "<title\|<h1\|canonical"
curl -s https://www.mezbahateknolojileri.com/blog        | grep -c "/blog/"
curl -s https://www.mezbahateknolojileri.com/blog/mezbaha-kurulum-maliyeti | grep -i "<h1\|BlogPosting"

# B. AI crawler'lar aynı içeriği almalı
curl -A "OAI-SearchBot/1.4; +https://openai.com/searchbot" -s https://www.mezbahateknolojileri.com/blog/mezbaha-kurulum-maliyeti | grep -i "<h1\|canonical\|BlogPosting"
curl -A "Claude-SearchBot" -s https://www.mezbahateknolojileri.com/blog/mezbaha-kurulum-maliyeti | grep -i "<h1\|canonical\|BlogPosting"

# C. Sitemap
curl -I https://www.mezbahateknolojileri.com/sitemap.xml      # content-type: application/xml
curl -s https://www.mezbahateknolojileri.com/sitemap.xml | head -20

# D. 404
curl -I https://www.mezbahateknolojileri.com/olmayan-bir-sayfa # 404

# E. Domain yönlendirme
curl -I https://mezbahateknolojileri.com/                     # 301/308 → https://www.mezbahateknolojileri.com/
curl -I http://www.mezbahateknolojileri.com/                  # 301/308 → https://www.mezbahateknolojileri.com/
```

Sayfa bazlı son kontrol (yerelde geçti, canlıda tekrarlanacak): tek H1, benzersiz title/description, doğru canonical/OG, ilk HTML'de schema, alt metinler, yanlış noindex yok, iç bağlantılar çalışıyor, JavaScript kapalıyken içerik görünüyor, Google Rich Results Test hatasız.

---

## Bu denetimde yapılan düzeltmeler

1. Kategori sayfalarında başlık sırası (H1 → H3) düzeltildi.
2. Ürün görseli bağlantılarına anlamlı `alt` verildi.
3. BlogPosting schema'sına publisher logosu, `mainEntityOfPage`, `inLanguage` eklendi; blog listesine `Blog` schema'sı eklendi.
4. Blog yazılarına ortak etikete göre **"İlgili Yazılar"** bölümü eklendi.
5. Sitemap'ten uydurma `lastmod` tarihleri kaldırıldı; gerçek güncelleme tarihleri kullanılıyor.
6. `/blog/rss.xml` RSS akışı eklendi.
7. URL envanteri (`docs/seo-url-inventory.csv`) oluşturuldu.
