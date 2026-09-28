# Lighthouse — Phase 11D yeni sayfalar

Yerel production build (`next start`), Lighthouse 13.5, simüle throttling. Kataloglar/Videolar/Hizmetler sayfaları.

| Sayfa | Mod | Perf | A11y | BP | SEO | FCP | LCP | TBT | CLS |
|---|---|---|---|---|---|---|---|---|---|
| catalogs | mobile | 87 | 100 | 100 | 100 | 0.8 s | 4.0 s | 40 ms | 0 |
| catalog | mobile | 86 | 100 | 100 | 100 | 1.0 s | 4.0 s | 100 ms | 0 |
| videos | mobile | 87 | 100 | 100 | 100 | 1.1 s | 4.0 s | 40 ms | 0 |
| services | mobile | 93 | 100 | 100 | 100 | 0.8 s | 3.3 s | 20 ms | 0 |
| service | mobile | 88 | 100 | 100 | 100 | 1.2 s | 3.6 s | 50 ms | 0 |
| catalogs | desktop | 99 | 100 | 100 | 100 | 0.3 s | 1.0 s | 0 ms | 0 |
| catalog | desktop | 99 | 100 | 100 | 100 | 0.3 s | 0.9 s | 0 ms | 0 |
| videos | desktop | 99 | 100 | 100 | 100 | 0.3 s | 0.8 s | 0 ms | 0 |
| services | desktop | 99 | 100 | 100 | 100 | 0.3 s | 0.9 s | 0 ms | 0 |
| service | desktop | 99 | 100 | 100 | 100 | 0.3 s | 0.9 s | 0 ms | 0 |

## Başarısız temel denetimler

Yok (color-contrast, image-alt, link-name, meta-description, label, ARIA, unsized-images hepsi geçti).
