# Lighthouse — çok dilli site (2026-09-26)

Yerel production build (`next start`, tüm diller açık), Lighthouse 13, simüle throttling.

## Düzeltmelerden SONRA

| Sayfa | Mod | Perf | A11y | BP | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| ar-contact | desktop | 100 | 100 | 100 | 100 | 0.8 s | 0 ms | 0.000 |
| ar-contact | mobile | 68 | 100 | 100 | 100 | 6.7 s | 73 ms | 0.000 |
| ar-home | desktop | 99 | 100 | 100 | 100 | 0.9 s | 0 ms | 0.000 |
| ar-home | mobile | 82 | 100 | 100 | 100 | 4.4 s | 39 ms | 0.000 |
| en-home | desktop | 99 | 100 | 100 | 100 | 0.9 s | 0 ms | 0.000 |
| en-home | mobile | 78 | 100 | 100 | 100 | 4.7 s | 81 ms | 0.000 |
| en-product | desktop | 99 | 100 | 100 | 100 | 0.9 s | 0 ms | 0.000 |
| en-product | mobile | 80 | 100 | 100 | 100 | 4.9 s | 167 ms | 0.000 |
| tr-home | desktop | 98 | 100 | 100 | 100 | 1.0 s | 0 ms | 0.000 |
| tr-home | mobile | 76 | 100 | 100 | 100 | 5.1 s | 51 ms | 0.000 |
| tr-projeler | desktop | 99 | 100 | 100 | 100 | 0.8 s | 0 ms | 0.000 |
| tr-projeler | mobile | 83 | 100 | 100 | 100 | 4.4 s | 135 ms | 0.000 |

## Düzeltmelerden ÖNCE (ilk tur)

| Sayfa | Mod | Perf | A11y | BP | SEO | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|
| ar-contact | desktop | 100 | 100 | 100 | 100 | 0.8 s | 0 ms | 0.000 |
| ar-contact | mobile | 71 | 97 | 100 | 100 | 5.1 s | 32 ms | 0.000 |
| ar-home | desktop | 99 | 100 | 100 | 100 | 0.9 s | 0 ms | 0.000 |
| ar-home | mobile | 82 | 100 | 100 | 100 | 4.4 s | 56 ms | 0.000 |
| de-home | desktop | 99 | 96 | 100 | 100 | 0.9 s | 0 ms | 0.000 |
| de-home | mobile | 82 | 97 | 100 | 100 | 4.3 s | 33 ms | 0.000 |
| en-blog | desktop | 99 | 100 | 100 | 100 | 1.0 s | 6 ms | 0.000 |
| en-blog | mobile | 81 | 100 | 100 | 100 | 4.6 s | 36 ms | 0.000 |
| en-home | desktop | 99 | 93 | 100 | 100 | 0.9 s | 0 ms | 0.000 |
| en-home | mobile | 54 | 93 | 100 | 100 | 4.9 s | 1187 ms | 0.000 |
| en-product | desktop | 98 | 90 | 100 | 100 | 1.1 s | 2 ms | 0.000 |
| en-product | mobile | 84 | 90 | 100 | 100 | 4.5 s | 41 ms | 0.000 |
| fa-home | desktop | 99 | 96 | 100 | 100 | 0.9 s | 0 ms | 0.000 |
| fa-home | mobile | 85 | 97 | 100 | 100 | 4.3 s | 35 ms | 0.000 |
| ru-home | desktop | 99 | 93 | 100 | 100 | 0.9 s | 0 ms | 0.000 |
| ru-home | mobile | 78 | 93 | 100 | 100 | 4.9 s | 33 ms | 0.000 |
| tr-home | desktop | 97 | 93 | 100 | 100 | 1.1 s | 0 ms | 0.000 |
| tr-home | mobile | 57 | 93 | 100 | 100 | 5.4 s | 793 ms | 0.000 |
| tr-projeler | desktop | 99 | 100 | 96 | 100 | 0.8 s | 0 ms | 0.000 |
| tr-projeler | mobile | 84 | 100 | 96 | 100 | 4.4 s | 53 ms | 0.000 |

## Yapılan düzeltmeler
- Site geneli renk lekesi katmanında `mix-blend-multiply` kaldırıldı (her karede tüm sayfayı yeniden boyatıyordu): ana sayfa mobil TBT 793 ms → 51 ms
- Kontrast (Mühendislik kartları), dokunma hedefi (slayt/marquee noktaları, telefon bağlantıları), geçersiz `<dl>` (ürün bilgi kartı), metinsiz bağlantı (içerik HTML)
- YouTube kapağı: 404 veren hq720 yerine hqdefault (konsol hatası kalktı)

## Açık kalan
- Mobil LCP 4.4–6.7 s (metin öğesi, render gecikmesi ≈ 2.2 s: render-blocking CSS + yazı tipleri); ilk ölçümdeki 4.1 s'den yüksek
