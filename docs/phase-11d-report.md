# Phase 11D Report — Pre-deployment Cleanup

Tarih: 2026-09-23 · Ortam: yerel production build (`next start`). **Deploy yok, push yok, commit yok, DNS/sunucu değişikliği yok.**

## Özet

| # | Madde | Sonuç |
|---|---|---|
| 1 | Production domain | Kodda **seçim yapılmadı** (`NEXT_PUBLIC_SITE_URL` değişmedi). Altyapı bulguları + gereksinimler aşağıda. **Karar sizde.** |
| 2 | Legacy sayfalar | **Kataloglar** (155 sayfa), **Videolar** (16/17 yayında), **Endüstriyel Soğutma** yeni sayfaları var; 4 eski URL'den tek adımlı 301. |
| 3 | Marka turuncusu | `#b04a20` korundu; koyu zemin varyantlarının tam yerleri `docs/brand-orange-usage.md`. |
| 4 | Yayın tarihleri | 3 migration damgası kaynak tarihiyle değiştirildi; 31/31 yazı iki bağımsız kanıtla doğrulandı; 2018 duyurusu korundu. `publishedAt=NULL` yazı: 0. |
| 5 | Editoryal | Title/BÜYÜK HARF/featured **değişmedi**. |
| 6–7 | Süper-admin / admin | Rotasyon yapılmadı, giriş denenmedi; talimat ve kontrol listesi korundu. |
| 8 | Doğrulama | tsc / lint / build temiz; sitemap 128 URL; 0 orphan; 210/210 redirect testi; JSON-LD, SSR, AI-crawler geçti. |

---

## 1. Production domain — altyapı bulguları ve gereksinimler (hiçbir değişiklik yapılmadı)

### Bu projede ne var / yok
- Repo'da **nginx, Docker, Vercel, CI, systemd/PM2 yapılandırması yok**. `docs/deployment.md`: "henüz bir platform seçilmedi", www↔apex kararı "dokümante edilmiş ama uygulanmamış". `NEXT_PUBLIC_SITE_URL` tüm canonical/OG/sitemap/robots/JSON-LD/`llms.txt` URL'lerinin tek kaynağıdır (Phase 11C'de sahte origin'le kanıtlandı) ve **build zamanında** sabitlenir (statik sayfalar) → değer değişirse yeniden build gerekir.
- Uygulama Node.js sunucusu gerektirir (`next start`, Next 16.3.5); Neon PostgreSQL'e `DATABASE_URL` (pooled) ile bağlanır. Yerel dosya depolama (`STORAGE_PROVIDER=local`) yalnızca kalıcı diskli bir VPS'te uygundur.

### Mevcut canlı alan adının durumu (salt-okunur DNS/HTTP incelemesi)
| Bulgu | Ayrıntı |
|---|---|
| Yetkili DNS | **Cloudflare** (`zahir.ns.cloudflare.com`, `lara.ns.cloudflare.com`) |
| Apex ve www | İkisi de Cloudflare edge IP'lerine çözülüyor → **proxied (turuncu bulut)**; gerçek origin IP görünmüyor. Origin şu an PHP (yanıtta `PHPSESSID`) |
| **E-posta** | MX: `mx1.hostinger.com` (5), `mx2.hostinger.com` (10); TXT kayıtları var → **e-posta bunlara bağlı, cutover'da dokunulmamalı** |
| Mevcut yönlendirme | `http://apex` → 301 → `https://www`; `https://apex` → 301 → `https://www`; `http://www` → 301 → `https://www`; `https://www` → 200. **Fiilî canonical bugün `www`** ve eski site canonical'ı da `https://www.mezbahateknolojileri.com/` |
| `url-migration-map.md` | Eski URL'ler `www` üzerinde; yeni yollar aynı alan adında görecelidir |

### Seçim (www mı apex mi) — kodda YAPILMADI
Altyapı (hosting platformu, nginx var mı, hangi sunucu) belirlenmediği için canonical seçimini güvenle sabitleyemiyoruz. Bilgi için: `www`'u korumak, arama motorlarında indekslenmiş mevcut URL'leri ve mevcut yönlendirme davranışını değiştirmez (en düşük SEO riski); apex'e geçmek mümkündür ancak tüm indeksli URL'lerin bir kez daha yönlenmesini gerektirir. Kararı siz verin; bkz. "Sizden gereken karar".

### Her iki adres için gereken yapılandırma (seçimden bağımsız çekirdek)

Dört giriş noktasının tamamı **tek adımda** seçilen canonical HTTPS origin'e ulaşmalı:

| İstek | Olması gereken |
|---|---|
| `http://apex`, `http://www` | 301 → `https://<canonical>` (tek adım, yol+sorgu korunarak) |
| `https://<non-canonical>` | 301 → `https://<canonical>` (tek adım) |
| `https://<canonical>` | 200 (uygulama) |

**DNS (Cloudflare panelinde; ben dokunmadım):**
- `apex` ve `www` için kayıt: origin'e göre A/AAAA veya CNAME (Vercel ise panelin gösterdiği hedefler; VPS ise sunucu IP'si).
- MX (Hostinger) ve TXT (SPF/doğrulama) kayıtları **olduğu gibi kalmalı**.
- Cutover öncesi TTL düşürülmeli; geri dönüş = A/CNAME'i eski origin'e çevirmek.

**Cloudflare:** SSL/TLS modu **Full (strict)**; "Always Use HTTPS" açık; non-canonical host için **Redirect Rule** (301, yol+sorgu korunur) — ya da bu yönlendirme nginx'te; ikisini birden yapıp zincir oluşturmayın. **Rocket Loader / Auto Minify kapalı** olmalı (hydration'ı bozabilir). HTML sayfaları önbelleğe alınmamalı (admin ve dinamik sayfalar).

**Eğer VPS + nginx seçilirse (şablon, uygulanmadı):**
- İki `server` bloğu (apex ve www) + 80→443; TLS: Cloudflare Origin CA sertifikası (Full strict için) veya Let's Encrypt.
- `proxy_pass http://127.0.0.1:3000;` `proxy_set_header Host $host; X-Forwarded-Proto $scheme; X-Forwarded-For $proxy_add_x_forwarded_for;` (+ Cloudflare IP aralıklarından `CF-Connecting-IP` için `real_ip`).
- **Sondaki `/` üzerinde nginx `rewrite`/`return` YAPILMAMALI**: eski URL'ler `/tr/x/` biçimindedir ve uygulama bunları (`src/proxy.ts`) tek adımda 301'ler; nginx araya girip `/`yi atarsa zincir oluşur. `/tr/...` yolları olduğu gibi iletilmeli.
- `/_next/static/` için uzun süreli immutable cache; `/images/` için makul cache; `client_max_body_size` (admin görsel yükleme).
- `next start` bir süreç yöneticisi altında (systemd/PM2) çalışmalı, `NEXT_PUBLIC_SITE_URL` **build sırasında** ayarlı olmalı; `AUTH_SECRET` yeniden üretilmeli; `public/uploads` (yerel depolama) yedeklenmeli.
- Uygulama zaten güvenlik başlıklarını ve `www/apex` dışı yönlendirme yapmaz — canonical-host yönlendirmesi platform/nginx/Cloudflare sorumluluğundadır (`deployment.md` ile uyumlu).

**Yayın sonrası:** `sitemap.xml`'i Search Console/Bing'e gönderin; kontrol: `curl -I` ile 4 giriş noktası + 105 legacy URL örnekleri.

### Sizden gereken karar (bloke)
1. **Canonical: `www` mi apex mi?** 2. **Hosting: Vercel mi, VPS+nginx mi?** (nginx'ten söz ettiniz; VPS ise sunucu IP'si ve TLS yöntemi.) Bu ikisi gelince `NEXT_PUBLIC_SITE_URL` ayarlanır, redirect/canonical davranışı doğrulanır.

---

## 2. Legacy içeriğin yeni sayfaları

Yalnızca gerçek kaynak içerik kullanıldı (uydurma yok). Kaynak: eski sitenin sayfaları (`docs/migration-provenance-legacy.json`: kaynak URL, SHA-256, dosya boyutu, ilk import zamanı).

### 2a. Kataloglar — `/kataloglar` ve `/kataloglar/2018-mezbaha-sistemleri-katalog`
- **Kaynak PDF değil**: 155 adet 1280×720 JPG sayfa görselinden oluşan bir owl-carousel galerisi ("1/155" sayacı doğrulandı: 155 = 155). PDF uydurulmadı/üretilmedi.
- 155 sayfa + kapak yerel olarak indirildi (`public/images/migrated/catalog/2018-mezbaha-sistemleri-katalog/page-001…155.jpg`, 28.9 MB; hepsi JPEG imzası doğrulandı, 0 başarısız).
- **Uygulama**: sayfa görselleri sunucuda render edilen yatay scroll-snap listesi (JS'siz de kaydırılır, görseller lazy, ilk sayfa eager); küçük bir istemci bileşeni önceki/sonraki, "sayfaya git", sol/sağ ok tuşları ve "Sayfa n / 155" (aria-live) ekler; `prefers-reduced-motion` desteklenir. Her görselin alt metni yalnızca gerçek veriden: "2018 Mezbaha Sistemleri Katalog — sayfa n / 155".
- **Sürdürülebilirlik**: veri `src/content/legacy/catalogs.json` (+ görseller); yeni katalog = JSON'a kayıt + görselleri klasöre koymak. (CMS tablosu yok; admin'den düzenlenemez — bilinçli, ek şema gerektirmesin diye.)
- Sınırlama: görüntü tabanlı olduğu için metin katmanı yok (arama motoru/ekran okuyucu içeriği okuyamaz); sayfa metni yalnızca başlık+alt metinlerdir. Gerçek bir PDF/metin sürümü gelirse iyileşir.

### 2b. Videolar — `/videolar`
- Kaynakta **17** YouTube gömmesi (17 benzersiz ID). **16 yayında**; **1 tanesi (sıra 7, `M8YN7yEFdIY`) YouTube'da "Gizli video"** (oEmbed 403, küçük resim 404, oynatıcı `LOGIN_REQUIRED`) → eski sitede de oynatılamıyor. Sessizce silinmedi: `videos.json`'da `available:false` + neden ile saklı, sayfada yayınlanmıyor.
- Eski sayfada video başlığı/açıklaması **yok**. Başlık ve kanal adı, videonun kendi **YouTube oEmbed** meta verisinden alındı ve `titleSource: "youtube-oembed"` ile işaretlendi; açıklama uydurulmadı. Sayfa başlığı (H1) ve title eski sayfadan aynen; meta description eski sayfanın `mezbaha sistemleri makina montaj videoları` ifadesini kullanan tek cümle.
- **Uygulama**: "facade" — ilk yüklemede yalnızca **yerel küçük resim** (16 dosya, 1.2 MB; sayfa yüklenirken YouTube'a **0 istek**), tıklanınca `youtube-nocookie.com` iframe'i yüklenir (responsive `aspect-video`); JS yoksa bağlantı YouTube'a gider. Erişilebilir ad her videoda başlık.
- **Dikkat**: videolardan biri (sıra 2) üçüncü taraf bir kanaldan (FERMER.RU, Rusça başlık); kanal adı atıf olarak görünüyor. Diğer 15'i "MEZBAHA TEKNOLOJİLERİ" kanalında. Yayında kalıp kalmayacağı editoryal karar.
- JSON-LD `VideoObject` **eklenmedi** (gerçek `uploadDate` bilinmiyor; tarih uydurulmadı). BreadcrumbList var.

### 2c. Endüstriyel Soğutma Sistemleri — `/hizmetler` ve `/hizmetler/endustriyel-sogutma-sistemleri`
- Eski sayfa (`/tr/endustriyel-sogutma-sistemleri/`, canlı 200, sitemap dışında) gerçek içeriği: 3 paragraf + 2 H2 ("…Kalite Standartları", "…ve Ses Seviyesi"), 2787 karakter, görsel ve meta description **yok**. CMS `Page` kaydı (`pageType: "service"`) olarak taşındı. **Görüntülenen metin kaynakla karakter karakter aynı** (doğrulandı: 2787 = 2787, `identical: true`).
- Kaynakta meta description olmadığından, render sırasında **gerçek metnin ilk cümlesinden türetilir** (`src/lib/seo/describe.ts`; DB'ye yazılmaz). Kaynak breadcrumb'ı "Anasayfa › Hizmetlerimiz › …" idi → `/hizmetler` indeksi eklendi. JSON-LD: BreadcrumbList + `Service`.
- Phase 11C'de "Soğutma sistemleri" anchor'ından kaldırılan link, artık hedef var olduğundan **geri eklendi** (`mezbahane-teknolojik-ekipmanlar` yazısı).
- Not: admin "Sayfalar" bölümü hâlâ yer tutucu → bu sayfa admin'den düzenlenemez (Phase 12 öncesi karar).

### Navigasyon / iç link
Ana menüye **Kataloglar** eklendi (eski sitenin menüsünde de vardı); footer "Kurumsal" listesine Kataloglar, Videolar, Hizmetler; `/urunler` ve `/kataloglar` sayfalarında bağlamsal linkler; blog yazısı → hizmet sayfası; `llms.txt` bölümlerle güncellendi (eski "geliştirme aşamasında" ifadesi kaldırıldı). Sitemap'e 5 URL eklendi. **Orphan: 0.**

### Redirect'ler (yalnızca hedefler var olduktan ve doğrulandıktan sonra eklendi)
| Eski URL | → Yeni |
|---|---|
| `/tr/kataloglar/` | `/kataloglar` |
| `/tr/mezbaha-makina-sistemleri-katalog/` | `/kataloglar/2018-mezbaha-sistemleri-katalog` |
| `/tr/mezbaha-sistemleri-videolar-941/` | `/videolar` |
| `/tr/endustriyel-sogutma-sistemleri/` | `/hizmetler/endustriyel-sogutma-sistemleri` |

Toplam redirect: 101 → **105**. `docs/url-migration-map.md` satırları (eski `/teklif-al`, `/projeler#videolar` hedefleri geçersizdi) güncellendi.

### Bulunan ve düzeltilen zincir (yeni, önemli)
Eski URL'ler sondaki `/` ile biter (`/tr/x/`). Next kendi 308'iyle `/tr/x/`→`/tr/x` yapıp **sonra** bizim 301'imiz çalışıyordu → **iki adım** (Phase 11B/11C denetimim yalnızca `/x` biçimini test ettiği için kaçırdı; **tüm 100 önceki redirect etkileniyordu**). Düzeltme: `next.config.ts` `skipTrailingSlashRedirect: true`; sondaki `/` artık `src/proxy.ts`'te yönetiliyor — önce redirect eşleşmesi (tek 301), eşleşme yoksa eski davranış (`/x/` → 308 → `/x`). Denetim betiği artık her redirect'i iki biçimde test ediyor.

---

## 3. Marka turuncusu
`#b04a20` korundu, değiştirilmedi. Koyu zemin varyantları yalnızca **ana sayfada 6 yer** (`#e0703f`: hero eyebrow + "01–05" adım numaraları) ve **her sayfanın footer'ında 4 yer** (`#8a8a8a`) — dosya/satır ve kontrol listesi: `docs/brand-orange-usage.md`.

## 4. Yayın tarihleri (`docs/publish-date-evidence.md`, `docs/publish-date-corroboration.md`)
- **3 yazıda migration damgası (2026-09-18) vardı**; damga kaydın oluşturulduğu günle aynı gün olduğu için gerçek yayın tarihi sayılmadı ve kaynakla doğrulanan tarihe çevrildi:

| Yazı | Eski (damga) | Yeni (kaynak) | Kanıt |
|---|---|---|---|
| `mezbaha-hijyeni-nasil-saglanir` | 2026-09-18 | **2025-08-13** | liste kartı "13 August 2025" + makale "13 August" + görsel yükleme günü 2025-08-13 |
| `mezbaha-kurulum-maliyeti` | 2026-09-18 | **2025-08-05** | kart "05 August 2025" + makale + görsel 2025-08-05 |
| `rayli-tasima-sistemleri-ikizray-nedir-ve-neden-kullanilir` | 2026-09-18 | **2026-03-25** | kart "25 March 2026" + makale + görsel 2026-03-25 |

- **Yeni, bağımsız ikinci kanıt**: kaynak sitede yüklenen görsel dosya adları Unix zaman damgasıyla başlar (`uploads/news/1767081839…` = 2025-12-30). Zaman damgalı görseli olan **31 yazının 31'inde** görsel yükleme günü, blog kartı tarihiyle ±1 gün içinde eşleşti (fark 0). Yani tarihler iki bağımsız kaynakla desteklenir.
- **2018 duyurusu (`online-magazamiz-yayinda`, 2018-09-09) yayında kalır**: kart "09 September 2018" + makale "09 September" eşleşiyor; görseli olmadığından ikinci kanıt yok, ancak dolaylı ipucu: sitenin 2018 kataloğunun kapak dosyası `gallery_1536524805` = 2018-09-09 (aynı gün; aynı varlık olmadığı için yalnızca destekleyici). Saat bilgisi güvenilmez olduğundan yalnızca tarih (UTC 00:00) saklanıyor.
- Sonuç: `publishedAt = NULL` yazı **0**; migration damgalı yazı **0**. Nullify edilen tarih yok (hepsi kurtarıldı).

## 5. Editoryal (değişmedi)
Uzun title'lar (`docs/editorial-review.md`: 39 title + 20 BÜYÜK HARF ad, öneriler onaysız) ve featured bayrakları hiç değiştirilmedi.

## 6–7. Süper-admin / admin
Kimlik bilgisi kullanılmadı/yazdırılmadı; giriş denenmedi. Rotasyon prosedürü ve yetkili kontrol listesi `docs/phase-11c-manual-actions.md`'de korundu (yeni maddelerle güncellendi).

## 8. Doğrulama sonuçları (production build)

| Kontrol | Sonuç |
|---|---|
| `npx tsc --noEmit` | temiz |
| `npm run lint` | temiz |
| `npm run build` | temiz |
| Sitemap | **128 URL** (123 + 5 yeni), 128×200, 128 self-canonical, 0 noindex, 0 tekrar; tüm PUBLISHED kayıtlar sitemap'te (eksik 0) |
| İç linkler | 128 benzersiz hedef, **0 kırık, 0 yönlendirmeli, 0 orphan** (yeni sayfalar menü/footer/bağlamsal linklerle bağlı) |
| Redirect | **210/210** (105 redirect × iki biçim: `/x` ve gerçek eski biçim `/x/`): hepsi tek adım 301 + hedef 200 |
| Metadata | tekrarlayan title/description 0; canonical/OG/Twitter 128/128; H1=1 128/128; `<main>` 128/128; alt'sız img 0; **yeni 5 sayfa uyarısız** (40 uzun-title uyarısı önceki kaynak title'larıdır, değişmedi) |
| JSON-LD | 0 parse hatası; yeni: katalog/video/hizmet listesi=BreadcrumbList, hizmet detayı=BreadcrumbList+Service |
| SSR / bundle | yeni içerik (katalog sayfa yolları, soğutma metni, video başlıkları, gizli video ID'si) **istemci JS chunk'larında 0**; içerik sunucu HTML'inde |
| AI crawler (Normal / OAI-SearchBot / ChatGPT-User / Claude-SearchBot) | yeni 5 sayfada kelime/img/H1 sayıları **özdeş**; description+canonical+og `</head>` içinde |
| Lighthouse (yeni sayfalar, `docs/lighthouse-results-11d.md`) | A11y/BP/SEO **100** (10/10 çalıştırma); masaüstü Perf 99; mobil Perf 86–93 (LCP 3.3–4.0 s, simüle) |
| Entity temsili | DB: 4 kategori, 55 ürün, 26 proje, 32 yazı, 317 medya, **105 redirect**, **1 sayfa (yeni)** |

## Değişen dosyalar (tam liste)

**Uygulama — değişen:** `next.config.ts`, `src/proxy.ts`, `src/app/sitemap.ts`, `src/app/llms.txt/route.ts`, `src/content/site.ts`, `src/components/public/footer.tsx`, `src/app/(public)/urunler/page.tsx`, `src/lib/queries.ts`, `src/lib/seo/json-ld.ts`.
**Uygulama — yeni:** `src/lib/legacy-content.ts`, `src/lib/seo/describe.ts`, `src/content/legacy/catalogs.json`, `src/content/legacy/videos.json`, `src/components/catalog/{catalog-viewer,catalog-controls}.tsx`, `src/components/videos/video-embed.tsx`, `src/app/(public)/kataloglar/page.tsx`, `src/app/(public)/kataloglar/[slug]/page.tsx`, `src/app/(public)/videolar/page.tsx`, `src/app/(public)/hizmetler/page.tsx`, `src/app/(public)/hizmetler/[slug]/page.tsx`.
**Varlıklar — yeni:** `public/images/migrated/catalog/2018-mezbaha-sistemleri-katalog/` (155 sayfa + kapak, ~30 MB), `public/images/migrated/videos/` (16 küçük resim, 1.2 MB).
**Migration araçları — yeni:** `prisma/migration/{acquire-legacy-content,import-legacy-pages,restore-cooling-link,corroborate-publish-dates}.ts`; **güncellenen:** `recover-publish-dates.ts` (yalnızca kanıtlı migration damgasını değiştirir), `link-overrides.ts` (soğutma linki artık hizmet sayfasına), `import-redirects.ts` (yeni hedef önekleri), `audit-site.ts` (iki biçimli redirect testi).
**Dokümanlar — yeni:** `phase-11d-report.md`, `brand-orange-usage.md`, `publish-date-corroboration.md`, `lighthouse-results-11d.md`, `migration-provenance-legacy.json`; **güncellenen:** `phase-11c-manual-actions.md`, `url-migration-map.md`, `publish-date-evidence.md`, `sitemap-validation.md`, `internal-link-audit.md`, `metadata-audit.md`, `audit-extra.json`, `migration-provenance.json`.

## DB değişiklikleri (yıkıcı değil, şema değişikliği yok)
- `Page`: **+1** (`endustriyel-sogutma-sistemleri`, service, PUBLISHED) + 1 `PageTranslation` (tr).
- `Redirect`: **+4** (yukarıdaki liste), toplam 105. Mevcut redirect değişmedi.
- `BlogPost.publishedAt`: **3** kayıt (migration damgası → kaynak tarihi).
- `BlogPostTranslation.content`: **1** kayıt (`mezbahane-teknolojik-ekipmanlar`: soğutma linki geri eklendi).
- Silme yok, reset yok, featured/title/ürün adı değişmedi.

## Bilinen sorunlar / açık noktalar
1. Production domain + hosting kararı bekleniyor (bloke). 2. Katalog görüntü tabanlı (metin katmanı yok). 3. Gizli YouTube videosu (sıra 7) yayınlanmadı. 4. Video #2 üçüncü taraf kanal. 5. `/admin/sayfalar` yer tutucu → hizmet sayfası admin'den düzenlenemez; katalog/video verisi JSON'da (admin'de yok). 6. CSP hâlâ yok. 7. `/hizmetler` indeksi statik prerender (yeni hizmet sayfası eklenince yeniden build/revalidate gerekir; admin UI olmadığı için şimdilik sorun değil). 8. Mobil Perf 83–93 (yerel, simüle).

## Kimlik/güvenlik
Hiçbir sır yazdırılmadı/dokümana girmedi (dokümanlar taranıp temiz doğrulandı); süper-admin rotasyonu yapılmadı; giriş denenmedi.

## Deploy/push/commit teyidi
Hiçbir şey deploy edilmedi, push edilmedi, commit atılmadı; stash/reset/clean/checkout yapılmadı; DNS/sunucu değişikliği yapılmadı. Sunucular iş bitiminde kapatıldı.
