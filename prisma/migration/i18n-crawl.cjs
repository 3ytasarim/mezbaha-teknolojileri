// Tüm sitemap adreslerini (çok dilli) tarar: HTTP, title/description/h1/canonical/lang, img alt, hreflang karşılıklılığı, iç bağlantılar.
// Kullanım: tüm dilleri açıp `next build` + `next start -p 3800`, sonra `node prisma/migration/i18n-crawl.cjs` (cheerio gerekir).
const cheerio = require("cheerio");
const BASE = "http://localhost:3800";
const PROD = "https://www.mezbahateknolojileri.com";

async function get(path) {
  const r = await fetch(BASE + path, { redirect: "manual", signal: AbortSignal.timeout(60000) });
  return { status: r.status, text: r.status === 200 ? await r.text() : "", loc: r.headers.get("location") };
}

(async () => {
  const sm = await (await fetch(BASE + "/sitemap.xml")).text();
  const urls = [...sm.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].replace(PROD, "").replace(/^$/, "/"));
  const uniq = [...new Set(urls)];
  console.log("sitemap URL:", uniq.length);

  const issues = [];
  const pages = new Map();
  const queue = [...uniq];
  const links = new Set();
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      while (queue.length) {
        const p = queue.shift();
        let r;
        try { r = await get(p); } catch (e) { issues.push(`${p}: istek hatası ${e.message}`); continue; }
        if (r.status !== 200) { issues.push(`${p}: HTTP ${r.status}${r.loc ? " → " + r.loc : ""}`); continue; }
        const $ = cheerio.load(r.text);
        const title = $("title").first().text().trim();
        const desc = $('meta[name="description"]').attr("content") ?? "";
        const canon = $('link[rel="canonical"]').attr("href") ?? "";
        const h1 = $("h1").length;
        const lang = $("html").attr("lang");
        const alts = {};
        $('link[rel="alternate"][hreflang]').each((_, el) => { alts[$(el).attr("hreflang")] = $(el).attr("href"); });
        pages.set(p, { title, desc, canon, h1, lang, alts });
        if (!title) issues.push(`${p}: title yok`);
        if (!desc) issues.push(`${p}: meta description yok`);
        if (h1 !== 1) issues.push(`${p}: h1 sayısı ${h1}`);
        if (canon !== PROD + (p === "/" ? "" : p) && canon !== PROD + p) issues.push(`${p}: canonical uyumsuz (${canon})`);
        const expectLang = ["tr", "ru", "de", "fr", "ar"].find((l) => p === "/" + l || p.startsWith("/" + l + "/")) ?? "en";
        if (lang !== expectLang) issues.push(`${p}: html lang=${lang}, beklenen ${expectLang}`);
        $("img").each((_, el) => { if ($(el).attr("alt") === undefined) issues.push(`${p}: img alt yok (${($(el).attr("src") || "").slice(0, 60)})`); });
        $("a[href^='/']").each((_, el) => { const h = $(el).attr("href").split("#")[0].split("?")[0]; if (h && !/\.(png|jpg|jpeg|webp|svg|ico|pdf|xml|txt)$/i.test(h) && !h.startsWith("/_next") && !h.startsWith("/uploads")) links.add(h); });
      }
    })
  );

  // hreflang karşılıklılığı
  for (const [p, info] of pages) {
    for (const [l, href] of Object.entries(info.alts)) {
      if (l === "x-default") continue;
      const path = href.replace(PROD, "") || "/";
      const other = pages.get(path);
      if (!other) { issues.push(`${p}: hreflang ${l} → ${path} sitemap'te yok/200 değil`); continue; }
      const back = Object.values(other.alts).map((h) => h.replace(PROD, "") || "/");
      if (!back.includes(p)) issues.push(`${p}: hreflang ${l} → ${path} karşılıklı değil`);
    }
  }

  // iç bağlantılar
  const linkArr = [...links].filter((l) => !pages.has(l));
  console.log("sitemap dışı benzersiz iç bağlantı:", linkArr.length);
  const lq = [...linkArr];
  await Promise.all(Array.from({ length: 8 }, async () => {
    while (lq.length) {
      const l = lq.shift();
      try { const r = await fetch(BASE + l, { redirect: "manual", signal: AbortSignal.timeout(60000) }); if (r.status >= 400) issues.push(`bağlantı ${l}: HTTP ${r.status}`); } catch (e) { issues.push(`bağlantı ${l}: ${e.message}`); }
    }
  }));

  const count = {};
  for (const i of issues) { const k = i.replace(/^[^:]+: /, "").replace(/\(.*\)/, "").replace(/\d+/g, "N").slice(0, 60); count[k] = (count[k] || 0) + 1; }
  console.log("sorun sayısı:", issues.length);
  console.log(count);
  console.log(issues.slice(0, 40).join("\n"));
})();
