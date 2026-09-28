import "dotenv/config";
import { writeFileSync } from "fs";
import path from "path";

const BASE_URL = process.env.VALIDATE_BASE_URL ?? "http://localhost:3700";
const ROOT = path.join(__dirname, "..", "..");

type PageCheck = {
  url: string;
  status: number | null;
  h1Count: number;
  hasCanonical: boolean;
  hasJsonLd: boolean;
  titleLength: number;
  descriptionLength: number;
  hasNoindex: boolean;
  internalLinksFound: number;
  brokenInternalLinks: string[];
  error?: string;
};

async function fetchText(url: string): Promise<{ status: number; text: string } | null> {
  try {
    const res = await fetch(url, { redirect: "manual" });
    const text = res.status >= 200 && res.status < 400 ? await res.text() : "";
    return { status: res.status, text };
  } catch {
    return null;
  }
}

async function checkPage(url: string, sampleLinks: boolean): Promise<PageCheck> {
  const result = await fetchText(url);
  if (!result) {
    return {
      url, status: null, h1Count: 0, hasCanonical: false, hasJsonLd: false,
      titleLength: 0, descriptionLength: 0, hasNoindex: false,
      internalLinksFound: 0, brokenInternalLinks: [], error: "fetch failed",
    };
  }

  const { status, text } = result;
  const h1Count = (text.match(/<h1[\s>]/g) ?? []).length;
  const hasCanonical = /<link rel="canonical"/.test(text);
  const hasJsonLd = /application\/ld\+json/.test(text);
  const titleMatch = text.match(/<title>([^<]*)<\/title>/);
  const descMatch = text.match(/<meta name="description" content="([^"]*)"/);
  const hasNoindex = /name="robots" content="noindex/.test(text);

  let internalLinksFound = 0;
  const brokenInternalLinks: string[] = [];

  if (sampleLinks && status >= 200 && status < 300) {
    const hrefs = Array.from(text.matchAll(/href="(\/[a-z0-9\-/]*)"/gi))
      .map((m) => m[1])
      .filter((h) => !h.startsWith("/admin") && !h.startsWith("/api"));
    const uniqueHrefs = Array.from(new Set(hrefs)).slice(0, 15);
    internalLinksFound = uniqueHrefs.length;

    for (const href of uniqueHrefs) {
      const linkResult = await fetchText(new URL(href, BASE_URL).toString());
      if (!linkResult || linkResult.status >= 400) {
        brokenInternalLinks.push(`${href} -> ${linkResult?.status ?? "fetch error"}`);
      }
    }
  }

  return {
    url,
    status,
    h1Count,
    hasCanonical,
    hasJsonLd,
    titleLength: titleMatch?.[1]?.length ?? 0,
    descriptionLength: descMatch?.[1]?.length ?? 0,
    hasNoindex,
    internalLinksFound,
    brokenInternalLinks,
  };
}

async function main() {
  console.log(`Doğrulama ${BASE_URL} üzerinde çalışıyor...`);

  // 1. Sitemap
  const sitemapResult = await fetchText(`${BASE_URL}/sitemap.xml`);
  const sitemapUrls = sitemapResult
    ? Array.from(sitemapResult.text.matchAll(/<loc>([^<]+)<\/loc>/g)).map((m) => m[1])
    : [];

  console.log(`Sitemap: ${sitemapUrls.length} URL bulundu.`);

  const sitemapChecks: { url: string; status: number | null; ok: boolean }[] = [];
  for (const url of sitemapUrls) {
    const r = await fetchText(url);
    sitemapChecks.push({ url, status: r?.status ?? null, ok: r?.status === 200 });
  }

  const sitemapReport = [
    "# Sitemap Validation",
    "",
    `Toplam URL: ${sitemapUrls.length}`,
    `200 OK: ${sitemapChecks.filter((c) => c.ok).length}`,
    `Sorunlu: ${sitemapChecks.filter((c) => !c.ok).length}`,
    "",
    "| URL | Status |",
    "|---|---|",
    ...sitemapChecks.map((c) => `| ${c.url} | ${c.status ?? "ERROR"} |`),
  ].join("\n");
  writeFileSync(path.join(ROOT, "docs", "sitemap-validation.md"), sitemapReport, "utf-8");

  // 2. Sample pages for metadata/structured-data/internal-link audit
  const samplePages = [
    BASE_URL + "/",
    BASE_URL + "/urunler",
    ...sitemapUrls.filter((u) => u.includes("/urunler/")).slice(0, 1),
    ...sitemapUrls.filter((u) => u.includes("/urun/")).slice(0, 3),
    BASE_URL + "/projeler",
    ...sitemapUrls.filter((u) => u.includes("/projeler/")).slice(0, 2),
    BASE_URL + "/blog",
    ...sitemapUrls.filter((u) => u.includes("/blog/")).slice(0, 3),
    BASE_URL + "/hakkimizda",
    BASE_URL + "/iletisim",
  ];

  const pageChecks: PageCheck[] = [];
  for (const url of samplePages) {
    pageChecks.push(await checkPage(url, true));
  }

  const metadataReport = [
    "# Metadata Audit",
    "",
    "| URL | Status | H1 | Canonical | JSON-LD | Title len | Desc len | noindex |",
    "|---|---|---|---|---|---|---|---|",
    ...pageChecks.map(
      (c) =>
        `| ${c.url} | ${c.status} | ${c.h1Count} | ${c.hasCanonical ? "✓" : "✗"} | ${c.hasJsonLd ? "✓" : "✗"} | ${c.titleLength} | ${c.descriptionLength} | ${c.hasNoindex ? "✓" : "—"} |`
    ),
    "",
    "## Sorunlar",
    "",
    ...pageChecks
      .filter((c) => c.h1Count !== 1 || !c.hasCanonical || !c.hasJsonLd || c.status !== 200)
      .map((c) => `- ${c.url}: status=${c.status}, h1=${c.h1Count}, canonical=${c.hasCanonical}, jsonld=${c.hasJsonLd}`),
  ].join("\n");
  writeFileSync(path.join(ROOT, "docs", "metadata-audit.md"), metadataReport, "utf-8");

  const linkReport = [
    "# Internal Link Audit",
    "",
    "Örneklenen sayfalardan çıkan internal link'ler test edildi (sayfa başına ilk 15 benzersiz link).",
    "",
    ...pageChecks.map((c) => {
      const lines = [`## ${c.url}`, `Kontrol edilen link: ${c.internalLinksFound}`];
      if (c.brokenInternalLinks.length > 0) {
        lines.push("Kırık/sorunlu:", ...c.brokenInternalLinks.map((l) => `- ${l}`));
      } else {
        lines.push("Sorun bulunamadı.");
      }
      return lines.join("\n");
    }),
  ].join("\n\n");
  writeFileSync(path.join(ROOT, "docs", "internal-link-audit.md"), linkReport, "utf-8");

  console.log("Raporlar yazıldı: docs/sitemap-validation.md, docs/metadata-audit.md, docs/internal-link-audit.md");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
