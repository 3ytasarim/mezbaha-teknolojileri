# S1-01 — Otomatik Test Planı (düzeltme sonrası doğrulama)

> Testler **salt-okunur HTTP GET** yapar (veritabanı erişimi yok, yazma yok). Yalnız durum kodu değil, **`Location` başlığını birebir** ve **canonical ilişkisini** (`<link rel="canonical">`, `lang`, hreflang, sitemap üyeliği) doğrular.
> Girdi: [`USA_SEO_S1_01_REDIRECT_CHANGES.csv`](USA_SEO_S1_01_REDIRECT_CHANGES.csv) · Özet: [`USA_SEO_S1_01_PREFLIGHT.md`](USA_SEO_S1_01_PREFLIGHT.md)

## 1. Kullanım

Betik repoda: `prisma/migration/s1-01-verify.cjs` (CSV güdümlü, bu sprint için). Kalıcı, CSV'den bağımsız denetim: `npm run redirects:check` (§6). Node ≥ 20 (yerleşik `fetch`):

```bash
node prisma/migration/s1-01-verify.cjs --expect current            # düzeltme ÖNCESİ: anlık görüntü gerçekle uyumlu mu? (hepsi geçmeli)
node prisma/migration/s1-01-verify.cjs --expect expected           # düzeltme SONRASI: hedef davranış (örneklemli sitemap)
node prisma/migration/s1-01-verify.cjs --expect expected --full    # tam: ~820 sitemap URL'sinin tamamı
```

- Çıkış kodu: `0` hepsi geçti, `1` en az bir başarısızlık.
- Redirect değişikliğinden sonra **en az 70 sn bekleyin** (proxy redirect önbelleği 60 sn). Betikte bekleme yoktur.
- Betik `user-agent: S1-01-tests/1.0 (read-only)` ile istek atar; eşzamanlılık 6.

## 2. Test grupları

| Grup | Kapsam | Beklenen (düzeltme sonrası) |
|---|---|---|
| **G1** | 7 güncel EN canonical (`/products`, `/contact-us`, `/corporate`, `/projects`, `/catalogs`, `/references`, `/products/cattle-slaughterhouse`) | Doğrudan **200** (Location yok) · `canonical` = kendi URL'si · `<html lang="en">` · hreflang `en` ve `x-default` kendisini gösterir · sitemap'te var · `noindex` yok |
| **G2** | Sitemap tutarlılığı (tabakalı örnek: her dil × her bölüm + her 12. URL + 7 URL; `--full` ile hepsi) | Her sitemap URL'si doğrudan **200**, **redirect yok**, self-canonical, `lang` = yol dili |
| **G3** | 370 sayfa kuralının tümü (7 gasp satırı hariç, G1 kapsar) | Eski URL **tek hop 301** · `Location` CSV'deki beklenen adresle **birebir** · hedef 404 değil · hedef doğrudan 200 (zincir yok) · hedef **self-canonical** · döngü yok (hedef ≠ kaynak) · kaynak ve hedef **dil öneki uyumlu** |
| **G4** | Diğer diller korunuyor | DE/FR/AR/TR/RU sitemap örneği doğrudan 200 + self-canonical · değişmeyen TR/RU kuralları aynı `Location` ile 301 |

### Kabul ölçütleri (post-fix, ikisi birlikte)
1. `--expect expected --full` → **"TÜM TESTLER GEÇTİ"** (0 başarısız).
2. Faz A sonrası ara kontrol: yalnız G1 + G2 anlamlıdır; G3'te 19 bağımlı satırın hedefi artık 200 olmalı (Faz B'den önce `Location` uyuşmazlıkları — 197 — beklenen).

## 3. Taban çizgisi sonuçları (2026-10-25, düzeltme ÖNCESİ, canlı)

| Çalıştırma | Sonuç |
|---|---|
| `--expect current` | **TÜM TESTLER GEÇTİ** — G1: 7 URL şu an 301 (regresyon doğrulandı); G2: 129 geçti; G3: 363 eski URL tek hop 301 + `Location` birebir, 166 hedef 200/self-canonical; G4: TR/RU değişmeyen 102 + diğer diller 116 geçti |
| `--expect expected` | **270 test başarısız** (beklenen): G1 — 7 URL 301 olduğundan canonical/lang/hreflang yok; G2 — 7 sitemap URL'si redirect veriyor; G3 — 197 `Location` uyuşmazlığı (örn. `/bleeding-pan` → `/urun/bleeding-pan`, beklenen `/product/bleeding-pan`; `/2018-slaughterhouse-catalog` → `/kataloglar/…`, beklenen `/catalogs/…`) + 19 hedef hâlâ 301/canonical'sız |

Yorum: `current` modu testlerin kendisinin doğruluğunu (yanlış-pozitif üretmediğini) kanıtlar; `expected` modunun düzeltme öncesi başarısız olması testlerin regresyonu **yakaladığını** kanıtlar (bu sprint için kritik: 13 Ekim doğrulaması aynı yanlış varsayımı paylaştığı için hatayı kaçırmıştı; burada beklenen değerler canlı canonical etiketlerinden türetildi).

## 4. Düzeltme sonrası kontrol listesi (elle ek)

- [ ] `--expect expected --full` → 0 başarısız.
- [ ] `curl -sI https://www.mezbahateknolojileri.com/contact-us` → `200`, `Location` yok.
- [ ] `curl -sI https://www.mezbahateknolojileri.com/bleeding-pan` → `301`, `Location: …/product/bleeding-pan`; hedef `200`.
- [ ] Sitemap'teki hiçbir URL redirect vermiyor (G2).
- [ ] RU örnek: eski `/ru/urun/<slug>` kuralı → `/ru/produkt/<slug>` (G3).
- [ ] Sunucu erişim logunda 7 URL için 301 yok; 5xx artışı yok.
- [ ] 24–48 saat sonra: Search Console Sayfa İndeksleme raporunda "Yönlendirmeli sayfa" sayısı düşüyor (yalnız okuma).

## 5. Bilinen sınırlar

- Testler HTTP düzeyindedir; JS ile üretilen link/meta doğrulanmaz (canonical/hreflang sunucu HTML'sinden okunur — site SSR olduğundan yeterli).
- `--full` ~820 sitemap URL'sini + 370 kural hedefini çekeceğinden birkaç dakika sürebilir; üretim sunucusuna nazik davranmak için eşzamanlılık 6'dır.
- Test paketi yazma yapmaz; geri alma doğrulaması için `--expect current` kullanın (ROLLBACK raporu).

## 6. Kalıcı otomatik testler (her redirect/sitemap değişikliğinden sonra)

| Komut | Ne yapar |
|---|---|
| `npm run redirects:selftest` | Guard için 15 birim testi (DB/ağ yok). **15/15 geçti.** |
| `npm run redirects:check -- --static` | DB'deki aktif kuralları guard ile denetler: canonical olmayan hedef, canonical kaynak (gasp), dil uyumsuzluğu, self/zincir. |
| `npm run redirects:check` | Statik + HTTP: her redirect tek hop/birebir `Location`/hedef 200 + self-canonical/dil; sitemap örneklemi 200 + self-canonical + noindex yok + `lang` + **hreflang kümesi = sitemap alternates**. |
| `npm run redirects:check -- --full` | Sitemap'in tamamı (820 URL). `--base http://localhost:3000` ile yerel sunucuya karşı da çalışır. |

Bugünkü (düzeltme öncesi) `--full` taban çizgisi: 370/370 redirect tek-hop ve birebir; **hedef self-canonical 204 hata**; kural denetimi 204 + 7 hata; sitemap 813/820 doğrudan 200 (7 gasp); 812/820 self-canonical (**+1 yeni bulgu**: TR blog çevirisinde 404 canonical, bkz. PREFLIGHT §12); noindex/lang 813/813; hreflang 741/741. **Düzeltme sonrası kabul:** ayrı onaylı içerik düzeltmesine kadar yalnız o 1 bulgu hariç **0 hata**.

> CI: `redirects:selftest` her PR'da; `redirects:check` deploy sonrası üretim URL'sine karşı çalıştırılabilir. Bu sprintte CI'ya bağlanmadı.
