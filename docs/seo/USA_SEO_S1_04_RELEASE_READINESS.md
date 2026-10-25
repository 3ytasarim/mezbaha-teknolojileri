# S1-04 — Redirect Guard Sertleştirme ve Production Yayın Hazırlığı

> **Tarih:** 2026-10-26 · **HEAD:** `7ebe436` (değişmedi) · **Durum:** kod hazır ve doğrulandı, **commit/push/deploy YAPILMADI.** Canlı DB'ye veri yazılmadı, migration çalıştırılmadı, PM2/Nginx/DNS/Search Console'a dokunulmadı.
> **Karar özeti:** Kod, deploy için teknik olarak hazır. Deploy için gereken tek şey sizin onayınız ve (SSH erişimi bende olmadığı için) sunucu tarafında §8 adımlarının sizce/sizin yönlendirmenizle uygulanması.

---

## 1. Redirect Guard güvenli mi? — Evet (kanıtlı)

Doğrulama iki katmanda zorunludur ve **sunucu tarafındadır** (`src/lib/seo/redirect-service.ts`, server action'lardan çağrılır; arayüz kontrolü yeterli sayılmaz):

| Engellenen durum | Kod | Kullanıcıya mesaj (Türkçe) |
|---|---|---|
| Canonical (sitemap'teki) URL'nin redirect kaynağı yapılması | `SOURCE_IS_CANONICAL` | "… adresi zaten canonical bir sayfaya ait (sitemap'te var). Redirect oluşturulamaz; aksi halde sayfanın kendisi 301'e dönüşür." |
| Canonical olmayan hedef (ör. `/urun/x` yerine `/product/x`) | `DEST_NOT_CANONICAL` | "Yeni adres canonical biçimde değil. "/product/x" adresini kullanın …" (doğru adres önerilir) |
| Yanlış dile yönlendirme | `LOCALE_MISMATCH` | "Eski adres "ru", yeni adres "en" dilinde. Farklı dile yönlendirme yapılamaz." |
| Zincir (hedef başka kuralın kaynağı / kaynağa işaret eden kural) | `CHAIN_OUT` / `CHAIN_IN` | "Bu yönlendirme zincir oluşturacağı için kaydedilemedi: …" |
| Döngü (A→B→A, A→B→C→A) | `LOOP` / `SELF` | "Bu yönlendirme döngü oluşturacağı için kaydedilemedi …" |
| Aynı kaynak için çakışan kural (aktif/pasif, sondaki `/` normalizasyonuyla) | `DUPLICATE_SOURCE` | "… adresi için zaten bir yönlendirme kaydı var …" |
| Pasif hatalı kuralın yeniden açılması | (tam denetim) | yukarıdaki mesajlardan biri; kayıt pasif kalır |
| Canonical listesi (sitemap) üretilemezse | `VERIFICATION_UNAVAILABLE` | "Canonical sayfa listesi doğrulanamadığı için güvenlik amacıyla kaydedilmedi …" (**fail-closed**) |

Tasarım notları:
- **Normalizasyon/lokalize segmentler:** karşılaştırmalar `resolvePublicPath`/`localizePath` (gerçek route tablosu) ve sondaki `/`, sorgu/hash ayrımıyla yapılır; canonical küme sitemap'ten (`sitemap()` — sitenin kendi canonical üreticisi) gelir.
- **Eşzamanlılık:** tüm okuma+doğrulama+yazma tek Postgres işleminde `pg_advisory_xact_lock` altında; iki yönetici "A→B" ve "B→C"yi aynı anda kaydetse biri reddedilir.
- **Geçerli legacy/WordPress kuralları engellenmez:** canlı tablodaki **540 aktif kuralın (363 sayfa + 177 asset) tamamı** gerçek tablo + gerçek sitemap ile "aynı değerle yeniden kaydedilse" **0 engelle** geçti (§4). Türkçe iç yollar kaynak olarak serbest; harici (https) hedef ve `/images`, `/uploads` asset kuralları serbest.
- **Pasif kuralı kapatmak her zaman serbest**; açarken tam denetim (13 Ekim'de 5 eski self-redirect denetimsiz açılıp canonical sayfaları gasp etmişti).

## 2. Admin panelindeki sessiz hata — düzeltildi

| Önce (S1-01 kodu) | Şimdi |
|---|---|
| "Aç" düğmesi `<form action=toggle>`; guard reddedince **hiçbir şey olmuyordu**, mesaj yoktu. | `ToggleRedirectButton` (istemci bileşeni, `useActionState`): reddedilirse satırın altında `role="alert"` ile **"Etkinleştirilemedi: <neden>"** gösterilir; düğme işlem sırasında devre dışı. Kayıt pasif kalır. |
| Oluştur/Düzenle'de hata sonrası React formu sıfırlıyor, girilen değerler kayboluyordu. | Sunucu girilen değerleri `state.values` ile döndürür; form `key` ile bu değerlerle yeniden kurulur — kullanıcı yazdıklarını kaybetmez. Hata kutusu daha belirgin (kenarlıklı, `role="alert"`). |
| Başarısız işlemde başarı mesajı yoktu ama ayrım da yoktu. | Başarı yalnız sunucu `ok` döndüğünde (create/update → listeye yönlendirme). Başarısızlıkta yönlendirme/başarı **yoktur**. |
| Silme: kayıt yoksa istisna. | `deleteMany` (başka yönetici zaten sildiyse hata fırlatmaz). |

> Not: arayüz akışı (login gerektirdiği için) tarayıcıda uçtan uca gezilmedi; sunucu mantığı gerçek veriyle kuru çalıştırıldı (§4) ve bileşenler derlendi/tip-kontrolü geçti. Yayın sonrası güvenli elle test §8'de (reddedilecek bir "Aç" denemesi).

## 3. Değişen dosyalar (tam liste)

**Çalışma zamanı (canlıya gidecek):**

| Dosya | Durum | Ne |
|---|---|---|
| `src/lib/seo/redirect-guard.ts` | yeni (134 satır) | saf kural denetimi: döngü, çakışma, zincir, dil, canonical; Türkçe mesajlar |
| `src/lib/seo/redirect-service.ts` | yeni (95) | kaydet/aç-kapat iş mantığı; DI'li depo; kilit altında doğrulama; fail-closed |
| `src/lib/seo/redirect-store.ts` | yeni (30) | Prisma + advisory lock uygulaması; sitemap'ten canonical küme (`server-only`) |
| `src/app/admin/(protected)/seo/redirectler/actions.ts` | değişti | servise bağlandı; form/toggle durumları; `deleteMany` |
| `src/app/admin/(protected)/seo/redirectler/redirect-form.tsx` | değişti | değer korunumu, belirgin hata |
| `src/app/admin/(protected)/seo/redirectler/page.tsx` | değişti | `ToggleRedirectButton` kullanımı |
| `src/app/admin/(protected)/seo/redirectler/toggle-redirect-button.tsx` | yeni (25) | hata gösteren Aç/Kapat |

**Canlıya etkisi olmayan (araç/test/doküman):** `package.json` (yalnız 3 script: `redirects:selftest`, `redirects:check`, `test:redirects`; bağımlılık değişmedi), `tests/redirects/*` (4 dosya), `prisma/migration/{check-redirects.ts, redirect-selftest.ts, s1-01-*.cjs}`, `prisma/migration/fix-redirect-destinations.cjs` (13 Ekim betiği artık bayraksız çalışmaz), `docs/seo/*`.

**Değişmeyenler:** `prisma/schema.prisma` (değişmedi → **migration yok**), `package-lock.json`, `src/proxy.ts`, `src/lib/redirects.ts`, `src/app/sitemap.ts`, tüm genel sayfalar. Çalışma ağacında başkasına ait değişiklik **yoktu**; mevcut tüm değişiklikler bu sprintlerindir.

## 4. Testler

| Çalıştırma | Sonuç |
|---|---|
| `npx tsc --noEmit` | **0 hata** |
| `npx eslint` (guard, servis, depo, admin klasörü, testler, betikler) | **0 hata, 0 uyarı** |
| `npm run test:redirects` (node:test, izole/sahte veri) | **54/54 geçti** (guard 22, servis 25 [eşzamanlılık dahil], CSV regresyon verisi 7) |
| `npm run redirects:selftest` | **15/15 geçti** |
| Salt-okunur canlı denetim `redirects:check --full` | **TÜM DENETİMLER GEÇTİ** — 363/363 redirect (tek hop, birebir `Location`, hedef 200 + self-canonical, dil uyumu), sitemap 820/820 (200, self-canonical, noindex yok, `lang`), hreflang 748/748, kural denetimi 363 temiz |
| Salt-okunur canlı `s1-01-verify --expect expected --full` | **TÜM TESTLER GEÇTİ** (G1–G4) |
| **Gerçek veri kuru çalıştırması** (gerçek Prisma deposu + gerçek sitemap; `create/update` etkisiz kılındı) | sitemap'ten 820 canonical çıkarıldı; **363 aktif sayfa kuralı ve 177 asset kuralı aynı değerle yeniden doğrulandı: 0 engel**; 7 pasif canonical-kaynak kural "Aç" denemesinde **7/7 engellendi** (`SOURCE_IS_CANONICAL`); `/contact-us` kaynaklı yeni kayıt, canonical olmayan hedef (`/urun/…`), zincir (`/bleeding-pan` hedefi), çakışan kaynak (`/bleeding-pan/`), yanlış dil: **hepsi doğru Türkçe mesajla engellendi**; geçerli yeni kural kabul edildi. Satır sayısı 553/553, tablo parmak izi `f0227403…f3ac` değişmedi. |

Test kapsamı (istenen senaryolar): geçerli 301 ✓ · canonical korunması ✓ · hatalı hedef ✓ · dil uyumu ✓ · döngü ✓ · zincir ✓ · pasif kuralın yeniden açılması ✓ · admin doğrulama mesajları ✓ · eşzamanlı kayıtlar ✓ (kilitli depo: yalnız biri başarılı; **negatif kontrol:** kilitsiz depoda aynı yarış zincir üretir → test kilidin yokluğunu yakalar) · eski WordPress yönlendirmeleri ✓ (166 değişmeyen kural + sentetik örnekler) · mevcut ürün/kategori URL'leri kaynak olarak korunur ✓.

## 5. Production DB'deki 204 düzeltme korunuyor mu? — Evet

Bu sprintte canlı DB'ye **veri yazılmadı** (yalnız SELECT ve kuru çalıştırmadaki advisory lock; `create/update` etkisiz). Redirect tablosu parmak izi S1-01 Faz B sonrası değeriyle birebir aynı (`f0227403c95fae5f7126db20b9f93dcf3f8626927e0890f80c586275d8b7f3ac`, 553 satır, 540 aktif, 13 pasif); blog çevirisi düzeltmesi korunuyor. Kod yayına çıksa da veriyi değiştiren hiçbir şey çalışmaz: **migration yok, şema değişikliği yok, başlangıç/seed betiği yok;** guard yalnız admin panelinde kullanıcı kaydettiğinde devreye girer.

## 6. Build doğrulaması — yapıldı (izole)

- **Yöntem:** projenin kopyası `<proje-dışı-izole-dizin>\_build-s1-04\app` (repo dışı) — `.next`, `node_modules`, `public` gerçek kopyalar. Çalışan dev sunucusuna ve paylaşılan `.next` klasörüne **dokunulmadı.** İlk denemede `node_modules` junction'ı Turbopack tarafından reddedildi ("Symlink … points out of the filesystem root"), ikinci denemede kopyalama hatam (`/XD public` ile `src/components/public` de dışarıda kalmıştı) "Module not found" verdi; ikisi de **kod hatası değil, izolasyon kurulum hatasıydı**; düzeltilince build geçti.
- **Sonuç:** `next build` (Next 16.3.5, Turbopack) **EXIT=0**, tüm rotalar (`/admin/seo/redirectler`, `/yeni`, `/[id]` dahil) derlendi. Tek uyarı eski ve ilgisiz (`src/lib/seo/image-meta.ts` dinamik dosya sistemi izleme).
- Build sonrası kopya silinir (içinde `.env` kopyası vardı) — bkz. §11.

## 7. Yayın sırasında riskler

| Risk | Olasılık | Etki | Önlem |
|---|---|---|---|
| Server Action kimlikleri her build'de değişir: açık admin sekmeleri "action bulunamadı" hatası verir | Kesin | Düşük | Yayın sonrası admin sekmelerini yenileyin; kamuya açık siteyi etkilemez |
| `fork` modda tek PM2 süreci: `startOrReload` birkaç saniye kesinti | Orta | Düşük | Düşük trafikli saat; `kill_timeout` 10 sn; smoke test |
| Sunucuda `npm run build` kaynak sıkışıklığı (RAM/CPU) veya yerinde build sırasında çalışan sürecin `.next`'ini bozması | Orta | Orta | Yeni release dizininde build, sonra `current` sembolik bağını çevirmek (§8); VPS RAM'i `free -m` ile önceden kontrol |
| `NEXT_PUBLIC_SITE_URL` build zamanı gömülür; yanlış/eksik env canonical'ları bozar | Düşük | **Yüksek** | Build öncesi `.env.production` doğrula; build sonrası `curl` ile canonical/sitemap kontrolü (smoke) |
| Admin kaydetme `sitemap()`'i çağırır (≈6 DB sorgusu) → kayıt 1–2 sn yavaşlar; DB yavaşsa fail-closed reddeder | Düşük | Düşük | Kabul edilebilir; mesaj kullanıcıya "tekrar deneyin" der |
| Advisory lock anahtarı (`mezbaha-redirect-admin`) S1-01 betiklerininkinden (`s1-01-redirect-fix`) ayrı | — | Düşük | Betikler artık çalıştırılmayacak; çalıştırılırsa admin panelinden eşzamanlı yazma olmamalı |
| Guard canlı veriyle uyumsuz bir meşru kuralı engeller | Çok düşük | Düşük | 540/540 mevcut kural 0 engelle geçti; engellenirse yalnız yeni kayıt/aktivasyon etkilenir, yayınlanmış yönlendirmeler çalışmaya devam eder |
| Test klasörü (`tests/`) `tsconfig` kapsamında: `next build` tip kontrolüne girer | Gerçekleşti | Yok | Build geçti (tip hatası yok) |

## 8. Production release planı

> Hiçbiri çalıştırılmadı. Her adım onayınıza bağlıdır. Sunucu yolları repo belgelerine göre (`/srv/mezbaha/current`, PM2 `mezbaha-teknolojileri`); gerçek düzen bende doğrulanamadı (SSH yok).

**A. Yerelde (yayın öncesi)**
1. `git rev-parse --short HEAD` = `7ebe436`; `git status` — yalnız §3'teki dosyalar (başka sohbet/geliştirici değişikliği yoksa). Varsa **ekleme**; yalnız bu listeyi açıkça `git add <dosya>` ile alın.
2. Commit (yalnız runtime + test + araç dosyaları; mesaj örneği: `feat: redirect admin dogrulamasi (canonical, zincir, dongu, dil, cakisma) ve sessiz hata duzeltmesi`; **AI imzası yok**). Push yalnız onayınızdan sonra.
3. Son kontrol: `npx tsc --noEmit && npx eslint … && npm run test:redirects && npm run redirects:selftest`.

**B. Sunucuda (önce yedek)**
4. Mevcut release yedeği: `readlink -f /srv/mezbaha/current` ve `cp -a`/`tar` ile `current` dizinini `releases/<önceki>` olarak koruyun (yoksa sembolik bağ zaten önceki sürümdür); `.env.production`'ı yedekleyin (içeriği paylaşmayın).
5. Yeni release: `git clone`/`git pull` → **yeni dizin** `releases/<yeni>`; `.env.production` kopyala (`chmod 600`); `npm ci`; `npm run build` (migration/seed **çalıştırılmaz**; `db:*` komutları yok).
6. Build başarılıysa: `ln -sfn releases/<yeni> /srv/mezbaha/current`; `pm2 startOrReload deploy/ecosystem.config.cjs --update-env`; `pm2 save`. **PM2 yeniden başlatma gereklidir** (Node süreci eski kodu bellekte tutar; yeni server action'lar/modüller yalnız yeni süreçte yüklenir).
7. nginx değişikliği **gerekmez**.

**C. Canlı doğrulama (yayın sonrası, yalnız GET/HEAD)**
8. `bash deploy/smoke-test.sh` (4 giriş noktası, canonical, sitemap vb.).
9. `npm run redirects:check -- --full` (beklenen: 0 hata) ve `node prisma/migration/s1-01-verify.cjs --expect expected --full` (beklenen: TÜM TESTLER GEÇTİ). Redirect önbelleği 60 sn; yayın PM2 yeniden başlatmasında zaten sıfırlanır.
10. **Admin elle güvenli test (veri yazmaz):** `/admin/seo/redirectler?durum=pasif` listesinde `/contact-us` satırında **"Aç"**a basın → "Etkinleştirilemedi: … zaten canonical bir sayfaya ait …" görmelisiniz ve satır pasif kalmalı. "+ Yeni Yönlendirme"de eski adres `/products`, yeni adres `/projects` yazıp Kaydet → hata kutusu, girilen değerler yerinde. (Bu denemeler **reddedilir**, DB'ye yazılmaz.)
11. Gözlem: ilk 30 dk `pm2 logs`/nginx `error.log` (5xx, `Failed to find Server Action`), `pm2 status` (restart sayısı artmıyor).

**D. Gözlem kriterleri (24–48 saat)**
- 5xx oranı ve PM2 yeniden başlatma sayısı sabit; sitemap 820 URL ve `redirects:check --full` her gün 0 hata; Search Console kapsam raporu (yalnız okuma) yeni "Yönlendirmeli sayfa/Canonical" hatası artışı göstermiyor; admin kayıt hatalarının tamamı beklenen Türkçe doğrulama mesajları.

**E. Geri dönüş**
- Kod rollback'i veriyi etkilemez (tabloya yazan bir deploy adımı yok): `ln -sfn releases/<önceki> /srv/mezbaha/current && pm2 startOrReload deploy/ecosystem.config.cjs --update-env`; ardından §C 8–9. Git tarafında `git revert <commit>` (push onayıyla).
- Canlı DB geri alma gerekmez. (Olası bir yan veri değişikliği olursa S1-01/S1-02 yedekleri: `_backups/redirect-s1-01-phaseB-pre-…`, `_backups/blog-canonical-s1-02-…`.)

## 9. SSL sertifikası — yenileme mekanizması **doğrulanamadı**

**Sunucuya SSH erişimim yok** (S1-03'te anahtarla oturum açılamadı; başka kullanıcı/parola denemedim). Bu yüzden zamanlayıcı/araç **sunucuda incelenemedi**; aşağıdakiler dışarıdan kanıtlanabilenlerdir:

| Gözlem | Değer |
|---|---|
| Sertifika | Let's Encrypt **YE2** (ECDSA ara sertifika); `2026-09-28 17:42 → 2026-12-27 17:42 UTC`; **63 gün kaldı**; SAN: apex + www; TLS 1.3 + h2 |
| Yenileme penceresi | certbot varsayılanı bitişe 30 gün kala → ≈ **2026-11-27** |
| Port 80 | `http://…/.well-known/acme-challenge/*` → 301 `https://www…` (ACME yolu için ayrıcalıklı `location` yok); https tarafında 404 (uygulama) |
| Repo belgeleri | `deploy/nginx/snippets/mezbaha-ssl.conf` varsayılan olarak **Cloudflare Origin CA** (Seçenek A) önerir; canlı sertifika ise Let's Encrypt → **canlı sunucu yapılandırması repodaki şablondan farklı**; hangi araç (certbot/acme.sh/başka) ve hangi doğrulama (HTTP-01/DNS-01) kullanıldığı repoda yazılı değil |

Sonuç: "Otomatik yenileme aktif mi?" sorusunun cevabı **bilinmiyor**. Port 80'de ACME yolu için özel kural olmaması tek başına sorun değildir (certbot `--nginx` eklentisi geçici kural ekler; DNS-01 hiç HTTP gerektirmez), ancak `--webroot` ile alınmışsa ve nginx'te muafiyet yoksa yenileme **başarısız olabilir.**

**Sunucuda çalıştırılacak SALT-OKUNUR komutlar (certbot dry-run YOK):**

```bash
systemctl list-timers --all | grep -i -E 'certbot|acme|letsencrypt'      # zamanlayıcı var mı
crontab -l 2>/dev/null; sudo crontab -l 2>/dev/null; ls /etc/cron.d /etc/cron.daily | grep -i -E 'certbot|acme'
command -v certbot acme.sh lego caddy 2>/dev/null; ls ~/.acme.sh 2>/dev/null | head
sudo certbot certificates 2>/dev/null                                      # sertifika adı, bitiş, yol (salt-okunur)
sudo ls /etc/letsencrypt/renewal/ && sudo grep -H -E 'authenticator|installer|pref_challs|webroot' /etc/letsencrypt/renewal/*.conf
sudo journalctl -u certbot --since '60 days ago' --no-pager 2>/dev/null | tail -40
sudo nginx -T 2>/dev/null | grep -n -E 'ssl_certificate|acme-challenge'
```
Yorum rehberi: zamanlayıcı **ve** `renewal/*.conf` mevcutsa ve `authenticator`/doğrulama yöntemi nginx yapılandırmasıyla uyumluysa yenileme beklenir. Takvim önerisi: **2026-11-20** tarihine hatırlatıcı koyun; ≈ 2026-11-27'den sonra `notAfter` ileri kaymadıysa müdahale edin. Dry-run/yenileme **bu sprintte çalıştırılmadı** (yasak).

## 10. Yayına hazır mıyız?

**Kod tarafında evet:** tip/lint/54+15 test/izole build/gerçek-veri kuru çalıştırması geçti; şema/bağımlılık/migration değişikliği yok; canlı veri korunuyor; geri dönüş basit ve veriden bağımsız.
**Yayın için gerekenler:** (1) sizin commit/push/deploy onayınız; (2) sunucudaki gerçek release düzeninin teyidi (SSH bende yok; §8 B adımları repo belgelerine dayanır); (3) tercihen düşük trafikli saat. SSL yenileme doğrulaması **yayından bağımsızdır** ama 2026-11-27 öncesi yapılmalıdır.

## 11. Yapılmayanlar ve temizlik

Commit, push, deploy, canlı DB yazımı, migration, Nginx, PM2 restart, DNS, Search Console gönderimi, certbot dry-run/yenileme, Türkçe iç URL değişikliği, yeni içerik sprinti: **yapılmadı.** İzole build klasörü (`<proje-dışı-izole-dizin>\_build-s1-04`, `.env` kopyası içerir) işlem sonunda silinir. Test ve kuru çalıştırma betikleri repoda (`tests/redirects`, `prisma/migration`) ya da oturum geçici dizinindedir (repo dışı).
