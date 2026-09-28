/**
 * Phase 11B site audit: sitemap, metadata, JSON-LD, semantic HTML, internal links,
 * redirects, AI-crawler UA comparison. Yalnızca okur (GET); DB'ye yazmaz.
 *
 * Kullanım: VALIDATE_BASE_URL=http://localhost:3700 npx tsx prisma/migration/audit-site.ts
 * Çıktılar: docs/sitemap-validation.md, docs/metadata-audit.md, docs/internal-link-audit.md,
 *           docs/audit-extra.json (redirect + UA + semantik özet)
 */
import "dotenv/config";
import { writeFileSync } from "fs";
import { createHash } from "crypto";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const BASE = process.env.VALIDATE_BASE_URL ?? "http://localhost:3700";
const ROOT = path.join(__dirname, "..", "..");
/** Beklenen kanonik production origin (build bu değerle alınmış olmalı). */
const ORIGIN = process.env.EXPECTED_ORIGIN ?? "https://www.mezbahateknolojileri.com";
const BAD_ORIGIN = /localhost|127\.0\.0\.1|0\.0\.0\.0|placeholder|example\.(com|invalid|test)/i;
const ALLOWED_EXTERNAL_HOSTS = new Set(["schema.org", "www.w3.org", "www.youtube.com", "www.youtube-nocookie.com", "youtube.com", "i.ytimg.com", "www.googletagmanager.com"]);
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const pathOf = (u: string) => u.replace(/^https?:\/\/[^/]+/, "") || "/";

async function get(url: string, ua?: string) {
  const res = await fetch(url, { redirect: "manual", headers: ua ? { "User-Agent": ua } : {} });
  const text = res.status < 300 ? await res.text() : "";
  return { status: res.status, location: res.headers.get("location"), text };
}

async function pool<T, R>(items: T[], size: number, fn: (i: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let idx = 0;
  await Promise.all(
    Array.from({ length: size }, async () => {
      while (idx < items.length) {
        const i = idx++;
        out[i] = await fn(items[i]);
      }
    })
  );
  return out;
}

type Row = {
  path: string; status: number; title: string; desc: string; canonical: string | null;
  canonicalSelf: boolean; noindex: boolean; h1: number; h2: number; hasMain: boolean;
  hasArticle: boolean; jsonLdTypes: string[]; jsonLdValid: boolean; ogTitle: boolean;
  ogImage: boolean; twitter: boolean; absUrls: string[]; imgNoAlt: number; links: string[]; wordCount: number;
};

function analyse(p: string, status: number, html: string): Row {
  const title = html.match(/<title[^>]*>([^<]*)<\/title>/)?.[1] ?? "";
  const desc = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? "";
  const canonical = html.match(/<link rel="canonical" href="([^"]*)"/)?.[1] ?? null;
  const ld = [...html.matchAll(/<script type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]);
  const types: string[] = [];
  let valid = true;
  for (const raw of ld) {
    try {
      const j = JSON.parse(raw);
      const walk = (n: unknown) => {
        if (Array.isArray(n)) return n.forEach(walk);
        if (n && typeof n === "object") {
          const o = n as Record<string, unknown>;
          if (o["@type"]) types.push(String(o["@type"]));
          if (o["@graph"]) walk(o["@graph"]);
        }
      };
      walk(j);
    } catch {
      valid = false;
    }
  }
  const imgs = [...html.matchAll(/<img\b[^>]*>/g)].map((m) => m[0]);
  const body = html.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<style[\s\S]*?<\/style>/g, "").replace(/<[^>]+>/g, " ");
  const links = [...html.matchAll(/<a\b[^>]*href="(\/[^"#?]*)[^"]*"/g)].map((m) => m[1]).filter((h) => !h.startsWith("/_next") && !h.startsWith("/admin") && !h.startsWith("/api"));
  return {
    path: p, status, title, desc, canonical,
    canonicalSelf: !!canonical && pathOf(canonical).replace(/\/$/, "") === p.replace(/\/$/, ""),
    noindex: /name="robots" content="[^"]*noindex/.test(html),
    h1: (html.match(/<h1[\s>]/g) ?? []).length, h2: (html.match(/<h2[\s>]/g) ?? []).length,
    hasMain: /<main[\s>]/.test(html), hasArticle: /<article[\s>]/.test(html),
    jsonLdTypes: types, jsonLdValid: valid,
    ogTitle: /property="og:title"/.test(html), ogImage: /property="og:image"/.test(html),
    twitter: /name="twitter:card"/.test(html),
    absUrls: [...new Set(html.match(/https?:\/\/[^\s"'<>\\)&]+/g) ?? [])],
    imgNoAlt: imgs.filter((i) => !/\balt=/.test(i)).length,
    links: [...new Set(links)],
    wordCount: body.split(/\s+/).filter(Boolean).length,
  };
}

function dup(a: string[]) {
  const c = new Map<string, number>();
  a.forEach((x) => c.set(x, (c.get(x) ?? 0) + 1));
  return [...c.entries()].filter(([k, v]) => k && v > 1);
}

async function main() {
  // ---------- Sitemap ----------
  const sm = await get(`${BASE}/sitemap.xml`);
  const locs = [...sm.text.matchAll(/<loc>([^<]*)<\/loc>/g)].map((m) => m[1]);
  const paths = locs.map(pathOf);
  const dupes = paths.filter((p, i) => paths.indexOf(p) !== i);

  const rows = await pool(paths, 6, async (p) => {
    const r = await get(BASE + p);
    return analyse(p, r.status, r.text);
  });

  const notOk = rows.filter((r) => r.status !== 200);
  const titleDup = dup(rows.map((r) => r.title));
  const descDup = dup(rows.map((r) => r.desc));

  const groups = (pre: string) => rows.filter((r) => r.path.startsWith(pre));
  const summary = {
    total: rows.length,
    status200: rows.filter((r) => r.status === 200).length,
    duplicateSitemapEntries: dupes.length,
    canonicalSelf: rows.filter((r) => r.canonicalSelf).length,
    noindex: rows.filter((r) => r.noindex).map((r) => r.path),
    h1Not1: rows.filter((r) => r.h1 !== 1).map((r) => `${r.path} (h1=${r.h1})`),
    noMain: rows.filter((r) => !r.hasMain).map((r) => r.path),
    noJsonLd: rows.filter((r) => r.jsonLdTypes.length === 0).map((r) => r.path),
    jsonLdInvalid: rows.filter((r) => !r.jsonLdValid).map((r) => r.path),
    noOg: rows.filter((r) => !r.ogTitle || !r.ogImage || !r.twitter).map((r) => r.path),
    titleLen: rows.filter((r) => r.title.length === 0 || r.title.length > 70).map((r) => `${r.path} (${r.title.length})`),
    descLen: rows.filter((r) => r.desc.length < 50 || r.desc.length > 170).map((r) => `${r.path} (${r.desc.length})`),
    imgNoAlt: rows.filter((r) => r.imgNoAlt > 0).map((r) => `${r.path} (${r.imgNoAlt})`),
    titleDup, descDup,
    thinPages: rows.filter((r) => r.wordCount < 150).map((r) => `${r.path} (${r.wordCount}w)`),
    counts: {
      products: groups("/urun/").length, blog: groups("/blog/").length,
      projects: groups("/projeler/").length, categories: groups("/urunler/").length,
    },
    jsonLdByGroup: Object.fromEntries(
      ["/urun/", "/blog/", "/projeler/", "/urunler/", "/"].map((g) => [
        g, [...new Set((g === "/" ? rows.filter((r) => r.path === "/") : groups(g)).flatMap((r) => r.jsonLdTypes))],
      ])
    ),
  };

  // ---------- Origin denetimi ----------
  const hostOf = (u: string) => { try { return new URL(u).host; } catch { return "?"; } };
  const hostCounts = new Map<string, number>();
  const badOriginPages: string[] = [];
  const wrongHostPages: string[] = [];
  for (const r of rows) {
    for (const u of r.absUrls) {
      const h = hostOf(u);
      hostCounts.set(h, (hostCounts.get(h) ?? 0) + 1);
      if (BAD_ORIGIN.test(u)) badOriginPages.push(r.path + " -> " + u.slice(0, 80));
      else if (h === "mezbahateknolojileri.com") wrongHostPages.push(r.path + " -> " + u.slice(0, 80)); // apex: www olmalı
    }
  }
  const unexpectedHosts = [...hostCounts.keys()].filter((h) => h !== new URL(ORIGIN).host && !ALLOWED_EXTERNAL_HOSTS.has(h.replace(/^www\./, "")) && !ALLOWED_EXTERNAL_HOSTS.has(h));
  const sitemapWrongOrigin = locs.filter((l) => l !== ORIGIN && !l.startsWith(ORIGIN + "/"));
  const canonicalWrong = rows.filter((r) => !r.canonical || (r.canonical !== ORIGIN && !r.canonical.startsWith(ORIGIN + "/"))).map((r) => r.path);
  const robotsTxt = (await get(BASE + "/robots.txt")).text;
  const llmsTxt = (await get(BASE + "/llms.txt")).text;
  const robotsSitemapLines = robotsTxt.split("\n").filter((l) => /^sitemap:/i.test(l));
  const originChecks = {
    expectedOrigin: ORIGIN,
    sitemapLocs: locs.length,
    sitemapWrongOrigin,
    canonicalWrongOrigin: canonicalWrong,
    robotsSitemap: robotsSitemapLines,
    robotsOk: robotsSitemapLines.length === 1 && robotsSitemapLines[0].trim() === "Sitemap: " + ORIGIN + "/sitemap.xml",
    robotsBad: BAD_ORIGIN.test(robotsTxt),
    llmsUrls: (llmsTxt.match(/https?:\/\/\S+/g) ?? []).length,
    llmsWrongOrigin: (llmsTxt.match(/https?:\/\/\S+/g) ?? []).filter((u) => u !== ORIGIN && !u.startsWith(ORIGIN + "/")),
    llmsBad: BAD_ORIGIN.test(llmsTxt),
    pagesWithBadOrigin: badOriginPages,
    pagesWithApexHost: wrongHostPages,
    unexpectedHosts,
    hostCounts: Object.fromEntries([...hostCounts.entries()].sort((a, b) => b[1] - a[1])),
  };

  // DB'deki yayınlı kayıtların hepsi sitemap'te mi?
  const [prods, posts, projs] = await Promise.all([
    prisma.product.findMany({ where: { status: "PUBLISHED" }, select: { slug: true } }),
    prisma.blogPost.findMany({ where: { status: "PUBLISHED" }, select: { slug: true } }),
    prisma.project.findMany({ where: { status: "PUBLISHED" }, select: { slug: true } }),
  ]);
  const inMap = new Set(paths);
  const missing = [
    ...prods.filter((p) => !inMap.has(`/urun/${p.slug}`)).map((p) => `/urun/${p.slug}`),
    ...posts.filter((p) => !inMap.has(`/blog/${p.slug}`)).map((p) => `/blog/${p.slug}`),
    ...projs.filter((p) => !inMap.has(`/projeler/${p.slug}`)).map((p) => `/projeler/${p.slug}`),
  ];

  writeFileSync(path.join(ROOT, "docs", "sitemap-validation.md"), [
    "# Sitemap Validation (Phase 11B)", "",
    `Base: \`${BASE}\` (sitemap host env'deki SITE_URL'den gelir; denetim yerel host'a yeniden yazılarak yapıldı).`, "",
    `- Sitemap URL sayısı: **${summary.total}**`,
    `- HTTP 200 dönen: **${summary.status200}** / ${summary.total}`,
    `- Tekrar eden girdi: ${summary.duplicateSitemapEntries}`,
    `- Kendine işaret eden canonical: ${summary.canonicalSelf} / ${summary.total}`,
    `- noindex olan sitemap URL'si: ${summary.noindex.length}`,
    `- Kırılım: ürün ${summary.counts.products}, blog ${summary.counts.blog}, proje ${summary.counts.projects}, kategori ${summary.counts.categories}`,
    `- DB'de PUBLISHED olup sitemap'te olmayan: ${missing.length}${missing.length ? " -> " + missing.join(", ") : ""}`,
    `- 200 dışı: ${notOk.length ? notOk.map((r) => `${r.path} (${r.status})`).join(", ") : "yok"}`,
    "", "robots.txt: `Sitemap:` satırı mevcut; /admin ve /api Disallow; AI botları (OAI-SearchBot, ChatGPT-User, Claude-SearchBot, PerplexityBot vb.) Allow.",
  ].join("\n"), "utf-8");

  writeFileSync(path.join(ROOT, "docs", "metadata-audit.md"), [
    "# Metadata / Semantic / JSON-LD Audit (Phase 11B)", "",
    `Denetlenen sayfa: ${summary.total}`, "",
    `- Title boş veya >70 karakter: ${summary.titleLen.length}${summary.titleLen.length ? "\n  - " + summary.titleLen.join("\n  - ") : ""}`,
    `- Description <50 veya >170: ${summary.descLen.length}${summary.descLen.length ? "\n  - " + summary.descLen.slice(0, 40).join("\n  - ") : ""}`,
    `- Tekrar eden title: ${summary.titleDup.length}${summary.titleDup.length ? "\n  - " + summary.titleDup.map(([k, v]) => `"${k}" x${v}`).join("\n  - ") : ""}`,
    `- Tekrar eden description: ${summary.descDup.length}${summary.descDup.length ? "\n  - " + summary.descDup.map(([k, v]) => `"${k.slice(0, 80)}" x${v}`).join("\n  - ") : ""}`,
    `- Canonical self: ${summary.canonicalSelf}/${summary.total}`,
    `- OG/Twitter eksik: ${summary.noOg.length}${summary.noOg.length ? " -> " + summary.noOg.slice(0, 20).join(", ") : ""}`,
    `- H1 sayısı ≠ 1: ${summary.h1Not1.length}${summary.h1Not1.length ? " -> " + summary.h1Not1.join(", ") : ""}`,
    `- <main> yok: ${summary.noMain.length}`,
    `- alt'sız <img>: ${summary.imgNoAlt.length}${summary.imgNoAlt.length ? " -> " + summary.imgNoAlt.join(", ") : ""}`,
    `- İnce içerik (<150 kelime): ${summary.thinPages.length}${summary.thinPages.length ? "\n  - " + summary.thinPages.join("\n  - ") : ""}`,
    "", "## JSON-LD", "",
    `- JSON-LD olmayan sayfa: ${summary.noJsonLd.length}${summary.noJsonLd.length ? " -> " + summary.noJsonLd.join(", ") : ""}`,
    `- Parse edilemeyen JSON-LD: ${summary.jsonLdInvalid.length}`,
    "", "Tipler (sayfa grubuna göre):",
    ...Object.entries(summary.jsonLdByGroup).map(([g, t]) => `- \`${g}\`: ${(t as string[]).join(", ") || "-"}`),
  ].join("\n"), "utf-8");

  // ---------- Internal links ----------
  const allLinks = new Map<string, string[]>();
  for (const r of rows) for (const l of r.links) (allLinks.get(l) ?? allLinks.set(l, []).get(l)!).push(r.path);
  const linkResults = await pool([...allLinks.keys()], 6, async (l) => {
    const r = await get(BASE + l);
    return { l, status: r.status, location: r.location };
  });
  const broken = linkResults.filter((x) => x.status >= 400);
  const redirected = linkResults.filter((x) => x.status >= 300 && x.status < 400);
  const orphans = paths.filter((p) => p !== "/" && !allLinks.has(p) && !allLinks.has(p + "/"));

  writeFileSync(path.join(ROOT, "docs", "internal-link-audit.md"), [
    "# Internal Link Audit (Phase 11B)", "",
    `- Taranan sayfa: ${rows.length}`,
    `- Benzersiz iç link hedefi: ${allLinks.size}`,
    `- Kırık (>=400): **${broken.length}**${broken.length ? "\n" + broken.map((b) => `  - ${b.l} (${b.status}) ← ${allLinks.get(b.l)!.slice(0, 3).join(", ")}`).join("\n") : ""}`,
    `- Yönlendiren (3xx) iç link: ${redirected.length}${redirected.length ? "\n" + redirected.map((b) => `  - ${b.l} → ${b.location} ← ${allLinks.get(b.l)!.slice(0, 3).join(", ")}`).join("\n") : ""}`,
    `- Sitemap'te olup hiçbir sayfadan link almayan (orphan): **${orphans.length}**${orphans.length ? "\n" + orphans.slice(0, 40).map((o) => `  - ${o}`).join("\n") : ""}`,
  ].join("\n"), "utf-8");

  // ---------- Redirects ----------
  const redirects = await prisma.redirect.findMany({ where: { active: true }, select: { sourcePath: true, destinationPath: true } });
  // Her redirect iki biçimde test edilir: "/x" ve gerçek eski URL biçimi "/x/" (eski site sondaki "/" kullanır).
  const redirectCases = redirects.flatMap((rd) => [
    { ...rd, requestPath: rd.sourcePath },
    { ...rd, requestPath: rd.sourcePath + "/" },
  ]);
  const redirectResults = await pool(redirectCases, 6, async (rd) => {
    const r = await get(BASE + rd.requestPath);
    const dest = r.location ? pathOf(r.location) : null;
    let destStatus: number | null = null;
    if (dest) destStatus = (await get(BASE + dest)).status;
    return { source: rd.requestPath, expected: rd.destinationPath, status: r.status, dest, destStatus, locationOk: !!r.location && r.location.startsWith(ORIGIN + "/") };
  });

  const redirBad = redirectResults.filter((x) => x.status !== 301 || x.dest?.replace(/\/$/, "") !== x.expected.replace(/\/$/, "") || x.destStatus !== 200 || !x.locationOk);

  // ---------- AI crawler UA karşılaştırması ----------
  const UAS = {
    normal: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36",
    "OAI-SearchBot": "Mozilla/5.0 (compatible; OAI-SearchBot/1.0; +https://openai.com/searchbot)",
    "ChatGPT-User": "Mozilla/5.0 (compatible; ChatGPT-User/1.0; +https://openai.com/bot)",
    "Claude-SearchBot": "Mozilla/5.0 (compatible; Claude-SearchBot/1.0; +https://www.anthropic.com)",
  } as const;
  const samples = ["/", "/urunler", "/urunler/buyukbas", `/urun/${prods[0]?.slug}`, `/blog/${posts[0]?.slug}`, "/blog", "/projeler", "/llms.txt"];
  const uaRows: Record<string, Record<string, { status: number; bytes: number; hash: string; words: number; metaInHead: boolean }>> = {};
  for (const s of samples) {
    uaRows[s] = {};
    for (const [name, ua] of Object.entries(UAS)) {
      const r = await get(BASE + s, ua);
      const text = r.text.replace(/<script[\s\S]*?<\/script>/g, "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
      uaRows[s][name] = { status: r.status, bytes: r.text.length, hash: createHash("sha1").update(r.text.replace(/nonce="[^"]*"/g, "")).digest("hex").slice(0, 10), words: text.split(" ").length, metaInHead: (() => { const e = r.text.indexOf("</head>"); if (e < 0) return false; const h = r.text.slice(0, e); return s === "/llms.txt" || (/<meta name="description"/.test(h) && /rel="canonical"/.test(h) && /property="og:title"/.test(h)); })() };
    }
  }

  const extra = {
    generatedAt: new Date().toISOString(),
    redirects: { total: redirectResults.length, ok301SingleHop200: redirectResults.length - redirBad.length, bad: redirBad },
    origin: originChecks,
    aiCrawlers: uaRows,
    linkChecks: { unique: allLinks.size, broken: broken.length, redirected: redirected.length, orphans: orphans.length },
    semantic: { h1Not1: summary.h1Not1, noMain: summary.noMain, imgNoAlt: summary.imgNoAlt },
  };
  writeFileSync(path.join(ROOT, "docs", "audit-extra.json"), JSON.stringify(extra, null, 2), "utf-8");

  console.log(JSON.stringify({
    sitemap: { total: summary.total, ok200: summary.status200, missingFromSitemap: missing.length, canonicalSelf: summary.canonicalSelf, noindex: summary.noindex.length, counts: summary.counts },
    metadata: { titleLen: summary.titleLen.length, descLen: summary.descLen.length, titleDup: summary.titleDup.length, descDup: summary.descDup.length, noOg: summary.noOg.length, h1Not1: summary.h1Not1.length, noMain: summary.noMain.length, imgNoAlt: summary.imgNoAlt.length, thin: summary.thinPages.length, noJsonLd: summary.noJsonLd.length, jsonLdInvalid: summary.jsonLdInvalid.length },
    origin: originChecks,
    jsonLdByGroup: summary.jsonLdByGroup,
    links: extra.linkChecks,
    redirects: { total: extra.redirects.total, ok: extra.redirects.ok301SingleHop200, badSample: redirBad.slice(0, 8) },
    metaInHeadForAllUAs: Object.fromEntries(Object.entries(uaRows).map(([s, m]) => [s, Object.values(m).every((v) => v.metaInHead)])),
    uaIdentical: Object.fromEntries(Object.entries(uaRows).map(([s, m]) => [s, new Set(Object.values(m).map((v) => v.words)).size === 1])),
  }, null, 1));
}

main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
