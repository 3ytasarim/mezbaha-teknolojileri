# Phase 12 — Deployment Plan (HAZIRLIK; hiçbir şey uygulanmadı)

Durum: **hazırlık tamam, onay bekleniyor.** Bu belge ve `deploy/` klasörü yalnızca hazırlıktır: sunucuya bağlanılmadı, DNS/Cloudflare'e dokunulmadı, deploy/push/commit yapılmadı. Hiçbir sır değeri bu belgede yoktur (yalnızca değişken **adları**).

**Kesinleşen kararlar:** kanonik origin `https://www.mezbahateknolojileri.com` · apex `https://mezbahateknolojileri.com` → kalıcı 301 → www · hosting **VPS + nginx** · Cloudflare önde (proxied) · MX (Hostinger) **dokunulmaz**.

---

## 1. Bu hazırlık turunda yapılan kod/yapılandırma değişiklikleri

| Değişiklik | Neden |
|---|---|
| `.env.production` (yalnızca `NEXT_PUBLIC_SITE_URL=https://www.mezbahateknolojileri.com`, sır yok, gitignore'lu) | Production build artık gerçek origin ile alınır; geliştirme `.env`'i (localhost) bozulmadı |
| `src/lib/seo/site.ts` — `getSiteUrl()` sertleştirildi | Production'da değişken **yoksa / http ise / localhost ise HATA fırlatır** (yanlış origin ile sessizce yayına çıkılamaz); yalnızca origin döner (sondaki `/` veya yol atılır) |
| `src/proxy.ts` — production'da tüm yönlendirmeler **kanonik origin'e mutlak** URL ile; sorgu dizesi korunur | nginx arkasında `request.url`'nin host/şeması (ör. `http://127.0.0.1:3000`) güvenilmez; `http://`e düşme veya yanlış host riski ve olası zincir ortadan kalktı. Yanlış/keyfi `Host` başlığıyla bile Location = `https://www.mezbahateknolojileri.com/...` (denendi) |
| `next.config.ts` — `experimental.serverActions.bodySizeLimit: "10mb"` | Admin medya yükleme aksiyonu 8 MB'a izin veriyor ama Next varsayılan sınırı **1 MB** idi → production'da >1 MB yüklemeler reddedilirdi |
| `src/content/home.ts` — 3 fallback blog linki eski mutlak `/tr/...` URL'lerinden göreli `/blog/...`'e | "uygulama üretimi mutlak URL" kalmasın; eski domain yollarına bağımlılık kalktı |
| `.env.example` güncellendi | Üretim değeri ve notlar (yalnızca adlar) |
| `deploy/` klasörü (yeni) | PM2, nginx, Cloudflare real-IP betiği, duman testi (aşağıda) |
| `prisma/migration/audit-site.ts` | Origin denetimi (sitemap/canonical/OG/robots/llms/JSON-LD/Location başlıkları, beklenmeyen host tespiti) |

## 2. Gerçek origin ile doğrulama (production build, `next start`, `.env.production` ile)

| Kontrol | Sonuç |
|---|---|
| `tsc` / `lint` / `build` | temiz |
| Sitemap | **128/128** URL `https://www.mezbahateknolojileri.com/...`, hepsi 200, 128 self-canonical, 0 noindex, 0 tekrar, DB'deki tüm yayınlı kayıtlar dahil |
| Canonical host | 128/128 sayfada `www`; apex host'lu URL **0** |
| **localhost / placeholder** | Taranan 128 sayfanın HTML'inde (canonical, OG, Twitter, JSON-LD, RSC payload dahil) **0**; `robots.txt` **0**; `llms.txt` **0**; `sitemap.xml` **0**; ön-render edilmiş build çıktısı (`.next/server/app`) **0**; istemci JS (`.next/static`) **0**. Sunucu chunk'larında kalan `localhost:3000`, `site.ts` içindeki yalnızca-development fallback sabitidir (production'da erişilemez; guard hata fırlatır) |
| robots.txt | `Sitemap: https://www.mezbahateknolojileri.com/sitemap.xml` (tek satır) |
| Open Graph / Twitter | 128/128 sayfada `og:title/url/image` ve `twitter:card`; hepsi www origin |
| JSON-LD | 0 parse hatası; url/image alanları www origin; `datePublished` 32/32 yazıda |
| Redirect | **105 redirect × 2 biçim (`/x` ve `/x/`) = 210/210**: her biri tek adım 301, Location `https://www.mezbahateknolojileri.com/...`, hedef 200. Ek: sorgu dizesi korunuyor (`?utm_source=nl&x=1` hedefe taşınıyor); normal sayfa `/urunler/?a=1` → tek adım 308 `/urunler?a=1`; admin oturumsuz → 307 `/admin/login` (www) |
| İç linkler | 128 benzersiz hedef: 0 kırık, 0 yönlendirmeli, 0 orphan |
| Metadata | 0 tekrarlayan title/description, H1=1, `<main>`, alt'sız img 0 (40 uzun-title uyarısı kaynak title'ları, editoryal) |
| SSR | yazı gövdesi / katalog / soğutma metni sunucu HTML'inde; istemci chunk'larında 0 |
| AI crawler (Normal / OAI-SearchBot / ChatGPT-User / Claude-SearchBot) | içerik özdeş; description+canonical+og `</head>` içinde; canonical/og:url hepsinde www |
| Harici host'lar | yalnızca `schema.org`, `www.youtube.com` (video/kanal linkleri) ve **1 gerçek harici link**: `www.mezbahateknolojilerionlinesatis.com` (2018 duyuru yazısındaki mağaza linki — güncelliği editoryal kontrol) |
| DB | değişmedi: 55 ürün, 32 yazı, 26 proje, 4 kategori, 1 sayfa, 105 redirect, 317 medya |

> Test ortamı notu: yerel testte istekler `localhost:3700`'e gitti ama üretim origin'i ile derlendiği için tüm mutlak URL'ler www'dir. nginx yapılandırması burada **sözdizimi olarak test edilemedi** (nginx yok) → sunucuda `nginx -t` zorunlu.

---

## 3. VPS gereksinimleri

### Yazılım
| Bileşen | Gereksinim |
|---|---|
| **Node.js** | **24.x (LTS hattı)** — geliştirme/doğrulama `v24.19.0` ile yapıldı. Alt sınır: Prisma 7.10 `^20.19 \|\| ^22.12 \|\| >=24`, Next 16.3.5 `>=20.9`, sharp 0.35 `>=20.9` → **minimum 22.12**, önerilen 24.x |
| **npm** | Node ile gelen (≥10); `package-lock.json` `lockfileVersion 3` |
| İşletim sistemi | glibc tabanlı 64-bit Linux (Debian/Ubuntu LTS varsayıldı). Kilit dosyada Linux x64 ikilileri mevcut doğrulandı: `@img/sharp-linux-x64`, `@next/swc-linux-x64-gnu`, `@node-rs/argon2-linux-x64-gnu` (musl/Alpine için ayrıca doğrulanmadı → glibc kullanın) |
| **PM2** | global (`npm i -g pm2`), uygulama kullanıcısıyla; `pm2 startup systemd` ile açılışta başlatma |
| **nginx** | ≥ 1.25.1 (yapılandırmada `http2 on;`; eski sürümde `listen 443 ssl http2;`). `ssl_reject_handshake` için ≥ 1.19.4 |
| Diğer | `git` veya `rsync`, `curl`, `build-essential` gerekmez (hazır ikililer) |

### Kaynak (ölçülmedi, öneri)
≥ 2 vCPU, **≥ 4 GB RAM** (build sırasında tepe bellek; 2 GB ise ≥ 2 GB swap), ≥ 10 GB disk (repo ~0,2 GB görseller dahil, `node_modules` + `.next` + 3 release + yüklemeler). Uygulama süreci `max_memory_restart: 1G` ile korunur.

### Dizin ve kullanıcı düzeni
```
/srv/mezbaha/
  releases/<YYYYmmdd-HHMMSS>/     # her dağıtım ayrı dizin (kod + .next + node_modules)
  current -> releases/<son>       # PM2 ve nginx bunu kullanır (symlink)
  shared/
    .env.production               # sırlar (chmod 600) — release'lere symlink'lenir
    uploads/                      # admin yüklemeleri (kalıcı) — release/public/uploads buraya symlink
/var/log/mezbaha/                 # PM2 logları
```
Uygulama root olarak ÇALIŞMAZ: özel bir kullanıcı (`mezbaha`) ile.

### Port ve ağ
- Uygulama: **`127.0.0.1:3000`** (yalnızca loopback; dışarıya doğrudan açık değil).
- nginx: 80 ve 443. Güvenlik duvarı: 22 (mümkünse kısıtlı), 80/443 (mümkünse yalnızca Cloudflare aralıklarından), **3000 kapalı**.

### Kalıcı / statik varlıklar
| Varlık | Nerede | Not |
|---|---|---|
| Build zamanı görseller (`public/images/**`: migrated ürün/blog/proje, **katalog 155 sayfa**, video küçük resimleri, hero, kategoriler) | kodla birlikte gelir (~156 MB) | Next `public/` klasörü build/başlangıçta indekslenir |
| **Admin yüklemeleri** (`STORAGE_PROVIDER=local` → `public/uploads`) | **`/srv/mezbaha/shared/uploads`** (kalıcı), release'te symlink | **Next production'da çalışma anında `public/`'a eklenen dosyaları servis ETMEZ** → nginx `location ^~ /uploads/ { alias /srv/mezbaha/shared/uploads/; }` ile sunar (hazır). Yedekleyin |
| İçerik veri dosyaları | `src/content/legacy/{catalogs,videos}.json` | kodla gelir |
| Veritabanı | **Neon PostgreSQL** (dış) | VPS'te DB yok |

---

## 4. Ortam değişkenleri (yalnızca ADLAR — değerler `/srv/mezbaha/shared/.env.production`'da, repo dışında)

| Ad | Zorunlu | Gizli | Ne zaman | Not |
|---|---|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | **Evet** | Hayır | **build** + runtime | Değer: `https://www.mezbahateknolojileri.com`. Build'e gömülür → değişirse yeniden build. Eksik/http/localhost ise build/istek hata verir |
| `DATABASE_URL` | **Evet** | **Evet** | runtime + build (sitemap/statik sayfa DB okur) | Neon **pooled** connection string |
| `DIRECT_URL` | Migrasyon için | **Evet** | `prisma migrate deploy` | Neon **direct** (pooler olmayan) bağlantı; yoksa `DATABASE_URL`'e düşer |
| `AUTH_SECRET` | Önerilir | **Evet** | — | `.env.example`'da tanımlı ama **kodda şu an okunmuyor** (oturumlar DB'de rastgele token hash'iyle tutuluyor). Yine de güçlü, **yeniden üretilmiş** bir değer koyun (dev değeri kullanılmasın) |
| `STORAGE_PROVIDER` | Hayır (varsayılan `local`) | Hayır | runtime | Yalnızca `local` destekleniyor; başka değer hata fırlatır |
| `STORAGE_ENDPOINT`, `STORAGE_REGION`, `STORAGE_BUCKET`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_PUBLIC_URL` | **Hayır** | (Access/Secret: evet) | — | Şimdilik kodda kullanılmıyor (S3 uygulaması yok); boş bırakın |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | **Hayır — production'a KOYMAYIN** | **Evet** | yalnızca ilk seed | Süper-admin zaten var; production'da seed çalıştırılmayacak. Parola rotasyonu ayrı prosedürle (`phase-11c-manual-actions.md` §3) |
| `NODE_ENV` | PM2 ayarlar (`production`) | Hayır | runtime | `npm run build` da otomatik `production` |
| `PORT`, `HOSTNAME` | PM2 ayarlar (`3000`, `127.0.0.1`) | Hayır | runtime | ecosystem dosyasında |
| `NEXT_TELEMETRY_DISABLED` | İsteğe bağlı (`1`) | Hayır | | ecosystem dosyasında |
| `MEZBAHA_APP_DIR`, `MEZBAHA_LOG_DIR` | İsteğe bağlı | Hayır | yalnızca PM2 dosyası | varsayılan `/srv/mezbaha/current`, `/var/log/mezbaha` |

Dosya biçimi notları: `.env.production` içinde `#`, `$` veya boşluk içeren değerleri tırnak içine alın (dotenv `#`'i yorum sayar). Dosya izni `600`, sahibi `mezbaha`.
**Prisma CLI notu:** `prisma.config.ts` yalnızca `.env`'yi otomatik yükler (`import "dotenv/config"`), `.env.production`'ı **değil** → migrasyon adımında değişkenler kabuğa alınmalı (aşağıdaki `set -a; . ./.env.production; set +a`).

---

## 5. Kaynak kodun sunucuya ulaştırılması — dikkat

`Mezbaha-Teknolojileri/` şu an git'te **izlenmiyor** (`??`) ve üst dizindeki repo'nun `origin`'i **başka bir projeye** (pestshield) ait. Bu projeyi o remote'a **push ETMEYİN**. Seçenekler (siz karar verin):
1. **Bu proje için ayrı bir git deposu** oluşturup oradan `git clone`/`pull` (önerilen; ~145 MB `public/images/migrated` + ~30 MB katalog git'e girer — GitHub sınırları içinde), veya
2. `rsync`/`tar` ile paket gönderimi. Hariç tutulacaklar: `node_modules`, `.next`, `.env*`, `public/uploads`, `.git`. **Dahil olmalı:** `src`, `public` (images dahil), `prisma` (schema+migrations+config), `deploy`, `package.json`, `package-lock.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs`, `docs` (isteğe bağlı).

---

## 6. Dağıtım adımları (onaydan SONRA, sunucuda; komutlar hazır)

### 6.1 Bir kerelik sunucu hazırlığı
```bash
# (root) kullanıcı ve dizinler
adduser --system --group --home /srv/mezbaha mezbaha
mkdir -p /srv/mezbaha/releases /srv/mezbaha/shared/uploads /var/log/mezbaha
chown -R mezbaha:mezbaha /srv/mezbaha /var/log/mezbaha

# Node.js 24.x (NodeSource veya nvm — kurulum yöntemi size ait) + PM2
node -v            # v24.x bekleniyor
npm i -g pm2

# sırlar dosyası (değerleri siz girin; içerik bu belgeye/loglara yazılmaz)
sudo -u mezbaha install -m 600 /dev/null /srv/mezbaha/shared/.env.production
sudo -u mezbaha nano /srv/mezbaha/shared/.env.production   # yalnızca §4'teki ADLAR

# nginx dosyaları
cp deploy/nginx/mezbahateknolojileri.com.conf /etc/nginx/sites-available/
ln -s /etc/nginx/sites-available/mezbahateknolojileri.com.conf /etc/nginx/sites-enabled/
mkdir -p /etc/nginx/snippets && cp deploy/nginx/snippets/*.conf /etc/nginx/snippets/
bash deploy/nginx/cloudflare-realip-update.sh        # /etc/nginx/conf.d/cloudflare-realip.conf üretir + nginx -t + reload
# sertifikayı yerleştirin (bkz. §7 ve snippets/mezbaha-ssl.conf), sonra:
nginx -t && systemctl reload nginx
```

### 6.2 Her sürüm (release)
```bash
# (mezbaha kullanıcısıyla)
REL=/srv/mezbaha/releases/$(date +%Y%m%d-%H%M%S)
mkdir -p "$REL"      # kodu buraya getirin (git clone / rsync)
cd "$REL"

ln -s /srv/mezbaha/shared/.env.production .env.production
mkdir -p public && ln -sfn /srv/mezbaha/shared/uploads public/uploads

npm ci                                     # devDependencies gerekli (tailwind, typescript, prisma CLI)
set -a; . ./.env.production; set +a        # Prisma CLI için (yalnızca bu kabukta)
npx prisma generate
npm run build                              # NEXT_PUBLIC_SITE_URL .env.production'dan gömülür
npm run db:deploy                          # = prisma migrate deploy (yalnızca ekleyici migrasyonlar; reset YOK)
```
Beklenen: mevcut Neon DB'de tüm migrasyonlar zaten uygulanmış → "No pending migrations".

### 6.3 Yayına alma ve PM2
```bash
ln -sfn "$REL" /srv/mezbaha/current

# İlk kez:
pm2 start /srv/mezbaha/current/deploy/ecosystem.config.cjs
pm2 save
# (root) pm2 startup systemd -u mezbaha --hp /srv/mezbaha    # çıktıdaki komutu root ile çalıştırın

# Sonraki sürümler:
pm2 startOrReload /srv/mezbaha/current/deploy/ecosystem.config.cjs --update-env
pm2 save

# Doğrulama: süreç yeni release'i mi çalıştırıyor?
readlink /proc/$(pm2 pid mezbaha-teknolojileri)/cwd     # yeni $REL yolu görülmeli
pm2 logs mezbaha-teknolojileri --lines 50
```
**PM2 yapılandırması** (`deploy/ecosystem.config.cjs`): tek süreç (`fork`, `instances: 1`), `next start --hostname 127.0.0.1 --port 3000`, `NODE_ENV=production`, otomatik yeniden başlatma (`max_restarts 10`, `min_uptime 20s`), `max_memory_restart 1G`, `kill_timeout 10s`, loglar `/var/log/mezbaha`. Sırlar PM2 dosyasında **yok** (Next `.env.production`'ı kendisi yükler). Log döndürme: `pm2 install pm2-logrotate`.

### 6.4 Doğrulama (DNS'e dokunmadan, doğrudan origin'e)
```bash
ORIGIN_IP=<VPS_IP> INSECURE=1 bash deploy/smoke-test.sh
```
(`curl --resolve` ile apex/www VPS IP'sine sabitlenir; Cloudflare atlanır. Origin CA sertifikası genel güvenilir olmadığından `INSECURE=1`.) Betik: 4 giriş noktası, sorgu korunması, 6 legacy redirect + sorgu, 15 kanonik sayfa 200, admin 307, 404, robots/sitemap/llms/canonical'da localhost/placeholder olmaması, güvenlik başlıkları, `X-Powered-By` yokluğu. Hepsi geçmeden DNS'e geçmeyin.
Ek olarak tam denetim (yerelden, `EXPECTED_ORIGIN` varsayılan www): `VALIDATE_BASE_URL` yerine üretim adresi hedeflenip `npx tsx prisma/migration/audit-site.ts` çalıştırılabilir (canlı geçişten sonra).

### 6.5 Geri alma (rollback)
- **Uygulama:** `ln -sfn /srv/mezbaha/releases/<önceki> /srv/mezbaha/current && pm2 reload mezbaha-teknolojileri` (önceki 2–3 release saklayın). Migrasyonlar yalnızca ekleyici olduğundan DB geri alma gerekmez.
- **DNS:** Cloudflare'de değiştirmeden önce `@` ve `www` kayıtlarının **eski değerlerini not edin/ekran görüntüsü alın**; geri almak = eski değerleri geri yazmak. Hostinger tarafındaki eski site, geçiş doğrulanana kadar kapatılmamalı.

---

## 7. nginx planı (`deploy/nginx/`)

Dosyalar: `mezbahateknolojileri.com.conf`, `snippets/mezbaha-proxy.conf`, `snippets/mezbaha-ssl.conf`, `cloudflare-realip-update.sh`.

| İstek | Davranış | Nasıl |
|---|---|---|
| `http://mezbahateknolojileri.com/…` | **301 → `https://www.mezbahateknolojileri.com$request_uri`** (tek adım, yol + sorgu + sondaki `/` korunur) | 80 portu server bloğu |
| `http://www.mezbahateknolojileri.com/…` | 301 → `https://www.mezbahateknolojileri.com$request_uri` (tek adım) | aynı blok |
| `https://mezbahateknolojileri.com/…` | **301 → `https://www.mezbahateknolojileri.com$request_uri`** | 443 apex bloğu |
| `https://www.mezbahateknolojileri.com/…` | uygulamaya proxy (`127.0.0.1:3000`) | 443 www bloğu |
| Tanınmayan host / doğrudan IP | 80: `444` (bağlantıyı kes); 443: TLS el sıkışması reddi | `default_server` bloklar |

Tasarım kararları:
- **Sondaki `/` normalizasyonu YOK.** `rewrite`/`try_files`/`return` ile `/` ekleme-atma yok; `proxy_pass http://mezbaha_app;` **URI kısmı içermez** (sonunda `/` yok) → istek URI'si uygulamaya birebir gider. Eski `/tr/x/` URL'leri uygulamada tek adımda 301'lenir (Phase 11D davranışı korunur). Apex'teki bir eski URL: apex→www (1) + legacy 301 (2) = 2 adım; bunlar dış bağlantılar için nadir ve hedef zaten www; istenirse tek adıma indirilebilir (bkz. §10 opsiyonel).
- **Sorgu dizesi korunur:** `$request_uri` ham URI+sorgudur; uygulama içi yönlendirmeler de sorguyu taşır.
- **Döngü yok:** 443 www bloğu yönlendirme yapmaz; apex bloğu yalnızca www'ye gider; uygulama yalnızca yollar arası yönlendirir ve her zaman mutlak www origin'e (ikinci bir host değişimi üretmez).
- **Proxy başlıkları:** `Host`, `X-Real-IP`, `X-Forwarded-For`, `X-Forwarded-Proto`, `X-Forwarded-Host`; upstream keepalive (`Connection ""`, `keepalive 32`).
- **Next.js streaming:** `proxy_buffering off` (RSC/Suspense parçaları anında akar); nginx gzip kapalı (Next zaten sıkıştırır, Cloudflare kenarda brotli/gzip).
- **Statik:** `/_next/static/*` immutable başlığını Next'ten alır (nginx dokunmaz); `/images/*` için 7 gün önbellek; `/uploads/*` kalıcı dizinden doğrudan (30 gün).
- **Yükleme:** `client_max_body_size 12m` (uygulama 8 MB + Server Actions 10 MB sınırı).
- **Admin girişi:** `/admin/login` için `limit_req` (10 istek/dk, burst 10, 429) — uygulamada henüz brute-force koruması olmadığından.
- **Güvenlik başlıkları nginx'te TEKRARLANMAZ** (uygulama ekliyor: HSTS, nosniff, X-Frame-Options, Referrer-Policy, Permissions-Policy; `X-Powered-By` kapalı).
- **TLS:** Cloudflare Origin CA (önerilen, Full strict) veya Let's Encrypt (DNS-01 önerilir); TLS 1.2/1.3.
- **Gerçek IP:** Cloudflare aralıkları resmi listeden `cloudflare-realip-update.sh` ile üretilir (`set_real_ip_from` + `real_ip_header CF-Connecting-IP`); aralıklar değişebileceğinden periyodik çalıştırın.
- Doğrulama zorunlu: sunucuda **`nginx -t`** (bu ortamda nginx olmadığından test edilemedi).

---

## 8. Cloudflare / DNS — sizin elle doğrulayacaklarınız (ben DNS/Cloudflare'e dokunmadım)

Bugünkü durum (salt-okunur inceleme): NS = `zahir.ns.cloudflare.com`, `lara.ns.cloudflare.com`; apex ve www **proxied**; MX = `mx1.hostinger.com` (5), `mx2.hostinger.com` (10); mevcut site apex/HTTP'yi `https://www`'ya 301'liyor; yanıtta `PHPSESSID` (PHP origin).

**A. DNS kayıtları** (Cloudflare > DNS)
1. **MX kayıtlarına (mx1/mx2.hostinger.com) DOKUNMAYIN.** MX kayıtları proxied olamaz; "DNS only" kalmalı.
2. **TXT/CNAME e-posta ve doğrulama kayıtlarına DOKUNMAYIN**: SPF (`v=spf1…`), DKIM (`…_domainkey`), DMARC (`_dmarc`), Google Search Console/diğer doğrulama TXT'leri, ve varsa `mail`/`webmail`/`smtp`/`imap`/`pop`/`autodiscover`/`autoconfig` alt alan adları.
3. Yalnızca **`@` (apex)** ve **`www`** kayıtlarını VPS'e çevireceksiniz (A ve varsa AAAA; **Proxied** kalsın). Değiştirmeden önce mevcut değerleri not edin (rollback için). IPv6 kullanmayacaksanız eski AAAA kaydı eski origin'e işaret etmeye devam etmesin (kaldırın/eşitleyin) — aksi halde bazı ziyaretçiler eski siteye gider.
4. Başka alt alan adlarının (ör. `cpanel`, `ftp`, `webmail`) eski origin'e bağımlı olup olmadığını kontrol edin.
5. Hostinger planı hem barındırma hem e-posta içeriyorsa, **barındırmayı iptal etmeden önce e-postanın bağımsız çalıştığını** doğrulayın.

**B. SSL/TLS**
6. Mod **Full (strict)** (Flexible/Full değil). Origin'de geçerli sertifika hazır olmadan modu değiştirmeyin.
7. "Always Use HTTPS" açık; minimum TLS 1.2; TLS 1.3 açık.
8. **Cloudflare HSTS'i kapalı tutun** (uygulama HSTS gönderiyor; çift/çelişkili politika olmasın).
9. Origin CA sertifikası oluşturup sunucuya koyun (veya Let's Encrypt). İsteğe bağlı: Authenticated Origin Pulls.

**C. Yönlendirme / kural çakışmaları (döngü riski)**
10. **Redirect Rules / Page Rules / Bulk Redirects / Transform Rules / Workers**'ı gözden geçirin: mevcut eski-site yönlendirmesi (apex→www, HTTP→HTTPS) Cloudflare'de mi origin'de mi tanımlı? **www→apex** yönünde veya sondaki `/` ekleyen/atan bir kural **varsa kaldırın/devre dışı bırakın** — nginx'in apex→www kuralıyla döngü ve zincir yaratır. apex→www'yi hem Cloudflare'de hem nginx'te birden yapmayın (birini seçin; nginx yapılandırması hazır).
11. Cache Rules: HTML için "Cache Everything" **olmamalı**; `/admin*` cache'lenmemeli.

**D. Hız / optimizasyon**
12. **Rocket Loader KAPALI**, Auto Minify KAPALI (varsa) — hydration'ı bozabilir.
13. **Email Address Obfuscation** (Scrape Shield): eski sitenin HTML'inde `/cdn-cgi/scripts/…/email-decode.min.js` görüldü → açık. Açıkken Cloudflare e-posta adreslerini HTML'de yeniden yazar (`[email protected]`); bu, **React hydration uyuşmazlığına ve mailto bozulmasına** yol açabilir. **Kapatın** veya iletişim sayfasını canlıda doğrulayın.
14. Brotli açık, HTTP/2 ve HTTP/3 açık (sorun değil).

**E. Güvenlik / botlar**
15. Bot Fight Mode / Super Bot Fight Mode / **"Block AI bots"** / AI Labyrinth: `robots.txt` OAI-SearchBot, ChatGPT-User, Claude-SearchBot, ClaudeBot, PerplexityBot vb. için `Allow` diyor; Cloudflare bunları engellerse GEO hedefiyle çelişir → ayarları gözden geçirin.
16. **Cloudflare "Managed robots.txt"** açıksa Cloudflare kendi içeriğini `robots.txt`'e ekleyebilir; canlı `https://www.mezbahateknolojileri.com/robots.txt`'in uygulamanın çıktısıyla aynı olduğunu doğrulayın (tek `Sitemap:` satırı).
17. Under Attack modu kapalı (normal durumda); isteğe bağlı olarak `/admin/login` için Cloudflare rate-limit kuralı (nginx sınırına ek).
18. VPS güvenlik duvarında 80/443'ü mümkünse yalnızca Cloudflare aralıklarına açın; 3000'i dışarı açmayın.

**F. Geçiş sonrası**
19. Cloudflare önbelleğini **Purge Everything** (eski sitenin önbelleğindeki varlıklar).
20. `deploy/smoke-test.sh` (canlı DNS'e karşı, `ORIGIN_IP` olmadan) ve tarayıcıdan `http://mezbahateknolojileri.com/urunler?x=1` → `https://www.mezbahateknolojileri.com/urunler?x=1` (tek adım) kontrolü.
21. Search Console/Bing Webmaster: mevcut mülkü koruyun (TXT doğrulaması silinmesin), `sitemap.xml`'i (128 URL) yeniden gönderin; kapsam ve 404 raporlarını izleyin.

---

## 9. Geçiş (cutover) sırası

1. **Hazırlık (canlıya etkisiz):** sunucu kurulumu, nginx, sertifika, `.env.production`, ilk release + `db:deploy`, PM2 başlat.
2. `ORIGIN_IP=<VPS_IP> INSECURE=1 bash deploy/smoke-test.sh` → tüm maddeler PASS.
3. Süper-admin **parola rotasyonu** yapıldığını teyit edin (zorunlu, §10).
4. Eski sitede yeni içerik yayınlanmadığını doğrulayın (dondurma) — yayınlandıysa taşıma araçları yeniden çalıştırılmalı.
5. Cloudflare'de `@` ve `www` A/AAAA → VPS (Proxied); MX/TXT'e dokunma.
6. Canlı smoke test, cache purge, `sitemap.xml` gönderimi, ilk 24 saat log/404 izleme.
7. Sorun olursa: rollback (§6.5).

## 10. Açık riskler ve go-live öncesi kararlar

| # | Konu | Durum |
|---|---|---|
| 1 | **Süper-admin parolası ele geçirilmiş sayılıyor**; rotasyon sizin işiniz | Zorunlu — `phase-11c-manual-actions.md` §3 |
| 2 | **Proje için ayrı git deposu yok**; mevcut remote başka projeye ait | Karar: ayrı repo mu, rsync mi (§5) |
| 3 | Yeni sitede **analitik/etiket (GTM) yok**, **herkese açık iletişim/teklif formu yok** (yalnızca tel/mailto), e-posta gönderimi yok; eski sitede GTM ve form eklentisi vardı | Geçişte ölçüm ve form kaynaklı lead akışı kesilir → bilinçli karar / Phase 13 (analitik, form) |
| 4 | CSP yok (nonce tabanlı politika ayrıca tasarlanmalı) | İleriye dönük |
| 5 | Admin "Sayfalar" bölümü yer tutucu; katalog/video JSON'da | Editör beklentisi |
| 6 | Yerel dosya depolama (admin yüklemeleri) tek VPS diskinde | Yedekleyin (`shared/uploads`); ileride S3 |
| 7 | Üretim DB'si = şu an geliştirmede kullanılan Neon DB | Yayına çıkınca geliştirme için ayrı Neon **branch**'i kullanın; taşıma betiklerini production'a karşı çalıştırmayın |
| 8 | `AUTH_SECRET` kodda kullanılmıyor | Zararsız; yine de yeni değer |
| 9 | nginx yapılandırması burada test edilemedi | Sunucuda `nginx -t` + smoke test |
| 10 | apex'teki eski URL'ler 2 adım (apex→www→hedef) | Kabul edilebilir; opsiyonel tek adım: apex 443 bloğunda yalnızca `/tr/` yollarını uygulamaya proxy'leyip (Host'u www yaparak) uygulamanın mutlak www 301'ini kullanmak — döngü riski nedeniyle şimdilik uygulanmadı |
| 11 | Neon pooled/direct URL'leri, bölge (VPS'e yakınlık), bağlantı limitleri | Panelden doğrulayın |

## 11. Onay kapısı

Aşağıdakilerin **hiçbiri** sizin açık onayınız olmadan yapılmayacak: sunucuya SSH, paket kurulumu, dosya kopyalama, nginx/PM2 kurulumu, `npm run build`/`db:deploy` (sunucuda), DNS/Cloudflare değişikliği, cache purge, push/commit, herhangi bir üretim işlemi.
