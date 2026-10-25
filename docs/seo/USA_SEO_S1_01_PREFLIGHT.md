# S1-01 — Kritik Redirect Regresyonu Kurtarma: Ön Kontrol (Preflight) Raporu

> **Durum:** HAZIRLIK / DRY-RUN. Canlı veritabanında, redirect kurallarında, sunucuda hiçbir değişiklik yapılmadı; commit/push/deploy yok. Kod hazırlığı **çalışma ağacında, commit edilmemiş** durumda (bkz. §12).
> **Tarih:** 2026-10-25 · **Repo HEAD:** `7ebe436` (değişmedi, commit yok) · **Kapsam:** yalnız `docs/seo/` altında 4 rapor dosyası.
> **Onay bekleniyor:** Aşağıdaki §10 adımları, kullanıcının açık yazılı onayı olmadan uygulanmaz.

İlgili dosyalar: [`USA_SEO_S1_01_REDIRECT_CHANGES.csv`](USA_SEO_S1_01_REDIRECT_CHANGES.csv) (370 kayıt, uygulama girdisi) · [`USA_SEO_S1_01_TEST_PLAN.md`](USA_SEO_S1_01_TEST_PLAN.md) · [`USA_SEO_S1_01_ROLLBACK.md`](USA_SEO_S1_01_ROLLBACK.md)

---

## 0. Yönetici özeti

| Konu | Sonuç |
|---|---|
| Kök neden | 13 Ekim 2026 migration'ı (`prisma/migration/fix-redirect-destinations.cjs`, commit `bca80ce`) redirect hedeflerini **sabit Türkçe iç segmentlere** (`/urun/…`, `/urunler/…`) çevirdi. Sitenin gerçek canonical URL'leri ise dile göre yerelleşmiş segmentler kullanıyor (`/product/…`, `/products`, `/ru/produkt/…`). |
| 7 URL'nin 301 vermesi | `Redirect` tablosunda **kaynağı güncel EN canonical URL olan 7 aktif satır** var. `src/proxy.ts` `findRedirect()` çağrısını dil çözümlemesinden **önce** yaptığı için bu 7 sayfa hiç render edilmeden 301 veriyor; hedef sayfanın canonical'ı yine kaynağa dönüyor → **redirect ↔ canonical döngüsü**. |
| Toplam kural | 553 satır; 547 aktif; **370 sayfa kuralı** + 177 varlık (asset) kuralı. |
| Sorunlu kayıt | **204** (7 canonical gasp/döngü + 197 canonical olmayan 200 hedef). EN 144 / RU 60. |
| Değiştirilecek kayıt | **204** satır (Faz A: 7, Faz B: 197). Silinecek/yeniden oluşturulacak satır **yok**; yeni satır eklenmiyor. |
| Dokunulmayacak | 166 sayfa kuralı (TR 101, EN 64, RU 1) + 177 asset kuralı + 6 pasif satır = **349 satır** aynen kalır. |
| Dry-run | Faz A: 7 değişecek, uyumsuzluk 0, zincir 0, döngü 0, sitemap-kaynak çakışması 0. Faz B (Faz A sonrası simülasyon): 197 değişecek, uyumsuzluk 0, zincir/döngü 0. Idempotent yeniden çalıştırma: hepsi "zaten uygulanmış". Negatif test: parmak izi/uyumsuzlukta durur. |
| Yedek / geri alma | Tam tablo JSON + `restore.sql` (orijinal `updatedAt` korunur) + SHA-256; ayrıca korumalı geri alma betiği (bkz. ROLLBACK raporu). Geri alma provası canlı tablo üzerinde salt-okunur yapıldı: 204/204 geri alınabilir, parmak izi orijinale eşit. |
| Sprint 0 düzeltmesi | Sprint 0 raporu "gasp edilen 7 satırın 6'sı daha önce pasif self-redirect idi" diyordu. **Doğrusu: 5'i.** `/products` ve `/products/cattle-slaughterhouse` 13 Ekim'de **benim oluşturduğum yeni satırlardır**. (Sprint 0 dosyalarına dokunulmadı; düzeltme yalnız burada.) |

---

## 1. Yöntem ve kanıt kaynakları

Yalnız okuma: veritabanında `SELECT`, canlı sitede `GET` (redirect takip edilmeden, `manual`). Hiçbir INSERT/UPDATE/DELETE/DDL, test yazısı, deploy, PM2/Nginx, commit/push, Search Console gönderimi yapılmadı.

Kod kanıtı:

| Dosya | Ne kanıtlıyor |
|---|---|
| `src/proxy.ts` | `findRedirect()` (tam yol eşleşmesi, 60 sn bellek önbelleği) dil çözümleme/rewrite'tan **önce** çalışır. |
| `src/lib/redirects.ts` | Redirect araması; yalnız `active=true` satırlar. |
| `src/lib/i18n/routes.ts` | `SEGMENTS` (yerelleşmiş URL segmentleri), `localizePath`, `resolvePublicPath`. |
| `src/lib/seo/metadata.ts:57` | Canonical `localizePath(locale, internalPath)` ile üretilir. |
| `src/app/sitemap.ts:25` | Sitemap aynı fonksiyonla üretilir → sitemap = canonical. |
| `src/components/i18n/link.tsx` | Dahili linkler yerelleşir. |
| `prisma/migration/fix-redirect-destinations.cjs` + `-data.json` | Regresyonun kaynağı (173 satır yeniden yazıldı, 104 `/en/<legacy>` satırı + 3 sonraki satır eklendi, 5 self-redirect yeniden etkinleştirildi). |

Canlı doğrulama: 553 satırın tamamı için kaynak ve hedef URL'ler HTTP ile sondalandı (durum kodu, `Location`, `<link rel="canonical">`, `<html lang>`, hreflang, `<title>`), sitemap (~820 URL) ile çapraz kontrol edildi.

---

## 2. (1) 7 URL için kesin kök neden

Sitenin **güncel, indekslenebilir EN canonical** adresleri aşağıdadır. Hepsi sitemap'te var, dahili eşdeğerleri 200 ve canonical'ı bu adresi gösteriyor, `lang="en"`, hreflang `en` + `x-default` kendisini gösteriyor. Ancak hepsi şu an **301** veriyor:

| # | Güncel canonical (EN) | Şu anki davranış | Neden | Satır (id) | Satırın geçmişi |
|---|---|---|---|---|---|
| 1 | `/catalogs` | 301 → `/kataloglar` | `Redirect` kaynağı = canonical, hedef iç segment | `cmui8e76w00448op6fc19clef` | 26 Eyl'de oluşturulmuş **pasif self-redirect**; 13 Ekim'de hedef değiştirilip **aktifleştirildi** |
| 2 | `/contact-us` | 301 → `/iletisim` | aynı | `cmui8e74j00438op6lxnvyg68` | aynı |
| 3 | `/corporate` | 301 → `/hakkimizda` | aynı | `cmui8e72800428op6td1j5hfb` | aynı |
| 4 | `/projects` | 301 → `/projeler` | aynı | `cmui8e7dw00478op6me9yfgey` | aynı |
| 5 | `/references` | 301 → `/referanslar` | aynı | `cmui8e7g900488op6zxkwh8xu` | aynı |
| 6 | `/products` | 301 → `/urunler` | aynı | `cmv5x7woh002u0kp616tvhrvc` | **13 Ekim'de yeni oluşturulan** satır |
| 7 | `/products/cattle-slaughterhouse` | 301 → `/urunler/cattle-slaughterhouse` | aynı | `cmv6y47nh0001oop6x2rv0b2m` | **13 Ekim'de yeni oluşturulan** satır |

**Mekanizma (zincirleme):**
1. İstek `/contact-us` → `proxy.ts` önce `findRedirect("/contact-us")` çağırır → aktif satır bulunur → **301 `/iletisim`** döner (sayfa hiç render edilmez).
2. `/iletisim` (iç Türkçe yol) 200 verir **ama** `localizePath("en", "/iletisim")` ile canonical'ı `/contact-us`'u gösterir.
3. Sonuç: URL A → 301 → URL B, B'nin canonical'ı A. Google için çelişkili sinyal; A (asıl canonical) indeksten düşme riski taşır, sitemap'teki 7 URL yönlendirme veriyor.

**Neden 13 Ekim'de ortaya çıktı:** migration, "eski URL'yi iç yola yönlendir" varsayımıyla çalıştı; doğrulama seti de aynı (yanlış) varsayımla kurulduğu için hata yakalanmadı. Hedeflerin canonical eşleşmesi test edilmedi.

---

## 3. (2) 370 aktif sayfa kuralının sınıflandırması ve 204 sorunlu kaydın değerlendirmesi

Sınıflar (öncelik: HIJACK > LOOP_RISK > CHAIN > BAD_TARGET > NON_CANONICAL_200 > OK):

| Sınıf | Tanım | TR | EN | RU | Toplam |
|---|---|---|---|---|---|
| **OK / doğru** | Tek hop 301, hedef 200 + self-canonical, doğru dil | 101 | 64 | 1 | **166** |
| **HIJACK + LOOP_RISK** (güncel canonical'ı gasp eden) | Kaynak = canlı canonical/sitemap URL'si; redirect↔canonical döngüsü | 0 | 7 | 0 | **7** |
| **NON_CANONICAL_200 hedef** | Hedef 200 ama canonical başka adres (iç Türkçe segment dublikatı) | 0 | 137 | 60 | **197** |
| CHAIN (aktif zincir) | Hedef başka bir aktif kaynak | — | — | — | 0 (19 satırın hedefi şu an 301 olan canonical'dır → Faz A sonrası zincir kalmaz; bkz. aşağı) |
| BAD_TARGET (404/5xx hedef) | — | — | — | — | 0 |
| Yanlış dil / dil uyumsuzluğu | — | — | — | — | 0 |
| Döngü (kaynak = hedef, aktif) | — | — | — | — | 0 (7 gasp satırı yukarıda sayıldı) |
| **Toplam** | | **101** | **208** | **61** | **370** |

**204 sorunlu kayıt = 7 + 197.** Hepsi 13 Ekim'de oluşturuldu/değiştirildi (7 gasp satırının 5'i eski satır, 2'si yeni; 197'nin 72'si 13 Ekim'de **oluşturulan** yeni `/en/<legacy>` vb. satırlar, 125'i 13 Ekim'de **güncellenen** eski satırlar). 13 Ekim'e dokunulmamış hiçbir satır sorunlu değil.

### Dil bazında

| | Gasp (Faz A) | Hedef güncelleme (Faz B) | Değişmez | Toplam sayfa kuralı |
|---|---|---|---|---|
| **EN** | 7 | 137 | 64 | 208 |
| **RU** | 0 | 60 | 1 | 61 |
| **TR** | 0 | 0 | 101 | 101 |
| DE/FR/AR | kural yok | kural yok | — | — (sayfalar dokunulmadan 200 + self-canonical; test G4) |

### Faz B bağımlılığı (19 satır)

19 satır, hedefi 7 gasp edilmiş canonical'dan biri olan satırlardır (ör. eski bir URL → `/urunler` iç yolu; doğru hedef `/products`, ama `/products` şu an 301 veriyor). Bu satırların kanonik hedefi **Faz A bitmeden** 200 vermediği için Faz B, Faz A sonrasına bırakıldı; Faz A sonrası bu hedefler 200 + self-canonical olur (iç eşdeğerin canonical'ı, hreflang'ı, sitemap üyeliği ve aynı mekanizmayla çalışan `/videos`, `/blog`, `/services`, `/get-quote`, `/products/sheep-slaughterhouse`, `/product/slaughterhouse-hook` kontrol sayfalarından doğrulandı).

---

## 4. (3) Değiştirilecek kayıt sayısı

| Faz | İşlem | EN | RU | Toplam |
|---|---|---|---|---|
| A | `RESTORE_INACTIVE` — eski pasif self-redirect haline döndür (hedef = kaynak, `active=false`) | 5 | 0 | 5 |
| A | `DEACTIVATE` — 13 Ekim'de eklenen satırı pasifleştir (hedef aynı kalır) | 2 | 0 | 2 |
| B | `UPDATE_TARGET` — hedefi canonical adrese çevir | 137 | 60 | 197 |
| | **Toplam değişecek** | **144** | **60** | **204** |
| | Değişmeyecek (NO_CHANGE) | 64 | 1 (+TR 101) | 166 |

Not: hiçbir satır **silinmiyor**, hiçbir satır eklenmiyor. Faz A'nın yan etkisi yok: 5 satır orijinal (pasif self-redirect) durumuna dönüyor, 2 satır pasifleşiyor.

---

## 5. (4) Eski URL → yeni (kanonik) URL eşleme tablosu

Tam liste (204 satır, id'siyle): [`USA_SEO_S1_01_REDIRECT_CHANGES.csv`](USA_SEO_S1_01_REDIRECT_CHANGES.csv). Bu bölüm kalıp bazlı özettir.

### 5.1 Faz A — 7 gasp edilen canonical (redirect kaldırılır, doğrudan 200)

| URL | Şimdi | Sonra |
|---|---|---|
| `/catalogs` | 301 → `/kataloglar` | **200**, self-canonical |
| `/contact-us` | 301 → `/iletisim` | **200**, self-canonical |
| `/corporate` | 301 → `/hakkimizda` | **200**, self-canonical |
| `/projects` | 301 → `/projeler` | **200**, self-canonical |
| `/references` | 301 → `/referanslar` | **200**, self-canonical |
| `/products` | 301 → `/urunler` | **200**, self-canonical |
| `/products/cattle-slaughterhouse` | 301 → `/urunler/cattle-slaughterhouse` | **200**, self-canonical |

> Not: `/urunler`, `/iletisim` vb. iç Türkçe yollar 200 vermeye devam eder (canonical'ı EN URL'yi gösterir). Bunları 301'e çevirmek **bu sprintin kapsamı değil** (kod/proxy değişikliği gerektirir; ayrıca raporlanır, bkz. §9/§11).

### 5.2 Faz B — hedefi düzeltilen 197 eski URL (örnek kalıplar)

| Dil | Kalıp (şu anki hedef → önerilen hedef) | Adet | Örnek |
|---|---|---|---|
| EN | `/urun/<slug>` → `/product/<slug>` | 108 | `/bleeding-pan` : `/urun/bleeding-pan` → **`/product/bleeding-pan`** |
| EN | `/urunler[/…]` → `/products[/…]` | 10 | |
| EN | `/projeler…` → `/projects…` | 5 | |
| EN | `/hakkimizda…` → `/corporate…` | 5 | |
| EN | `/kataloglar/…` → `/catalogs/…` | 5 | `/2018-slaughterhouse-catalog` : `/kataloglar/…` → **`/catalogs/…`** |
| EN | `/videolar…` → `/videos…` | 2 | |
| EN | `/iletisim` → `/contact-us` | 1 | |
| EN | `/referanslar` → `/references` | 1 | |
| RU | `/ru/urun/<slug>` → `/ru/produkt/<slug>` | 50 | |
| RU | `/ru/urunler…` → `/ru/produkty…` | 4 | |
| RU | `/ru/hakkimizda…` → `/ru/kompaniya…` | 2 | |
| RU | `/ru/kataloglar…` → `/ru/katalogi…` | 1 | |
| RU | `/ru/projeler…` → `/ru/proekty…` | 1 | |
| RU | `/ru/referanslar…` → `/ru/referencii…` | 1 | |
| RU | `/ru/videolar…` → `/ru/video…` | 1 | |
| | **Toplam** | **197** | |

Her önerilen hedef için doğrulandı: canlıda 200, `<link rel="canonical">` kendisi, `lang` yol diliyle uyumlu, hreflang kendisini gösteriyor, sitemap üyesi, mevcut hedefle aynı `<title>` (aynı sayfa içeriği). 19 bağımlı satır için doğrulama Faz A sonrası canlıda yapılacak (bkz. §3).

---

## 6. (5) Etkilenmeyen kuralların etkilenmediğinin doğrulanması

- **Kapsam kilidi:** uygulama betiği yalnız CSV'deki `action != NO_CHANGE` satırlarını `id + sourcePath + destinationPath + active` ile eşleştirerek günceller; her `updateMany` tam 1 satır etkilemezse transaction geri alınır.
- **İşlem içi kontrol:** transaction sonunda (a) toplam satır sayısı aynı, (b) **dokunulmaması gereken 349 satırın** parmak izi (sha256) önce/sonra eşit değilse transaction iptal edilir.
- **Canlı davranış testi (HTTP):**
  - 166 `NO_CHANGE` kuralı: tek hop 301, `Location` birebir aynı, hedef 200 + self-canonical → test G3.
  - TR (101) + RU (1) değişmeyen kurallar: mevcut `Location` birebir aynı → test G4.
  - DE/FR/AR ve TR/RU sitemap örneklemi (G4, 116 URL): doğrudan 200 + self-canonical → test G4.
  - 177 asset kuralı (`/images`, `/uploads`): CSV'de yok, betik bunlara dokunmaz; DB seviyesinde dokunulmayan-satır parmak izi ile korunur.
- **Ön sonuç (bugünkü canlı durum, `--expect current`):** TÜM TESTLER GEÇTİ → anlık görüntü gerçekle birebir uyumlu (G1: 7 URL 301 doğrulandı; G2: 129; G3: 363 eski URL tek hop 301 ve `Location` birebir, 166 hedef 200/self-canonical; G4: TR/RU 102 + diğer diller 116).

---

## 7. (6) Dry-run sonuçları (canlı DB'ye yazma YOK)

Komutlar (proje kökünden): `node prisma/migration/s1-01-redirect-recovery.cjs --phase A` / `--phase B --simulate-after-A` / `--simulate-applied`. Betik varsayılan olarak dry-run'dır; yazma için `--apply --confirm=S1-01-APPROVED` birlikte gerekir.

| Kontrol | Sonuç |
|---|---|
| Faz A dry-run | planlanan 7 · değişecek 7 · zaten uygulanmış 0 · uyumsuzluk 0 · zincir 0 · döngü 0 · sitemap-kaynağı 0 · tablo parmak izi eşleşti · build parmak izi eşleşti |
| Faz B (Faz A bellekte uygulanmış varsayımıyla) | planlanan 197 · değişecek 197 · uyumsuzluk 0 · zincir 0 · döngü 0 · sitemap-kaynağı 0 · planlanan hedeflerin sitemap dışı olanı 0 |
| Tam uygulanmış simülasyon (`--simulate-applied`) | 204 satır uygulanmış kabul edilince tablo grafiği: zincir 0, döngü 0, canonical gasp 0 |
| Idempotency (yeniden çalıştırma) | tüm 204 satır "alreadyApplied", yeni değişiklik 0 |
| Negatif test | parmak izi/mevcut değer uyuşmazlığında betik **durur** (çıkış kodu 1), hiçbir şey yazmaz |
| Canlı testler (öncesi) | `--expect current` → hepsi geçti · `--expect expected` → **270 başarısız** (beklenen: düzeltme öncesi hedef davranışı sağlanmıyor; G1: 7 URL 301; G2: 7 sitemap URL'si redirect; G3: 197 `Location` uyuşmazlığı + 19 hedef hâlâ 301) |
| Geri alma provası (salt-okunur) | 204/204 geri alınabilir; geri alma sonrası parmak izi orijinal yedekle eşit; yedek SHA-256 doğrulandı |

Kayıtlı koruma değerleri: tablo parmak izi `03b484d9dc1c907ed5f9c5c5926828adc31dce030f0cdc86f3588ebb09e5e706` (553 satır), canlı build parmak izi `c22b338b7c66480b6d6813f257b0d20e4b6fd2f8939d27fd8a290e726202b3b4`.

---

## 8. (7) Geri alma yöntemi (özet)

Ayrıntı: [`USA_SEO_S1_01_ROLLBACK.md`](USA_SEO_S1_01_ROLLBACK.md).
1. Uygulamadan önce otomatik yedek: tam `Redirect` tablosu (`redirect-table-full.json`), `restore.sql` (orijinal `updatedAt` korunur), `backup.sha256`.
2. Geri alma betiği (`prisma/migration/s1-01-redirect-rollback.cjs`): varsayılan dry-run; yalnız satır hâlâ bu migration'ın yazdığı değerdeyse geri alır (sonradan yapılan başka değişiklikleri ezmez); transaction + advisory lock.
3. Alternatif: `restore.sql` doğrudan SQL ile.
4. Geri alma sonrası ≥70 sn bekle, test paketini `--expect current` ile çalıştır.

---

## 9. (9) Olası SEO kayıp riskleri

| Risk | Olasılık | Etki | Azaltma |
|---|---|---|---|
| Faz A sonrası 7 sayfa 200 verince, Google'ın önbelleğindeki "redirect" durumu birkaç gün sürer | Orta | Düşük | Sitemap'te zaten var; Search Console URL denetimi (ayrı onayla, bu sprintte yapılmaz) |
| Eski URL hedeflerinin değişmesi sırasında geçici 301 farklılığı (60 sn proxy önbelleği) | Düşük | Çok düşük | Tek transaction; ≥70 sn bekleme; hedeflerin hepsi zaten 200 |
| Hedef yanlış sayfaya gider (içerik uyuşmazlığı) | Çok düşük | Orta | Her hedef için canonical = hedef, `<title>` eşitliği, dil/hreflang doğrulandı; 19 bağımlı satır Faz A sonrası ayrıca doğrulanır |
| Bir eşzamanlı deploy/DB değişikliği tabloyu değiştirir | Düşük | Orta | Parmak izi + build parmak izi + advisory lock + `FOR UPDATE`; uyuşmazlıkta durur |
| Backlink/PageRank kaybı | Mevcut durumdan **daha düşük** | — | Şu an 7 canonical redirect döngüsünde; düzeltme PageRank'i toplar. Eski URL'ler tek hop 301 ile korunur |
| İç Türkçe yolların (`/urunler`…) 200 vermeye devam etmesi (dublikat) | Mevcut | Orta | Canonical'ları doğru; bu sprintte değişmez. Önerilen ayrı iş: iç yolları EN/RU'dan 301'e almak (kod değişikliği, ayrı onay) |

Aşırı durumda en kötü senaryo: 7 sayfa önceki (bozuk) davranışa döner → geri alma 1 komutla yapılır.

---

## 10. (10) Canlıya uygulama için gerekli adımlar (onay sonrası)

> Hiçbiri bu raporla çalıştırılmadı. Her adımdan önce kullanıcı onayı.

0. **Ön koşul:** Açık yazılı onay ("S1-01 Faz A'yı uygula" gibi). Aynı anda başka deploy/DB değişikliği olmadığını doğrula.
1. Proje kökünde: `node prisma/migration/s1-01-redirect-recovery.cjs --phase A` (dry-run) → tablo ve build parmak izleri eşleşmeli, uyumsuzluk 0.
2. **Faz A uygula:** `node prisma/migration/s1-01-redirect-recovery.cjs --phase A --apply --confirm=S1-01-APPROVED` (otomatik yedek `../_backups/redirect-s1-01-<zaman>/`).
3. ≥70 sn bekle → `node prisma/migration/s1-01-verify.cjs --expect expected` ile G1/G2'yi doğrula (7 URL → 200 + self-canonical). Başarısızsa **geri alma**.
4. Faz A sonrası tablo parmak izini kaydet (apply çıktısındaki `tableFingerprintAfter`); `--phase B --expect-fp=<bu parmak izi>` ile dry-run çalıştır (uyumsuzluk 0, zincir/döngü 0 olmalı).
5. **Faz B uygula:** `node prisma/migration/s1-01-redirect-recovery.cjs --phase B --expect-fp=<fp> --apply --confirm=S1-01-APPROVED`.
6. ≥70 sn bekle → tam test paketi: `node prisma/migration/s1-01-verify.cjs --expect expected --full` (tüm gruplar G1–G4 geçmeli).
7. 24–48 saat izle: sunucu logunda 404/301 oranları, Search Console kapsam raporu (okuma amaçlı).
8. Gerekirse geri alma (ROLLBACK raporu).
9. Commit/PR gerekmiyor (veritabanı verisi değişir, kod değil). Sitemap değişikliği **yok** (7 URL zaten sitemap'te).

---

## 11. Sınırlar ve bu sprintte yapılmayanlar

- Veritabanına, redirect kurallarına, sunucuya, Nginx/PM2'ye, Search Console'a dokunulmadı; commit/push/deploy yapılmadı. Kod değişiklikleri yalnız çalışma ağacında (§12).
- Sprint 0 raporları değiştirilmedi.
- Önerilen ama **onay bekleyen/ayrı iş** kalemleri: iç Türkçe yolların (`/urunler`, `/urun/…`, `/iletisim` …) EN/RU için proxy seviyesinde 301'e alınması; `fix-redirect-destinations.cjs` migration'ının yeniden çalıştırılamaz hale getirilmesi/silinmesi (yanlış varsayım içeriyor); redirect eklerken canonical doğrulayan bir doğrulama/CI kontrolü.

---


---

## 12. Kod hazırlığı (çalışma ağacında, commit edilmedi, deploy edilmedi)

Redirect düzeltmesi **veri** değişikliğidir (DB); aşağıdaki kod ise aynı hatanın tekrarını engelleyen kalıcı güvenlik katmanıdır. Hiçbiri deploy edilmedi; canlı davranışı değiştirmez.

| Dosya | Değişiklik |
|---|---|
| `src/lib/seo/redirect-guard.ts` (yeni) | Saf kural denetimi: kaynak canlı canonical (sitemap) mi, hedef canonical biçimde mi (`localizePath(resolvePublicPath())`), dil uyumu, self/döngü, zincir (giriş/çıkış). |
| `src/app/admin/(protected)/seo/redirectler/actions.ts` | Oluştur/güncelle/yeniden etkinleştir akışlarına guard eklendi: canonical bir adresi kaynak yapmak, canonical olmayan hedef, dil değiştiren yönlendirme ve zincir **kaydedilemez**. Pasif kayıtlar denetlenmez. (Yeniden etkinleştirme engellenirse sessizce uygulanmaz; arayüz değişikliği yapılmadı.) |
| `prisma/migration/redirect-selftest.ts` + `npm run redirects:selftest` (yeni) | Guard için 15 birim testi (ağ/DB yok). Sonuç: **15 geçti**. |
| `prisma/migration/check-redirects.ts` + `npm run redirects:check` (yeni) | Kalıcı, salt-okunur denetim: tüm aktif redirect'ler için kural + HTTP (tek hop, birebir `Location`, hedef 200 + self-canonical, dil uyumu) ve sitemap için (200, redirect yok, self-canonical, noindex yok, `lang`, **hreflang kümesi = sitemap alternates**). `--static`, `--full`, `--base`. Çıkış kodu 1 = hata. |
| `prisma/migration/s1-01-redirect-recovery.cjs` (yeni) | Uygulama betiği (dry-run varsayılan, Faz A/B, yedek, işlem içi korumalar, idempotent). |
| `prisma/migration/s1-01-redirect-rollback.cjs` (yeni) | Korumalı geri alma (dry-run varsayılan). |
| `prisma/migration/s1-01-verify.cjs` (yeni) | CSV güdümlü doğrulama paketi (G1–G4). |
| `prisma/migration/fix-redirect-destinations.cjs` | **Kullanımdan kaldırıldı**: açık bir bayrak (`--i-know-this-reintroduces-the-regression`) olmadan çalışmaz; 13 Ekim regresyonunu üreten betik kazara yeniden çalıştırılamaz. |
| `package.json` | `redirects:selftest`, `redirects:check` script'leri. |

**Bağımsız çapraz doğrulama (guard ↔ CSV):** guard'ın kendi başına hesapladığı canonical biçim, CSV'deki 197 `UPDATE_TARGET` önerisinin **197'siyle birebir aynı** (uyuşmazlık 0). Canlı tabloda guard **204** kuralı sorunlu (204 `DEST_NOT_CANONICAL`, bunların 7'si ayrıca `SOURCE_IS_CANONICAL`) ve **166** kuralı temiz buluyor; manuel sınıflandırmayla aynı sayılar. CSV uygulanmış varsayılan tabloda guard **0 sorun** buluyor (363 aktif kural).

### Canlıda (read-only) tam denetim — `npm run redirects:check -- --full`, 2026-10-25

| Denetim | Sonuç |
|---|---|
| 370 redirect: kayıtlı durum kodu / tek hop `Location` birebir / hedef doğrudan 200 / dil uyumu / döngü yok | **370/370 geçti** |
| 370 redirect: hedef self-canonical | 166 geçti, **204 hata** (düzeltilecek 204 kayıt; beklenen) |
| Kural denetimi (guard) | 166 temiz; 204 `DEST_NOT_CANONICAL`, 7 `SOURCE_IS_CANONICAL` (beklenen) |
| Sitemap (820 URL): doğrudan 200 | 813 geçti, **7 hata** (7 gasp edilen canonical; beklenen) |
| Sitemap: noindex yok / `<html lang>` yol diliyle uyumlu | **813/813** |
| Sitemap: sayfa hreflang kümesi = sitemap alternates | **741/741** (hreflang korunuyor) |
| Sitemap: self-canonical | 812 geçti, **1 hata — yeni bulgu (aşağıda)** |

### Yeni bulgu (redirect tablosu dışı): self-canonical olmayan 1 sitemap URL'si

`/tr/blog/buyukbas-hayvan-kesim-hatti-modern-mezbaha-sistemleri` sitemap'te ve 200 veriyor, ancak canonical'ı `/tr/blog/buyukbas-hayvan-kesim-hatti` adresini gösteriyor; **o adres 404** (redirect de yok). Neden: yazının TR çevirisinde elle girilmiş `BlogPostTranslation.canonicalUrl = "/blog/buyukbas-hayvan-kesim-hatti"` (yazı id: `cmuv5jfbs001s9a6qau7nq3eh`). Tabloda canonicalUrl'li 3 TR blog çevirisi var; diğer ikisi (`blog/buyukbas-kesim-hatti-konveyor-ray-sistemleri`, `blog/buyukbas-hayvan-deri-yuzme-makinesi`) 200 veren adreslerine karşılık geliyor ve denetimde hata üretmedi.
**Öneri (ayrı onay gerektirir, içerik değişikliği):** o çevirinin `canonicalUrl` alanını `NULL` yapmak (sayfa kendi slug'ına canonical verir). Bu sprintte uygulanmadı.

### Bu sprintte doğrulanamayan

Faz A sonrası 7 sayfanın canlıda 200 vermesi, **DB'ye yazmadan** uçtan uca ispatlanamaz (proxy redirect'i DB'den okur). Bunun yerine: (a) iç eşdeğer sayfaların 200 + canonical = hedef URL olduğu, (b) aynı mekanizmayla çalışan kontrol sayfalarının (`/videos`, `/services`, `/blog`, `/get-quote`, `/products/sheep-slaughterhouse`, `/product/slaughterhouse-hook`) doğrudan 200 verdiği, (c) 5 sayfanın 26 Eylül–13 Ekim arası pasif kural ile 200 servis edildiği doğrulandı. Gerçek kanıt, Faz A uygulandıktan sonraki `--expect expected` testidir; başarısızlıkta tek komutla geri alınır.

---

## 13. Faz A uygulama kaydı (2026-10-25, 18:21:52 UTC)

- Onay: kullanıcının yazılı "S1-01 — FAZ A CANLI UYGULAMA" onayı (yalnız 7 kayıt).
- Öncesi: HEAD `7ebe436`; tablo parmak izi `03b484d9…e5e706` (553 satır) ve build parmak izi eşleşti; dry-run 7 değişecek / uyumsuzluk 0.
- Yedek: `..\_backups\redirect-s1-01-phaseA-pre-2026-10-25\` (tam tablo JSON, `restore.sql`, `backup.sha256`; SHA-256 ve parmak izi canlıyla doğrulandı, `restore.sql` canlı şemada `EXPLAIN` ile READ ONLY doğrulandı) + betiğin kendi yedeği `redirect-s1-01-2026-10-25T18-21-51-172Z\`.
- Uygulama: tek transaction, advisory lock, `FOR UPDATE`, id+kaynak+mevcut-değer eşleşmeli `updateMany`; **7 satır** güncellendi. Tablo parmak izi sonrası: `b1ff10e08ea21d8d2f69c0b2037c79094a6611289254bfc7fdb2eb9c7d744631` (Faz B için `--expect-fp` değeri).
- Sonrası (yedekle satır satır fark): 553 satır, silinen 0, değişen **7** (planlanan id'ler), başka anomali 0. Aktif 540, pasif 13; aktif sayfa kuralı 363, aktif asset kuralı 177.
- Doğrulama (≥70 sn sonra): 7 URL doğrudan 200, `Location` yok, self-canonical, `lang=en`, hreflang (tr,en,ru,de,fr,ar,x-default); sitemap 820/820 doğrudan 200; G4 693 geçti. Kalan başarısızlıklar yalnız kapsam dışı: Faz B'nin 197 `Location` farkı ve blog canonical bulgusu.

---

## 14. Faz B uygulama kaydı (2026-10-25, 18:34:35 UTC)

- Onay: kullanıcının yazılı "FAZ B CANLI UYGULAMA ONAYI" mesajı (yalnız 197 kayıt).
- Öncesi: Faz A'nın 7 URL'si doğrudan HTTPS ile yeniden doğrulandı (hepsi 200, self-canonical, `lang=en`); HEAD `7ebe436`; tablo parmak izi `b1ff10e0…4631` eşleşti; 553 / aktif 540 / pasif 13; dry-run 197 değişecek, uyumsuzluk 0, zincir 0, döngü 0. Bağımsız guard 197 öneriyi de doğruladı (EN 137, RU 60; kaynak/hedef dili aynı; Faz B sonrası bellek simülasyonunda 0 sorun).
- Yedek (Faz A sonrası durum, repo dışı, yalnız sahibi erişebilir): `..\_backups\redirect-s1-01-phaseB-pre-2026-10-25\` (JSON + `restore.sql` 197 UPDATE + `backup.sha256`; SHA-256/parmak izi canlıyla doğrulandı; `restore.sql` READ ONLY `EXPLAIN` ile doğrulandı). Betiğin kendi yedeği: `redirect-s1-01-2026-10-25T18-34-25-057Z\`. Geri alma bu yedekle yalnız 197 Faz B satırını geri alır, Faz A'nın 7 satırına dokunmaz (prova: `wouldRestore: 197`, `alreadyOriginal: 7`).
- Uygulama: tek transaction, advisory lock, `FOR UPDATE`, id+kaynak+mevcut-değer eşleşmeli `updateMany`; **197 satır** güncellendi. Tablo parmak izi sonrası: `f0227403c95fae5f7126db20b9f93dcf3f8626927e0890f80c586275d8b7f3ac`.
- Sonrası: Faz B öncesi yedekle fark = tam 197 satır (EN 137, RU 60), her biri CSV'deki eski → yeni değerle birebir, yalnız `destinationPath` değişti; özgün (Faz A öncesi) yedekle fark = tam 204. 553 satır, silinen/eklenen 0; aktif 540, pasif 13; aktif sayfa kuralı 363, aktif asset kuralı 177. 166 `NO_CHANGE` kuralı ve 177 asset kuralı birebir aynı.
- Canlı kabul (≥70 sn sonra, `--full`): 363 redirect tek hop 301 + `Location` birebir, 363 hedef doğrudan 200 + self-canonical, zincir/döngü/404/dil uyumsuzluğu 0; kural denetimi 363/363 temiz; sitemap 820/820 doğrudan 200, `lang` 820/820, noindex yok 820/820, hreflang kümesi = sitemap 748/748; 177 asset redirect'i HTTP'de 177/177; 7 Faz A URL'si 200. Tek hata: bilinen TR blog canonical bulgusu (§12; yeni değil, Faz B ile ilgisiz).

---

## 15. S1-02 kaydı: dış ağ doğrulaması ve blog canonical düzeltmesi (2026-10-25, 19:30 UTC)

- **Dış ağ / DNS:** `www` ve apex A = `62.238.99.154`, AAAA = `<yerel-DNS-çözümleyici-IPv6>`; CDN/proxy yok (nginx/1.24.0 doğrudan, `cache-control: private, no-cache, no-store`, `age`/`via`/`cf-*` yok). IPv4 ilk yanıt: 7 URL doğrudan 200, `Location` yok, self-canonical, `lang=en`, hreflang tr,en,ru,de,fr,ar,x-default. Host davranışı: `http://` ve apex → tek hop 301 → `https://www`. Bağımsız ağ (WebFetch) 7 URL'den 2'sini 200 içerikle aldı (ilk yanıt kodunu raporlamıyor). **IPv6: AAAA yayımlı ama 80/443 bağlantısı zaman aşımı veriyor** (yerel makinede IPv6 çalışıyor) → bkz. kalan sorunlar.
- **Blog:** `BlogPostTranslation` id `cmuv5jffb001t9a6qnux5o08e` (tr, yazı `cmuv5jfbs001s9a6qau7nq3eh`), `canonicalUrl` `/blog/buyukbas-hayvan-kesim-hatti` → `NULL`. Yedek: `..\_backups\blog-canonical-s1-02-2026-10-25T19-30-30-302Z\` (satır JSON + SHA-256 + `restore.sql`, doğrulandı). Tek transaction, advisory lock, `FOR UPDATE`, satır parmak izi ve eski değer eşleşmeli `updateMany`; işlem içi: 169 çeviri satırından yalnız 1'i, yalnız `canonicalUrl` alanı değişti; `BlogPost` tablosu ve redirect tablosu (`f0227403…f3ac`) aynı.
- **Sonrası:** blog sayfası 200, canonical kendisi, `robots: index, follow`, hreflang kümesi = sitemap alternates, eski canonical hedefi hiçbir yerde referanslanmıyor. Tam paketler: `s1-01-verify --full` TÜM TESTLER GEÇTİ; `redirects:check --full` TÜM DENETİMLER GEÇTİ (0 hata); `redirects:selftest` 15/15.

---

## 16. Düzeltme notu (S1-03, 2026-10-25): §15'teki IPv6 bulgusu geçersiz

§15'te "AAAA = `<yerel-DNS-çözümleyici-IPv6>` yayımlı ama 80/443 zaman aşımı veriyor" ifadesi **hatalıdır.** O adres alan adının AAAA kaydı değil, `nslookup` çıktısındaki *Server* satırındaki yerel DNS çözümleyicisidir (yerel ISP, TR). `mezbahateknolojileri.com` ve `www` için AAAA kaydı yoktur (Google/Cloudflare DoH, yerel çözümleyici ve iki yetkili NS ile doğrulandı). Dolayısıyla "kalan sorunlar" listesindeki IPv6 maddesi kaldırılmalıdır. Ayrıntı: `USA_SEO_S1_03_IPV6_AUDIT.md`. Redirect ve blog düzeltmeleri bu hatadan etkilenmez.
