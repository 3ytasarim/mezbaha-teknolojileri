/**
 * Kalıcı redirect / canonical / sitemap denetimi. SALT OKUNUR: veritabanında yalnızca SELECT, canlı sitede yalnızca GET.
 *
 *   npm run redirects:check                          # statik + HTTP, canlı site (sitemap örneklemi)
 *   npm run redirects:check -- --full                # sitemap'in TAMAMI
 *   npm run redirects:check -- --static              # yalnız veritabanı kuralları + sitemap (HTTP sayfa testi yok)
 *   npm run redirects:check -- --base http://localhost:3000
 *
 * Denetlenenler
 *   1) Her aktif sayfa redirect'i: kural denetimi (SOURCE_IS_CANONICAL, DEST_NOT_CANONICAL, LOCALE_MISMATCH, SELF, zincir),
 *      HTTP: kaynak tam olarak kayıtlı durum koduyla yönlendirir, `Location` hedefle BİREBİR aynıdır (tek hop),
 *      hedef doğrudan 200 verir ve kendi canonical'ıdır (self-canonical), hedef sayfa dili yol diliyle uyumludur.
 *   2) Sitemap: her URL doğrudan 200 (redirect yok), self-canonical, noindex değil, <html lang> yol diliyle uyumlu,
 *      sayfadaki hreflang kümesi sitemap'teki alternates ile aynı (hreflang korunur).
 * Çıkış kodu 1 = en az bir hata. Redirect değişikliğinden sonra ≥70 sn bekleyin (proxy önbelleği 60 sn).
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { checkRedirectTable, localeOfPath, normalizePath } from "../../src/lib/seo/redirect-guard";

const args = process.argv.slice(2);
const flag = (n: string) => args.includes(n);
const val = (n: string) => {
  const i = args.indexOf(n);
  return i >= 0 ? args[i + 1] : undefined;
};
const BASE = (val("--base") ?? process.env.CHECK_BASE_URL ?? "https://www.mezbahateknolojileri.com").replace(/\/$/, "");
const STATIC_ONLY = flag("--static");
const FULL = flag("--full");
const UA = "redirect-check/1.0 (read-only)";

const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const pathOf = (u: string) => normalizePath(new URL(u, BASE).pathname);
const isAsset = (p: string) => /^\/(images|uploads)\//.test(p);

type Probe = { status: number; location: string; canonical?: string; lang?: string; robots?: string; hreflangs?: string[] };
const cache = new Map<string, Promise<Probe>>();
function get(path: string): Promise<Probe> {
  let p = cache.get(path);
  if (!p) {
    p = (async () => {
      const r = await fetch(BASE + path, { redirect: "manual", headers: { "user-agent": UA } });
      const out: Probe = { status: r.status, location: r.headers.get("location") ?? "" };
      if (r.status === 200 && /text\/html/.test(r.headers.get("content-type") ?? "")) {
        const html = await r.text();
        const g = (re: RegExp) => decode((html.match(re) ?? [])[1] ?? "");
        out.canonical = g(/<link rel="canonical" href="([^"]*)"/i);
        out.lang = g(/<html[^>]*\blang="([^"]*)"/i);
        out.robots = g(/<meta name="robots" content="([^"]*)"/i);
        out.hreflangs = [...html.matchAll(/<link\b[^>]*>/gi)]
          .map((m) => m[0])
          .filter((tag) => /rel="alternate"/i.test(tag) && /hreflang=/i.test(tag))
          .map((tag) => `${(tag.match(/hreflang="([^"]+)"/i) ?? [])[1]}=${decode((tag.match(/href="([^"]+)"/i) ?? [])[1] ?? "")}`)
          .sort();
      }
      return out;
    })();
    cache.set(path, p);
  }
  return p;
}

async function pool<T>(items: T[], n: number, fn: (x: T) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const item = items[i++];
        try {
          await fn(item);
        } catch (e) {
          fail("HATA", `${JSON.stringify(item).slice(0, 120)}: ${(e as Error).message}`);
        }
      }
    }),
  );
}

const failures = new Map<string, string[]>();
const counts = new Map<string, number>();
const ok = (group: string) => counts.set(group, (counts.get(group) ?? 0) + 1);
function fail(group: string, msg: string) {
  const l = failures.get(group) ?? [];
  l.push(msg);
  failures.set(group, l);
}
const check = (group: string, cond: boolean, msg: string) => (cond ? ok(group) : fail(group, msg));

async function main() {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
  const rows = await prisma.redirect.findMany({ select: { id: true, sourcePath: true, destinationPath: true, statusCode: true, active: true } });
  await prisma.$disconnect();

  const sitemapXml = await (await fetch(BASE + "/sitemap.xml", { headers: { "user-agent": UA } })).text();
  const sitemap = [...sitemapXml.matchAll(/<url>([\s\S]*?)<\/url>/g)].map((m) => {
    const block = m[1];
    const loc = decode((block.match(/<loc>([^<]+)<\/loc>/) ?? [])[1] ?? "");
    const alts = [...block.matchAll(/<xhtml:link\b[^>]*>/g)]
      .map((a) => `${(a[0].match(/hreflang="([^"]+)"/) ?? [])[1]}=${decode((a[0].match(/href="([^"]+)"/) ?? [])[1] ?? "")}`)
      .sort();
    return { loc, path: pathOf(loc), alts };
  });
  const sitemapPaths = new Set(sitemap.map((s) => s.path));

  const pageRules = rows.filter((r) => r.active && !isAsset(r.destinationPath) && !/^https?:\/\//i.test(r.destinationPath));
  console.log(`Taban: ${BASE} · ${rows.length} satır (${rows.filter((r) => r.active).length} aktif; ${pageRules.length} sayfa kuralı) · sitemap ${sitemap.length} URL`);

  // ---- 1) statik kural denetimi ----
  const problems = checkRedirectTable(pageRules.map((r) => ({ id: r.id, source: r.sourcePath, destination: r.destinationPath, active: r.active })), sitemapPaths);
  ok("kural denetimi");
  counts.set("kural denetimi", pageRules.length - problems.length);
  for (const p of problems) for (const i of p.issues) fail(`KURAL ${i.code}`, `${p.source} -> ${p.destination}${i.suggestion ? `  (öneri: ${i.suggestion})` : ""}`);

  if (!STATIC_ONLY) {
    // ---- 2) HTTP: her redirect tek hop, birebir Location, hedef 200 + self-canonical ----
    await pool(pageRules, 6, async (r) => {
      const s = await get(normalizePath(r.sourcePath));
      const want = BASE + (r.destinationPath === "/" ? "" : r.destinationPath);
      const wantNorm = normalizePath(new URL(want).pathname + new URL(want).search);
      check("HTTP kaynak: kayıtlı durum kodu", s.status === r.statusCode, `${r.sourcePath}: ${s.status} (beklenen ${r.statusCode})`);
      const gotLoc = s.location ? normalizePath(new URL(s.location, BASE).pathname + new URL(s.location, BASE).search) : "";
      check("HTTP kaynak: Location hedefle birebir (tek hop)", gotLoc === wantNorm, `${r.sourcePath}: Location=${s.location} (beklenen ${wantNorm})`);
      const tp = pathOf(want);
      const t = await get(tp);
      check("HTTP hedef: doğrudan 200 (zincir/404 yok)", t.status === 200 && !t.location, `${r.sourcePath} -> ${tp}: ${t.status} ${t.location}`);
      if (t.status === 200) {
        check("HTTP hedef: self-canonical", pathOf(t.canonical || "/__yok__") === tp, `${r.sourcePath} -> ${tp}: canonical=${t.canonical}`);
        check("HTTP hedef: dil uyumu", t.lang === localeOfPath(tp), `${r.sourcePath} -> ${tp}: lang=${t.lang}`);
      }
      check("HTTP kaynak: kendine/döngüye yönlenmiyor", tp !== normalizePath(r.sourcePath), `${r.sourcePath} kendine yönleniyor`);
    });

    // ---- 3) HTTP: sitemap URL'leri ----
    const seen = new Set<string>();
    const sample = FULL
      ? sitemap
      : sitemap.filter((s, i) => {
          const parts = s.path.split("/").filter(Boolean);
          const key = `${localeOfPath(s.path)}|${parts[localeOfPath(s.path) === "en" ? 0 : 1] ?? "home"}`;
          const first = !seen.has(key);
          seen.add(key);
          return first || i % 12 === 0;
        });
    await pool(sample, 6, async (s) => {
      const d = await get(s.path);
      check("SITEMAP: doğrudan 200 (redirect yok)", d.status === 200 && !d.location, `${s.path}: ${d.status} ${d.location}`);
      if (d.status !== 200) return;
      check("SITEMAP: self-canonical", pathOf(d.canonical || "/__yok__") === s.path, `${s.path}: canonical=${d.canonical}`);
      check("SITEMAP: indekslenebilir (noindex yok)", !/noindex/i.test(d.robots ?? ""), `${s.path}: robots=${d.robots}`);
      check("SITEMAP: <html lang> yol diliyle uyumlu", d.lang === localeOfPath(s.path), `${s.path}: lang=${d.lang}`);
      if (s.alts.length) check("SITEMAP: sayfa hreflang kümesi = sitemap alternates", JSON.stringify(d.hreflangs) === JSON.stringify(s.alts), `${s.path}: sayfa=${(d.hreflangs ?? []).join(" ")} | sitemap=${s.alts.join(" ")}`);
    });
  }

  // ---- rapor ----
  let total = 0;
  console.log("");
  for (const [g, n] of [...counts].sort()) if (!failures.has(g)) console.log(`PASS  ${g}: ${n}`);
  for (const [g, l] of [...failures].sort()) {
    total += l.length;
    console.log(`FAIL  ${g}: ${l.length} hata${counts.get(g) ? ` (${counts.get(g)} geçti)` : ""}`);
    l.slice(0, 8).forEach((m) => console.log("        - " + m));
    if (l.length > 8) console.log(`        … ve ${l.length - 8} tane daha`);
  }
  console.log(`\nSONUÇ: ${total ? `${total} hata` : "TÜM DENETİMLER GEÇTİ"}${STATIC_ONLY ? " (yalnız statik)" : FULL ? " (sitemap tamamı)" : " (sitemap örneklemi)"}`);
  process.exitCode = total ? 1 : 0;
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
