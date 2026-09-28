/**
 * Phase 11C: SALT-OKUNUR editoryal raporlar. DB'ye HİÇBİR ŞEY YAZMAZ.
 *  - docs/editorial-review.md        : uzun title'lar + BÜYÜK HARF ürün adları (öneriler yalnızca öneri)
 *  - docs/featured-content-review.md : öne çıkan içerik + ana sayfa top-up + adaylar
 */
import "dotenv/config";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { cleanTitle } from "../../src/lib/seo/metadata";
import { SITE_NAME } from "../../src/lib/seo/site";

const ROOT = path.join(__dirname, "..", "..");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const SUFFIX = " | " + SITE_NAME;
const BUDGET = 70 - SUFFIX.length; // şablon dahil ≤70 için ham başlık bütçesi

const prov = new Map<string, string>(
  (JSON.parse(readFileSync(path.join(ROOT, "docs", "migration-provenance.json"), "utf-8")).records as { entityType: string; slug: string; sourceUrl: string }[]).map((r) => [r.entityType + ":" + r.slug, r.sourceUrl])
);

function suggestTitle(raw: string): string {
  const t = cleanTitle(raw);
  if (t.length <= BUDGET) return t;
  const parts = t.split(/\s+[-–—|:]\s+/);
  let acc = "";
  for (const p of parts) {
    const next = acc ? acc + " – " + p : p;
    if (next.length > BUDGET) break;
    acc = next;
  }
  if (acc) return acc;
  const cut = t.slice(0, BUDGET + 1);
  return cut.slice(0, Math.max(cut.lastIndexOf(" "), 10)).replace(/[\s,;:–—-]+$/, "");
}

function titleCaseTr(s: string): string {
  return s
    .toLocaleLowerCase("tr")
    .split(" ")
    .map((w) => (w ? w[0].toLocaleUpperCase("tr") + w.slice(1) : w))
    .join(" ");
}

const isAllCaps = (s: string) => s.length > 3 && s === s.toLocaleUpperCase("tr") && s !== s.toLocaleLowerCase("tr");
const esc = (s: string) => s.split("|").join("\\|");

async function main() {
  const [products, posts, projects] = await Promise.all([
    prisma.product.findMany({
      where: { status: "PUBLISHED" },
      include: { translations: { where: { locale: "tr" } }, category: { include: { translations: { where: { locale: "tr" } } } } },
      orderBy: { slug: "asc" },
    }),
    prisma.blogPost.findMany({ where: { status: "PUBLISHED" }, include: { translations: { where: { locale: "tr" } } }, orderBy: { slug: "asc" } }),
    prisma.project.findMany({ where: { status: "PUBLISHED" }, include: { translations: { where: { locale: "tr" } } }, orderBy: { slug: "asc" } }),
  ]);

  type Row = { type: string; page: string; current: string; rendered: number; source: string; suggestion: string };
  const long: Row[] = [];
  const consider = (type: string, slug: string, seoTitle: string | null | undefined, name: string, page: string) => {
    const raw = seoTitle || name;
    const rendered = cleanTitle(raw).length + SUFFIX.length;
    if (rendered > 70) long.push({ type, page, current: raw, rendered, source: prov.get(type + ":" + slug) ?? "-", suggestion: suggestTitle(raw) });
  };
  for (const p of products) consider("product", p.slug, p.translations[0]?.seoTitle, p.translations[0]?.name ?? p.slug, "/urun/" + p.slug);
  for (const b of posts) consider("blogPost", b.slug, b.translations[0]?.seoTitle, b.translations[0]?.title ?? b.slug, "/blog/" + b.slug);
  for (const j of projects) consider("project", j.slug, j.translations[0]?.seoTitle, j.translations[0]?.name ?? j.slug, "/projeler/" + j.slug);

  const caps = products
    .map((p) => ({ slug: p.slug, name: p.translations[0]?.name ?? p.slug, source: prov.get("product:" + p.slug) ?? "-" }))
    .filter((p) => isAllCaps(p.name))
    .map((p) => ({ ...p, suggestion: titleCaseTr(p.name) }));

  writeFileSync(
    path.join(ROOT, "docs", "editorial-review.md"),
    [
      "# Editorial Review (Phase 11C)",
      "",
      "> **Bu raporda yazılı tüm öneriler yalnızca ÖNERİDİR.** Otomatik üretildi, editör onayı gerekir; DB'ye HİÇBİR şey yazılmadı. Orijinal (kaynak) değerler DB'de aynen duruyor.",
      "",
      "Şablonla (`%s" + SUFFIX + "`) render edilen title uzunluğu >70 olanlar: **" + long.length + "**. Öneri bütçesi: ham başlık ≤ " + BUDGET + " karakter (arama sonucunda kısalmasın diye).",
      "",
      "## Uzun title'lar",
      "",
      "| Tür | Sayfa | Mevcut title (ham) | Render uzunluğu | Kaynak URL | ÖNERİ (onaysız) |",
      "|---|---|---|---|---|---|",
      ...long.map((r) => "| " + r.type + " | " + r.page + " | " + esc(r.current) + " | " + r.rendered + " | " + r.source + " | " + esc(r.suggestion) + " (" + (r.suggestion.length + SUFFIX.length) + ") |"),
      "",
      "## BÜYÜK HARF ürün adları (" + caps.length + ")",
      "",
      "| Slug | Mevcut ad | Kaynak URL | ÖNERİ (onaysız) |",
      "|---|---|---|---|",
      ...caps.map((r) => "| " + r.slug + " | " + esc(r.name) + " | " + r.source + " | " + esc(r.suggestion) + " |"),
      "",
      'Not: Öneriler mekanik (ayraçta kısaltma / Türkçe başlık biçimi). Marka/model adları (ör. "KURBAN PRO") bilinçli büyük harf olabilir — editör kararı.',
    ].join("\n"),
    "utf-8"
  );

  // ---------- Featured ----------
  const featP = products.filter((p) => p.featured);
  const featB = posts.filter((p) => p.featured);
  const featJ = projects.filter((p) => p.featured);
  const homeP = [...products]
    .sort((a, b) => Number(b.featured) - Number(a.featured) || a.sortOrder - b.sortOrder || Number(!!b.coverImage) - Number(!!a.coverImage) || a.createdAt.getTime() - b.createdAt.getTime())
    .slice(0, 6);
  const homeB = [...posts]
    .sort((a, b) => Number(b.featured) - Number(a.featured) || (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0) || b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, 3);
  const pname = (p: (typeof products)[number]) =>
    (p.translations[0]?.name ?? p.slug) + " (`" + p.slug + "`, " + (p.category.translations[0]?.name ?? p.category.slug) + (p.coverImage ? "" : ", GÖRSEL YOK") + ")";
  const bname = (b: (typeof posts)[number]) => (b.translations[0]?.title ?? b.slug) + " (`" + b.slug + "`, " + (b.publishedAt?.toISOString().slice(0, 10) ?? "tarih yok") + ")";
  const candP = products.filter((p) => !p.featured && p.coverImage && (p.translations[0]?.description?.length ?? 0) > 800);

  writeFileSync(
    path.join(ROOT, "docs", "featured-content-review.md"),
    [
      "# Featured Content Review (Phase 11C)",
      "",
      "Salt-okunur. **Hiçbir featured bayrağı değiştirilmedi.** Nihai editoryal seçim sizde.",
      "",
      "## Şu an `featured=true`",
      "",
      "### Ürünler (" + featP.length + ")",
      ...featP.map((p) => "- " + pname(p)),
      "",
      "### Yazılar (" + featB.length + ")",
      ...featB.map((b) => "- " + bname(b)),
      "",
      "### Referans projeler (" + featJ.length + ")",
      ...featJ.map((j) => "- " + (j.translations[0]?.name ?? j.slug) + " (`" + j.slug + "`)"),
      "",
      "## Ana sayfada şu an görünenler (featured + otomatik top-up)",
      "",
      "Sıralama: featured önce → sortOrder → görseli olanlar → eski kayıt. `top-up` = featured olmadığı halde kontenjanı doldurduğu için gösterilen.",
      "",
      "### Ürünler (6 slot)",
      ...homeP.map((p) => "- " + (p.featured ? "**featured**" : "top-up") + ": " + pname(p)),
      "",
      "### Yazılar (3 slot)",
      ...homeB.map((b) => "- " + (b.featured ? "**featured**" : "top-up") + ": " + bname(b)),
      "",
      "## Aday ürünler (featured değil, görseli var, açıklaması >800 karakter): " + candP.length,
      "",
      ...candP.slice(0, 30).map((p) => "- " + pname(p)),
      "",
      "## Aday yazılar (en yeni 10, tarihli)",
      "",
      ...[...posts]
        .filter((b) => b.publishedAt)
        .sort((a, b) => b.publishedAt!.getTime() - a.publishedAt!.getTime())
        .slice(0, 10)
        .map((b) => "- " + (b.featured ? "(featured) " : "") + bname(b)),
    ].join("\n"),
    "utf-8"
  );

  console.log(
    JSON.stringify({
      longTitles: long.length,
      byType: long.reduce((a: Record<string, number>, r) => ((a[r.type] = (a[r.type] || 0) + 1), a), {}),
      allCaps: caps.length,
      featured: { p: featP.length, b: featB.length, j: featJ.length },
      homeTopUpProducts: homeP.filter((p) => !p.featured).length,
      homeTopUpPosts: homeB.filter((p) => !p.featured).length,
    })
  );
}
main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
