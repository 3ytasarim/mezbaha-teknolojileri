/**
 * Kaynak site (TR) URL envanteri: sitemap-tr.xml'deki her URL için durum, title, H1 ve
 * yeni sitedeki karşılığı (url-migration-map.md). Nazik tarama: 2 eşzamanlı, 300ms bekleme.
 * Çıktı: docs/migration-source-manifest.json + .md
 */
import { writeFileSync } from "fs";
import path from "path";
import * as cheerio from "cheerio";
import { parseRedirectMap } from "./parse-redirect-map";

const ROOT = path.join(__dirname, "..", "..");
const UA = "MezbahaMigrationBot/1.0 (+content migration audit)";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function fetchRetry(url: string, tries = 3): Promise<Response | null> {
  for (let i = 0; i < tries; i++) {
    try {
      return await fetch(url, { redirect: "manual", headers: { "User-Agent": UA } });
    } catch {
      await sleep(600 * 2 ** i);
    }
  }
  return null;
}

async function main() {
  const smText = await (await fetch("https://www.mezbahateknolojileri.com/sitemap-tr.xml", { headers: { "User-Agent": UA } })).text();
  const urls = [...smText.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
  const map = parseRedirectMap();
  const byOld = new Map(map.map((r) => [r.oldUrl.replace(/\/$/, ""), r.newUrl]));

  const rows: { url: string; status: number | null; title: string | null; h1: string | null; newUrl: string | null }[] = [];
  let next = 0;
  await Promise.all(
    Array.from({ length: 2 }, async () => {
      while (next < urls.length) {
        const url = urls[next++];
        const res = await fetchRetry(url);
        let title: string | null = null;
        let h1: string | null = null;
        if (res && res.status === 200) {
          const $ = cheerio.load(await res.text());
          title = $("title").first().text().trim() || null;
          h1 = $("h1").first().text().replace(/\s+/g, " ").trim() || null;
        }
        const oldPath = new URL(url).pathname.replace(/\/$/, "");
        rows.push({ url, status: res?.status ?? null, title, h1, newUrl: byOld.get(oldPath) ?? (oldPath === "/tr" ? "/" : null) });
        await sleep(300);
      }
    })
  );
  rows.sort((a, b) => a.url.localeCompare(b.url));

  const generatedAt = new Date().toISOString();
  writeFileSync(path.join(ROOT, "docs", "migration-source-manifest.json"), JSON.stringify({ generatedAt, source: "https://www.mezbahateknolojileri.com/sitemap-tr.xml", count: rows.length, rows }, null, 2), "utf-8");
  const unmapped = rows.filter((r) => !r.newUrl);
  writeFileSync(
    path.join(ROOT, "docs", "migration-source-manifest.md"),
    [
      "# Migration Source Manifest (TR)", "",
      `Kaynak: \`sitemap-tr.xml\` — ${generatedAt}`, "",
      `- Toplam URL: **${rows.length}**`,
      `- HTTP 200: ${rows.filter((r) => r.status === 200).length}`,
      `- Yeni siteye eşlenen (url-migration-map.md): ${rows.length - unmapped.length}`,
      `- Eşlenmemiş: ${unmapped.length}`, "",
      "| Kaynak URL | HTTP | H1 | Title | Yeni URL |", "|---|---|---|---|---|",
      ...rows.map((r) => `| ${r.url.replace("https://www.mezbahateknolojileri.com", "")} | ${r.status ?? "ERR"} | ${(r.h1 ?? "-").replace(/\|/g, "\|")} | ${(r.title ?? "-").replace(/\|/g, "\|")} | ${r.newUrl ?? "**—**"} |`),
    ].join("\n"),
    "utf-8"
  );
  console.log(JSON.stringify({ total: rows.length, ok200: rows.filter((r) => r.status === 200).length, unmapped: unmapped.map((r) => r.url) }, null, 1));
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
