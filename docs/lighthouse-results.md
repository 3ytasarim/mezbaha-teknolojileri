# Lighthouse Results (Phase 11C)

Ortam: yerel `next start` (production build), Lighthouse 13.5.0, headless Chrome, **localhost** (ağ/CDN yok; skorlar canlı ortamdan farklı olabilir). Mobil = Lighthouse varsayılan mobil emülasyon + simüle throttling; Masaüstü = desktop preset.

| Sayfa | Mod | Perf | A11y | BP | SEO | FCP | LCP | TBT | CLS | SI |
|---|---|---|---|---|---|---|---|---|---|---|
| home | mobile | 87 | 100 | 100 | 100 | 1.0 s | 4.1 s | 20 ms | 0 | 1.0 s |
| category | mobile | 85 | 100 | 100 | 100 | 0.9 s | 4.3 s | 80 ms | 0 | 1.3 s |
| product | mobile | 86 | 100 | 100 | 100 | 0.8 s | 4.0 s | 10 ms | 0 | 3.6 s |
| projects | mobile | 88 | 100 | 100 | 100 | 0.8 s | 3.7 s | 50 ms | 0 | 3.3 s |
| project | mobile | 90 | 100 | 100 | 100 | 1.2 s | 3.6 s | 30 ms | 0 | 2.9 s |
| blogindex | mobile | 85 | 100 | 100 | 100 | 0.9 s | 4.3 s | 30 ms | 0 | 0.9 s |
| article | mobile | 83 | 100 | 100 | 100 | 1.4 s | 4.3 s | 30 ms | 0 | 4.3 s |
| home | desktop | 98 | 100 | 100 | 100 | 0.4 s | 1.1 s | 0 ms | 0 | 0.5 s |
| category | desktop | 99 | 100 | 100 | 100 | 0.4 s | 0.9 s | 20 ms | 0 | 1.1 s |
| product | desktop | 100 | 100 | 100 | 100 | 0.3 s | 0.8 s | 0 ms | 0 | 0.5 s |
| projects | desktop | 100 | 100 | 100 | 100 | 0.2 s | 0.8 s | 20 ms | 0 | 0.3 s |
| project | desktop | 99 | 100 | 100 | 100 | 0.3 s | 0.9 s | 0 ms | 0 | 0.6 s |
| blogindex | desktop | 98 | 100 | 100 | 100 | 0.4 s | 1.2 s | 0 ms | 0 | 0.6 s |
| article | desktop | 99 | 100 | 100 | 100 | 0.3 s | 0.8 s | 0 ms | 0 | 0.3 s |

## Bulgular (skoru <0.9 olan denetimler, sayfa sayısına göre)

- **Reduce unused JavaScript** (unused-javascript) — 14/14 çalıştırma; Est savings of 28 KiB; örnek: home-mobile, category-mobile, product-mobile, projects-mobile
- **Legacy JavaScript** (legacy-javascript-insight) — 14/14 çalıştırma; Est savings of 13 KiB; örnek: home-mobile, category-mobile, product-mobile, projects-mobile
- **Render-blocking requests** (render-blocking-insight) — 14/14 çalıştırma; Est savings of 60 ms; örnek: home-mobile, category-mobile, product-mobile, projects-mobile
- **Improve image delivery** (image-delivery-insight) — 9/14 çalıştırma; Est savings of 52 KiB; örnek: home-mobile, product-mobile, blogindex-mobile, article-mobile
- **Page prevented back/forward cache restoration** (bf-cache) — 8/14 çalıştırma; 2 failure reasons; örnek: category-mobile, product-mobile, project-mobile, article-mobile
- **Largest Contentful Paint** (largest-contentful-paint) — 7/14 çalıştırma; 4.1 s; örnek: home-mobile, category-mobile, product-mobile, projects-mobile
- **Time to Interactive** (interactive) — 6/14 çalıştırma; 4.4 s; örnek: home-mobile, category-mobile, product-mobile, project-mobile
- **Network dependency tree** (network-dependency-tree-insight) — 6/14 çalıştırma; örnek: home-mobile, projects-mobile, blogindex-mobile, home-desktop
- **Forced reflow** (forced-reflow-insight) — 3/14 çalıştırma; örnek: home-mobile, category-mobile, product-mobile
- **Speed Index** (speed-index) — 2/14 çalıştırma; 3.6 s; örnek: product-mobile, article-mobile
- **LCP request discovery** (lcp-discovery-insight) — 2/14 çalıştırma; örnek: blogindex-mobile, blogindex-desktop
- **Max Potential First Input Delay** (max-potential-fid) — 1/14 çalıştırma; 200 ms; örnek: category-mobile
- **Reduce initial server response time** (server-response-time) — 1/14 çalıştırma; Root document took 690 ms; örnek: category-desktop
- **Document request latency** (document-latency-insight) — 1/14 çalıştırma; Est savings of 590 ms; örnek: category-desktop