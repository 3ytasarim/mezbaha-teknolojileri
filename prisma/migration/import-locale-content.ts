/**
 * DE/FR/AR içerik çevirileri (elle): prisma/migration/data/loc/<dil>/<tür>-<parti>.json — her kayıt İngilizce satırın (enSlug) çevirisidir.
 * Türler: category | product | project | blog. Ürünlerde isteğe bağlı `specs: [{label, value}]`.
 * Slug: DE/FR için başlığın ASCII karşılığı (ä→ae, é→e…); AR için İngilizce slug (Latin harfli, bu dilde yaygın uygulama).
 * SEO alanları sınırlanır (başlık ≤ 70, açıklama ≤ 160). Yalnızca ekler/günceller. Kullanım: npx tsx prisma/migration/import-locale-content.ts <de|fr|ar> [--apply]
 */
import "dotenv/config";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const APPLY = process.argv.includes("--apply");
const locale = process.argv[2];
if (!["de", "fr", "ar"].includes(locale)) throw new Error("Dil: de | fr | ar");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const DE_MAP: Record<string, string> = { ä: "ae", ö: "oe", ü: "ue", ß: "ss" };
const FR_MAP: Record<string, string> = { é: "e", è: "e", ê: "e", ë: "e", à: "a", â: "a", ù: "u", û: "u", ü: "u", ô: "o", î: "i", ï: "i", ç: "c", œ: "oe", æ: "ae" };
const ASCII_MAP: Record<string, Record<string, string>> = { de: DE_MAP, fr: FR_MAP };
const slugify = (s: string) => {
  const map = ASCII_MAP[locale] ?? {};
  const t = [...s.toLowerCase()].map((c) => map[c] ?? c).join("").normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return t.length > 80 ? t.slice(0, 80).replace(/-[^-]*$/, "") : t;
};
const cut = (s: string | undefined, n: number) => (!s ? s : s.length > n ? s.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : s);

type Item = { enSlug: string; name?: string; title?: string; shortDescription?: string; description?: string; applications?: string; features?: string; excerpt?: string; content?: string; seoTitle?: string; seoDescription?: string; specs?: { label: string; value: string }[] };

function load(kind: string): Item[] {
  const dir = path.join(__dirname, "data", "loc", locale);
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.startsWith(kind + "-") && f.endsWith(".json")).sort().flatMap((f) => JSON.parse(readFileSync(path.join(dir, f), "utf8")) as Item[]);
}

const slugFor = (it: Item, used: Set<string>) => {
  let slug = locale === "de" || locale === "fr" ? slugify((it.name ?? it.title) as string) : it.enSlug;
  if (!slug) slug = it.enSlug;
  while (used.has(slug)) slug += "-2";
  used.add(slug);
  return slug;
};

async function main() {
  let n = 0;
  const used = { category: new Set<string>(), product: new Set<string>(), project: new Set<string>(), blog: new Set<string>() };

  for (const it of load("category")) {
    const en = await prisma.productCategoryTranslation.findFirst({ where: { locale: "en", slug: it.enSlug }, select: { categoryId: true } });
    if (!en) { console.log("YOK category:", it.enSlug); continue; }
    const data = { name: it.name!, slug: slugFor(it, used.category), shortDescription: it.shortDescription, description: it.description, seoTitle: cut(it.seoTitle, 70), seoDescription: cut(it.seoDescription, 160) };
    console.log("category", data.slug);
    if (APPLY) await prisma.productCategoryTranslation.upsert({ where: { categoryId_locale: { categoryId: en.categoryId, locale } }, create: { categoryId: en.categoryId, locale, ...data }, update: data });
    n++;
  }

  for (const it of load("product")) {
    const en = await prisma.productTranslation.findFirst({ where: { locale: "en", slug: it.enSlug }, select: { productId: true } });
    if (!en) { console.log("YOK product:", it.enSlug); continue; }
    const data = { name: it.name!, slug: slugFor(it, used.product), shortDescription: it.shortDescription, description: it.description, applications: it.applications, features: it.features, seoTitle: cut(it.seoTitle, 70), seoDescription: cut(it.seoDescription, 160) };
    console.log("product", data.slug);
    if (APPLY) {
      await prisma.productTranslation.upsert({ where: { productId_locale: { productId: en.productId, locale } }, create: { productId: en.productId, locale, ...data }, update: data });
      if (it.specs?.length) {
        await prisma.productSpecification.deleteMany({ where: { productId: en.productId, locale } });
        await prisma.productSpecification.createMany({ data: it.specs.map((s, i) => ({ productId: en.productId, locale, label: s.label, value: s.value, sortOrder: i })) });
      }
    }
    n++;
  }

  for (const it of load("project")) {
    const en = await prisma.projectTranslation.findFirst({ where: { locale: "en", slug: it.enSlug }, select: { projectId: true } });
    if (!en) { console.log("YOK project:", it.enSlug); continue; }
    const data = { name: it.name!, slug: slugFor(it, used.project), shortDescription: it.shortDescription, description: it.description, seoTitle: cut(it.seoTitle, 70), seoDescription: cut(it.seoDescription, 160) };
    console.log("project", data.slug);
    if (APPLY) await prisma.projectTranslation.upsert({ where: { projectId_locale: { projectId: en.projectId, locale } }, create: { projectId: en.projectId, locale, ...data }, update: data });
    n++;
  }

  for (const it of load("blog")) {
    const en = await prisma.blogPostTranslation.findFirst({ where: { locale: "en", slug: it.enSlug }, select: { blogPostId: true } });
    if (!en) { console.log("YOK blog:", it.enSlug); continue; }
    const data = { title: it.title!, slug: slugFor(it, used.blog), excerpt: it.excerpt, content: it.content, seoTitle: cut(it.seoTitle, 70), seoDescription: cut(it.seoDescription, 160) };
    console.log("blog", data.slug, "|", it.content?.length ?? 0, "kr");
    if (APPLY) await prisma.blogPostTranslation.upsert({ where: { blogPostId_locale: { blogPostId: en.blogPostId, locale } }, create: { blogPostId: en.blogPostId, locale, ...data }, update: data });
    n++;
  }
  console.log(APPLY ? `yazıldı: ${n}` : `kuru çalıştırma: ${n}`);
}
main().finally(() => prisma.$disconnect());
