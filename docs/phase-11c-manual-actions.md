# Manuel Aksiyonlar (Phase 11C → 11D → 12 hazırlığında güncellendi)

Öncelik sırasıyla. Ayrıntılı dağıtım planı: **`docs/phase-12-deployment-plan.md`**. Hiçbir üretim işlemi onayınız olmadan yapılmayacak.

## Karara bağlananlar (sizden aksiyon gerekmiyor)

| Konu | Karar / durum |
|---|---|
| **Kanonik origin** | **`https://www.mezbahateknolojileri.com`** (www). Apex `https://mezbahateknolojileri.com` → kalıcı 301 → www. Kodda/yerel `.env.production`'da ayarlandı ve doğrulandı |
| Hosting | **VPS + nginx**, Cloudflare önde. PM2, nginx, real-IP betiği ve duman testi `deploy/` altında hazır |
| Kataloglar / Videolar / Endüstriyel Soğutma | Oluşturuldu, eski URL'lerden tek adımlı 301 (Phase 11D) |
| Marka turuncusu | `#b04a20` kalıcı; koyu zemin varyantları `docs/brand-orange-usage.md` |
| Yayın tarihleri | Tüm yazılarda kaynak-destekli; migration damgası kalmadı |
| Uzun title / BÜYÜK HARF / featured | Değişmedi, editoryal incelemeye bırakıldı |

## 1. Süper-admin parolasını döndürün — ZORUNLU (geçişten ÖNCE)

Sızmış parola ele geçirilmiş sayılır. Projede güvenli, dokümante bir parola-değiştirme mekanizması **yok**: `/admin/kullanicilar` yer tutucu; `seed` mevcut kullanıcı varsa atlıyor. Bu yüzden bende çalıştırmadım. Prosedür (parola hiçbir yere yazılmaz, komut satırı argümanı/ortam değişkeni/dosya olarak verilmez, bana da göndermeyin):

1. **Yeni parola üretin**: parola yöneticinizle 20+ karakterlik rastgele parola (eskisiyle alakasız). Başka yerde kullanmayın.
2. **Bir kerelik yerel betik** (repo dışında/geçici bir dosya; commit etmeyin; işiniz bitince silin). Parolayı gizli girdi olarak sorar, projenin kendi argon2 ayarlarıyla hashler, DB'yi günceller ve **tüm mevcut oturumları siler**:
   ```ts
   // rotate-admin.ts  (proje kökünde çalıştırın: npx tsx rotate-admin.ts)
   import "dotenv/config";
   import readline from "node:readline";
   import { PrismaClient } from "@prisma/client";
   import { PrismaPg } from "@prisma/adapter-pg";
   import { hashPassword } from "./src/lib/auth/password";

   function askHidden(q: string): Promise<string> {
     return new Promise((resolve) => {
       const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
       (rl as any)._writeToOutput = (s: string) => { if (s.includes(q)) process.stdout.write(s); };
       rl.question(q, (a) => { rl.close(); process.stdout.write("\n"); resolve(a); });
     });
   }

   (async () => {
     const email = (await askHidden("Admin e-posta: ")).trim();
     const pw1 = await askHidden("Yeni parola: ");
     const pw2 = await askHidden("Tekrar: ");
     if (pw1 !== pw2 || pw1.length < 20) throw new Error("Parolalar eşleşmiyor veya <20 karakter");
     const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
     const user = await prisma.adminUser.findUnique({ where: { email } });
     if (!user) throw new Error("Kullanıcı bulunamadı");
     await prisma.adminUser.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(pw1) } });
     const { count } = await prisma.session.deleteMany({ where: { adminUserId: user.id } });
     console.log("Parola güncellendi; silinen oturum sayısı:", count);
     await prisma.$disconnect();
   })();
   ```
   (Şema: `AdminUser.passwordHash`, `Session.adminUserId`; hash `src/lib/auth/password.ts` → `@node-rs/argon2`. Üretim DB'si şu an yerelde kullanılan Neon DB olduğundan bu betik doğrudan üretim hesabını günceller.)
3. **Yerel `.env`'deki `SEED_ADMIN_PASSWORD`'ü** silin/boşaltın ve yeni parolayı oraya **yazmayın**. **Üretim `.env.production`'una `SEED_ADMIN_*` koymayın.** Aynı parolanın kullanıldığı başka her yeri (Neon/parola yöneticisi/notlar) de güncelleyin.
4. **Eski parolanın göründüğü yerleri temizleyin**: sızdığı önceki faz raporu/sohbet çıktısı/loglar/ekran görüntüleri; paylaşıldıysa alıcılara bildirin.
5. **Diğer sırları da düşünün**: aynı çıktıda başka değer (DB bağlantısı, `AUTH_SECRET`) görüldüyse yenileyin (Neon konsolundan DB parolası/connection string; üretim için **yeni** `AUTH_SECRET`).
6. **Doğrulama**: `/admin/login` ile yeni parolayla girin; eski parolanın **reddedildiğini** ve eski oturum çerezinin geçersiz olduğunu kontrol edin. Betik dosyasını silin.
7. **Kalıcı çözüm (öneri)**: `/admin/kullanicilar`'a "parolamı değiştir" akışı + deneme sınırı. İsterseniz yaparım.

## 2. Phase 12 için sizden gereken bilgi/kararlar

1. **VPS bilgileri**: sağlayıcı/işletim sistemi sürümü, IPv4 (ve varsa IPv6) adresi, RAM/CPU (önerilen ≥2 vCPU/4 GB). SSH erişimini bana vermenizi istemiyorum — komutları siz çalıştırırsınız veya açıkça onay verip yönlendirirsiniz.
2. **Kaynak kodun sunucuya gidiş yolu**: `Mezbaha-Teknolojileri/` git'te izlenmiyor ve üst repo'nun `origin`'i **pestshield** projesine ait → **oraya push edilmemeli.** (a) bu proje için **ayrı bir git deposu** oluşturmak (önerilen) veya (b) `rsync`/`tar` ile göndermek. Karar bekleniyor.
3. **TLS sertifikası**: Cloudflare Origin CA (önerilen, Full strict) mi, Let's Encrypt mi?
4. **Node.js 24.x** kurulumu yöntemi (NodeSource/nvm) ve **PM2** kurulumu — sizin sunucunuzda.
5. **Geçişte kaybedilecek işlevler için karar**: yeni sitede **analitik/etiket (eski sitede GTM vardı) yok** ve **herkese açık iletişim/teklif formu yok** (yalnızca tel/mailto; e-posta gönderimi yok; eski sitede form eklentisi vardı). Geçişi bu haliyle mi yapacağız, yoksa önce (Phase 13) analitik + form mu ekleyelim?
6. **Neon**: pooled (`DATABASE_URL`) ve direct (`DIRECT_URL`) connection string'lerini, Neon bölgesinin VPS'e yakınlığını doğrulayın; yayına çıkınca **geliştirme için ayrı bir Neon branch'i** açın (üretim DB'si şu an geliştirmede kullanılan DB).
7. **Yedekleme**: `/srv/mezbaha/shared/uploads` (admin yüklemeleri), `.env.production` (parola yöneticinizde), nginx yapılandırması (repo'da).

## 3. Cloudflare / DNS — elle doğrulayacaklarınız (ben hiçbir DNS/Cloudflare değişikliği yapmadım)

Tam liste ve gerekçeler: `docs/phase-12-deployment-plan.md` §8. Özet kontrol listesi:

**DNS**
- [ ] **MX (`mx1.hostinger.com` 5, `mx2.hostinger.com` 10) DOKUNULMAZ**; "DNS only".
- [ ] SPF/DKIM/DMARC/Search Console doğrulama TXT'leri ve `mail`/`webmail`/`smtp`/`imap`/`pop`/`autodiscover` benzeri kayıtlar olduğu gibi kalıyor.
- [ ] Yalnızca `@` ve `www` → VPS IP (A, varsa AAAA), **Proxied**; eski değerleri not aldınız (rollback). Eski AAAA kaydı eski origin'de kalmıyor.
- [ ] Hostinger planı hem barındırma hem e-posta ise, barındırmayı iptal etmeden önce e-postanın bağımsız çalıştığını doğruladınız.

**SSL/TLS**
- [ ] Mod **Full (strict)**; Always Use HTTPS açık; min TLS 1.2; **Cloudflare HSTS kapalı** (uygulama HSTS gönderiyor).
- [ ] Origin sertifikası sunucuda hazır (Origin CA veya Let's Encrypt).

**Kural çakışmaları / döngü**
- [ ] Redirect Rules / Page Rules / Bulk Redirects / Transform Rules / Workers incelendi: **www→apex** yönünde veya sondaki `/` ekleyen/atan kural **yok** (varsa kapatın); apex→www yönlendirmesi yalnızca **bir yerde** (nginx'te hazır).
- [ ] HTML için "Cache Everything" yok; `/admin*` cache'lenmiyor.

**Optimizasyon / güvenlik**
- [ ] **Rocket Loader ve Auto Minify KAPALI.**
- [ ] **Email Address Obfuscation KAPALI** (eski sitede `/cdn-cgi/scripts/…/email-decode.min.js` görüldü → açık; hydration/mailto bozabilir) — ya da iletişim sayfası canlıda doğrulandı.
- [ ] Bot Fight Mode / **Block AI bots** / AI Labyrinth: OAI-SearchBot, ChatGPT-User, Claude-SearchBot, ClaudeBot, PerplexityBot **engellenmiyor**.
- [ ] **Managed robots.txt** kapalı ya da canlı `robots.txt` uygulamanın çıktısıyla aynı (tek `Sitemap:` satırı).
- [ ] VPS güvenlik duvarı: 80/443 (mümkünse yalnızca Cloudflare aralıkları), 22 kısıtlı, **3000 kapalı**.

**Geçiş sonrası**
- [ ] Cloudflare **Purge Everything**; `bash deploy/smoke-test.sh` (canlı) tüm PASS; tarayıcıdan `http://mezbahateknolojileri.com/urunler?x=1` → tek adımda `https://www.mezbahateknolojileri.com/urunler?x=1`.
- [ ] Search Console/Bing: mevcut mülk korunur (TXT silinmez), `sitemap.xml` (128 URL) yeniden gönderilir; kapsam/404 izlenir.

## 4. Yetkili (giriş gerektiren) admin tıklama testleri — siz yapın

Kimlik bilgisi kullanmadığım için yapılamadı; sırayla:
1. Giriş → çıkış → tekrar giriş; yanlış parolada hata mesajı ve gecikme/kilit davranışı. (nginx'te `/admin/login` için oran sınırı var: 10 istek/dk, burst 10 → 429.)
2. **Ürünler**: liste açılış hızı (55 kayıt), arama/filtre/sayfalama, bir ürünü düzenle (ör. kısa açıklama) → **Kaydet** → public `/urun/<slug>`'da güncellemeyi gör → **geri al** → tekrar doğrula. Yeni ürün ekle/sil (test kaydı), görsel yükle ve sil (kullanımdaki görselin silinmesi engellenmeli). **1 MB'dan büyük bir görsel yükleyin** (Server Actions sınırı 10 MB'a çıkarıldı; production'da doğrulanmalı) ve yüklenen dosyanın `https://www.mezbahateknolojileri.com/uploads/...` adresinden açıldığını kontrol edin (nginx `/uploads/` kalıcı dizinden sunar).
3. **Blog**: yazı düzenle, yayın tarihi alanı (tüm yazılarda dolu), taslak↔yayında geçişi, sitemap'e yansıması; gövdedeki görsel/tablo/link kaydı sanitizer'dan sonra bozulmuyor mu.
4. **Projeler**: kapasite paketi ve referans proje düzenleme; öne çıkan (featured) bayrağı → ana sayfaya yansıma.
5. **Featured seçimi** (`docs/featured-content-review.md`): ana sayfada hangi 6 ürün / 3 yazı olsun.
6. **SEO → Redirect'ler**: yeni redirect ekle → 301 çalışıyor → sil. Zincir/döngü uyarısı var mı. Listede 105 redirect (kataloglar, katalog, videolar, soğutma dahil) görünüyor mu.
7. **Medya kütüphanesi**: 317 kayıt listesi, kullanım-koruması, yükleme.
8. **Menü, Sayfalar, Ayarlar, Talepler**: **Not:** "Sayfalar" bölümü yer tutucu; "Endüstriyel Soğutma Sistemleri" `Page` kaydı burada görünmez/düzenlenemez — beklenen davranış. Talepler bölümü: herkese açık form olmadığından şu an veri gelmez.
9. **Yetki rolleri**: EDITOR hesabıyla SUPERADMIN'e özel sayfalara erişim engelleniyor mu.
10. Mobil tarayıcıda admin kullanılabilirliği.

## 5. Görsel/UX incelemeleri (Phase 11D yeni sayfaları)

1. **Katalog** (`/kataloglar/2018-mezbaha-sistemleri-katalog`): mobilde kaydırma, ok tuşları, "Sayfaya git", okunabilirlik.
2. **Videolar** (`/videolar`): küçük resme tıklayınca oynatma, mobil tam ekran, başlıklar.
3. **Soğutma sayfası**: yalnızca metin; görsel/CTA ister misiniz (görseli siz sağlayın).
4. **Marka turuncusu**: `docs/brand-orange-usage.md` kontrol listesi.
5. **Ana menü**: 6 öğe masaüstü/mobilde sığıyor mu.

## 6. Video / katalog ile ilgili editoryal noktalar

- **Gizli YouTube videosu** (sıra 7, `M8YN7yEFdIY`) yayınlanmadı (YouTube'da "Gizli"); herkese açık yaparsanız `src/content/legacy/videos.json`'da `available: true` yapılıp yayına alınabilir.
- **Video #2** üçüncü taraf kanaldan (ФЕРМЕР.RU); kalsın mı?
- Video başlıkları YouTube'daki gerçek başlıklar (çoğu İngilizce); değiştirmek isterseniz metinleri siz verin.
- **Katalog** 2018 tarihli ve görüntü tabanlı; güncel PDF'iniz varsa iletin.
- 2018 tarihli **"Online Mağazamız Yayında"** yazısı yayında ve içindeki harici mağaza linki (`mezbahateknolojilerionlinesatis.com`) hâlâ geçerli mi? Yazı yayında mı kalsın?

## 7. Editoryal incelemeler (acil değil)

- `docs/editorial-review.md`: 39 uzun title, 20 BÜYÜK HARF ürün adı — onayladıklarınızı uygularım.
- `docs/featured-content-review.md`: featured seçimi.
- Ürün dokümanı/PDF: elinizde varsa iletin (`ProductDocument` hazır, şu an 0 kayıt).

## 8. Phase 12 öncesi/sonrası teknik öneriler (onayınızla)

CSP (nonce tabanlı); AVIF; parola-değiştirme UI'ı; admin "Sayfalar" arayüzü; analitik + herkese açık iletişim/teklif formu; S3 uyumlu depolama; Lighthouse CI; Sentry/uptime izleme; brute-force koruması (uygulama düzeyinde).
