# Sitemap Validation (Phase 11B)

Base: `http://localhost:3700` (sitemap host env'deki SITE_URL'den gelir; denetim yerel host'a yeniden yazılarak yapıldı).

- Sitemap URL sayısı: **128**
- HTTP 200 dönen: **128** / 128
- Tekrar eden girdi: 0
- Kendine işaret eden canonical: 128 / 128
- noindex olan sitemap URL'si: 0
- Kırılım: ürün 55, blog 32, proje 26, kategori 4
- DB'de PUBLISHED olup sitemap'te olmayan: 0
- 200 dışı: yok

robots.txt: `Sitemap:` satırı mevcut; /admin ve /api Disallow; AI botları (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, PerplexityBot vb.) Allow.