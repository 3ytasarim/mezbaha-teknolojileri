# SEO / GEO Kabul Testleri

`SITE_URL` yerine local development'ta `http://localhost:3000`, production'da gerçek domain
kullanılmalı. Bu testler foundation fazında **manuel olarak** çalıştırılmalı; CI'a bağlanması
Phase 16 (DevOps) işi.

## Homepage SSR

```bash
curl -s http://localhost:3000/ | grep -i "<h1"
```
Beklenen: gerçek `<h1>Mezbaha Teknolojileri</h1>` HTML içinde görünmeli (JS çalıştırmadan).

## AI crawler erişimi (aynı substantive içerik)

```bash
curl -A "OAI-SearchBot" -s http://localhost:3000/ | grep -i "<h1"
curl -A "ChatGPT-User" -s http://localhost:3000/ | grep -i "<h1"
curl -A "ClaudeBot" -s http://localhost:3000/ | grep -i "<h1"
curl -A "Googlebot" -s http://localhost:3000/ | grep -i "<h1"
```
Beklenen: hepsi normal kullanıcıyla aynı HTML'i almalı (cloaking yok, proxy.ts hiçbir user-agent
bazlı ayrım yapmıyor).

## Sitemap

```bash
curl -I http://localhost:3000/sitemap.xml
curl -s http://localhost:3000/sitemap.xml
```
Beklenen: `Content-Type: application/xml`, geçerli XML, yalnızca `/` (şu an içerik route'ları
olmadığı için — bkz. `docs/seo-geo-architecture.md`).

## robots.txt

```bash
curl -s http://localhost:3000/robots.txt
```
Beklenen: `Disallow: /admin`, `Disallow: /api`, `Sitemap: http://localhost:3000/sitemap.xml`
satırları; GPTBot/ClaudeBot/Googlebot vb. için ayrı bloklar.

## llms.txt

```bash
curl -s http://localhost:3000/llms.txt
```
Beklenen: `Content-Type: text/plain`, şirket adı + tek cümlelik açıklama.

## 404

```bash
curl -I http://localhost:3000/bu-sayfa-kesinlikle-yok
```
Beklenen: `HTTP/1.1 404` (asla `200`).

## Admin — auth guard

```bash
curl -I http://localhost:3000/admin
```
Beklenen: `/admin/login`'e redirect (proxy.ts cookie kontrolü) — session cookie olmadan
dashboard içeriği **hiçbir şekilde** dönmemeli.

```bash
curl -s http://localhost:3000/admin/login | grep -i "noindex"
```
Beklenen: `robots` meta etiketinde `noindex, nofollow` (admin sayfaları indekslenmemeli).

## Semantic HTML

Homepage ve gelecekteki detay sayfalarında: tam olarak bir `<h1>`, mantıklı `<h2>`/`<h3>`
hiyerarşisi, blog detaylarında tek `<article>`. Bu foundation fazında homepage için manuel
gözle doğrulandı; otomatik bir linter (örn. `axe-core` CI adımı) Phase 15'te eklenmeli.
