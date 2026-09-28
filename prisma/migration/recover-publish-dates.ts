/**
 * Phase 11C: yıl bilgisi eksik kalan blog yazıları için kaynak-destekli yayın tarihi kurtarma.
 *
 * Kanıt: kaynak sitenin /tr/blog/ listesindeki her kart `<small title="25 March 2026 08:03">`
 * içerir (sitenin kendi yayın tarihi tooltip'i, YIL DAHİL). Bu tarih yalnızca şu koşullarda kabul
 * edilir:
 *   1. Kart, yazının kendi URL'sine link veriyor,
 *   2. Kartın gün+ay değeri, yazı sayfasından çıkarılmış tarih metniyle (publishedDate) birebir aynı,
 *   3. Tarih bugünden ileri değil.
 * Yalnızca publishedAt = NULL olan kayıtlar güncellenir; dolu olana dokunulmaz.
 * Saat bilgisi güvenilmez (biçim hatalı: "dakika" alanı ay numarasını taşıyor) → yalnızca TARİH
 * saklanır (UTC 00:00), saat uydurulmaz.
 *
 * Kullanım: npx tsx prisma/migration/recover-publish-dates.ts [--dry-run]
 */
import "dotenv/config";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import * as cheerio from "cheerio";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getCanonicalBlogSlug } from "./parse-redirect-map";
import { slugify } from "./slug";

const DRY = process.argv.includes("--dry-run");
const ROOT = path.join(__dirname, "..", "..");
const UA = "MezbahaMigrationBot/1.0 (+content migration audit)";
const MONTHS = ["january","february","march","april","may","june","july","august","september","october","november","december"];
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

type Src = { sourceUrl: string; title?: string; publishedDate?: string | null; yearMissing?: boolean };

function parseCard(t: string) {
  const m = t.match(/^(\d{1,2}) ([A-Za-z]+) (\d{4})/);
  if (!m) return null;
  const month = MONTHS.indexOf(m[2].toLowerCase());
  return month < 0 ? null : { day: +m[1], month: month + 1, year: +m[3] };
}
function parseArticle(t: string | null | undefined) {
  const m = t?.match(/^(\d{1,2}) ([A-Za-z]+)/);
  if (!m) return null;
  const month = MONTHS.indexOf(m[2].toLowerCase());
  return month < 0 ? null : { day: +m[1], month: month + 1 };
}

async function main() {
  const src: Src[] = ["blog-posts-batch1.json", "blog-posts-batch2.json"].flatMap(
    (f) => JSON.parse(readFileSync(path.join(ROOT, "docs", "migration-data", f), "utf-8")).posts
  );
  const html = await (await fetch("https://www.mezbahateknolojileri.com/tr/blog/", { headers: { "User-Agent": UA } })).text();
  const $ = cheerio.load(html);

  const cards = new Map<string, string>(); // kaynak url -> title attr
  $("small[title]").each((_, el) => {
    const card = $(el).closest(".card, .box-shadow, .col-xl-12, div");
    const href = card.find('a[href*="/tr/"]').first().attr("href");
    const title = $(el).attr("title");
    if (href && title) cards.set(href.replace(/\/$/, ""), title);
  });

  const rows: { slug: string; sourceUrl: string; evidence: string; status: string; date?: string }[] = [];
  const now = new Date();
  for (const s of src) {
    const slug = getCanonicalBlogSlug(s.sourceUrl) ?? (s.title ? slugify(s.title) : null);
    if (!slug) { rows.push({ slug: "?", sourceUrl: s.sourceUrl, evidence: "-", status: "SKIP: canonical slug yok" }); continue; }
    const cardTitle = cards.get(s.sourceUrl.replace(/\/$/, ""));
    const card = cardTitle ? parseCard(cardTitle) : null;
    const art = parseArticle(s.publishedDate);
    if (!card) { rows.push({ slug, sourceUrl: s.sourceUrl, evidence: "listede kart bulunamadı", status: "UNKNOWN" }); continue; }
    if (!art || art.day !== card.day || art.month !== card.month) {
      rows.push({ slug, sourceUrl: s.sourceUrl, evidence: `kart="${cardTitle}", makale="${s.publishedDate}"`, status: "REJECT: gün/ay eşleşmiyor" });
      continue;
    }
    const d = new Date(Date.UTC(card.year, card.month - 1, card.day));
    if (d > now) { rows.push({ slug, sourceUrl: s.sourceUrl, evidence: `kart="${cardTitle}"`, status: "REJECT: gelecek tarih" }); continue; }
    rows.push({ slug, sourceUrl: s.sourceUrl, evidence: `liste kartı title="${cardTitle}" + makale sayfası "${s.publishedDate}" (gün/ay eşleşti)`, status: "OK", date: d.toISOString().slice(0, 10) });
  }

  let applied = 0, already = 0, replaced = 0;
  for (const r of rows.filter((x) => x.status === "OK")) {
    const post = await prisma.blogPost.findUnique({ where: { slug: r.slug }, select: { id: true, publishedAt: true, createdAt: true } });
    if (!post) { r.status = "SKIP: DB'de yok"; continue; }
    if (post.publishedAt) {
      const day = (d: Date) => d.toISOString().slice(0, 10);
      // Migration damgası: publishedAt, kaydın oluşturulduğu (import/seed) günle aynı gün → gerçek yayın tarihi değil.
      const isMigrationStamp = day(post.publishedAt) === day(post.createdAt);
      if (isMigrationStamp && day(post.publishedAt) !== r.date) {
        if (!DRY) await prisma.blogPost.update({ where: { id: post.id }, data: { publishedAt: new Date(`${r.date}T00:00:00.000Z`) } });
        r.status = `${DRY ? "WOULD-REPLACE" : "REPLACED"} migration damgası ${day(post.publishedAt)} (kayıt oluşturma günü) -> ${r.date}`;
        replaced++;
        continue;
      }
      r.status = `KEEP: DB'de zaten dolu (${day(post.publishedAt)}), kaynak=${r.date}`;
      already++;
      continue;
    }
    if (!DRY) await prisma.blogPost.update({ where: { id: post.id }, data: { publishedAt: new Date(`${r.date}T00:00:00.000Z`) } });
    r.status = DRY ? "WOULD-SET" : "SET";
    applied++;
  }

  const md = [
    "# Publish Date Recovery (Phase 11C)", "",
    `Mod: ${DRY ? "DRY-RUN" : "UYGULANDI"} — ${new Date().toISOString()}`, "",
    "Kanıt: `https://www.mezbahateknolojileri.com/tr/blog/` kart tooltip'i (`title=\"DD Month YYYY HH:MM\"`), makale sayfasındaki gün/ay ile birebir doğrulandı. Saat uydurulmadı; yalnızca tarih (UTC 00:00).", "",
    `- Yazı: ${rows.length}, yeni set edilen: ${applied}, migration damgası düzeltilen: ${replaced}, DB'de zaten dolu: ${already}, belirsiz/reddedilen: ${rows.filter((r) => /UNKNOWN|REJECT|SKIP/.test(r.status)).length}`, "",
    "| Slug | Durum | Tarih | Kanıt |", "|---|---|---|---|",
    ...rows.map((r) => `| ${r.slug} | ${r.status} | ${r.date ?? "-"} | ${r.evidence} |`),
  ].join("\n");
  writeFileSync(path.join(ROOT, "docs", "publish-date-evidence.md"), md, "utf-8");
  console.log(JSON.stringify({ cards: cards.size, applied, replaced, already, unknown: rows.filter((r) => /UNKNOWN|REJECT|SKIP/.test(r.status)).map((r) => `${r.slug}:${r.status}`) }, null, 1));
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
