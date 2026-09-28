/**
 * Faz 0 (salt okunur): eski sitenin (mezbahateknolojileri.com) her dil sitemap'indeki sayfaları çeker, sayfanın
 * <title>, <h1>, meta description ve hreflang karşılıklarını kaydeder. Çıktı: docs/i18n-inventory.json ve docs/i18n-inventory.md.
 * Kullanım: npx tsx prisma/migration/i18n-inventory.ts
 */
import { writeFileSync } from "node:fs";

const ORIGIN = "https://www.mezbahateknolojileri.com";
const LANGS = ["tr", "en", "ru", "de", "fa", "ar"] as const;

type Page = { lang: string; url: string; title: string; h1: string; description: string; alternates: Record<string, string> };

const decode = (s: string) =>
  s.replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#039;|&apos;/g, "'").replace(/&nbsp;/g, " ").trim();

async function get(url: string): Promise<string> {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(30000), redirect: "follow" });
      if (r.ok) return await r.text();
    } catch {}
  }
  return "";
}

async function main() {
  const pages: Page[] = [];
  for (const lang of LANGS) {
    const xml = await get(`${ORIGIN}/sitemap-${lang}.xml`);
    const urls = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
    console.log(lang, urls.length);
    const queue = [...urls];
    await Promise.all(
      Array.from({ length: 6 }, async () => {
        while (queue.length) {
          const url = queue.shift()!;
          const html = await get(url);
          const alternates: Record<string, string> = {};
          for (const m of html.matchAll(/<link[^>]*rel="alternate"[^>]*>/g)) {
            const href = m[0].match(/href="([^"]+)"/)?.[1];
            const hl = m[0].match(/hreflang="([^"]+)"/)?.[1];
            if (href && hl) alternates[hl] = href;
          }
          pages.push({
            lang,
            url,
            title: decode(html.match(/<title>([^<]*)<\/title>/)?.[1] ?? ""),
            h1: decode((html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/)?.[1] ?? "").replace(/<[^>]+>/g, "")),
            description: decode(html.match(/<meta[^>]*name="description"[^>]*content="([^"]*)"/)?.[1] ?? ""),
            alternates,
          });
        }
      })
    );
  }
  pages.sort((a, b) => a.lang.localeCompare(b.lang) || a.url.localeCompare(b.url));
  writeFileSync("docs/i18n-inventory.json", JSON.stringify({ source: ORIGIN, fetchedAt: new Date().toISOString().slice(0, 10), pages }, null, 2));

  const count = (l: string) => pages.filter((p) => p.lang === l).length;
  const withAlt = (l: string) => pages.filter((p) => p.lang === l && Object.keys(p.alternates).length > 1).length;
  const md = [
    "# Eski site dil envanteri (Faz 0)",
    "",
    `Kaynak: ${ORIGIN} — sitemap-<dil>.xml. Ayrıntı: docs/i18n-inventory.json`,
    "",
    "| Dil | Sayfa | hreflang karşılığı olan |",
    "|---|---|---|",
    ...LANGS.map((l) => `| ${l} | ${count(l)} | ${withAlt(l)} |`),
    "",
  ].join("\n");
  writeFileSync("docs/i18n-inventory.md", md);
  console.log(md);
}
main();
