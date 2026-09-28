/**
 * Rusça blog çevirileri (elle): prisma/migration/data/ru-blog/*.json — her kayıt { enSlug, title, excerpt, seoTitle, seoDescription, content }.
 * İngilizce yazının (kaynak: eski site, import-translations.ts) birebir Rusça çevirisidir; görsel yolları ve yapı korunur, kaynaktaki
 * bariz kusurlar (boş başlıklar, kopya bölüm, yazım artığı) çeviride giderilmiştir. Slug: Rusça başlığın Latin harfli karşılığı.
 * Yalnızca ekler/günceller (locale ru). Kullanım: npx tsx prisma/migration/import-ru-blog.ts [--apply]
 */
import "dotenv/config";
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const APPLY = process.argv.includes("--apply");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const RU_MAP: Record<string, string> = { а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh", з: "z", и: "i", й: "j", к: "k", л: "l", м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "c", ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu", я: "ya" };
const slugify = (s: string) => {
  const t = [...s.toLowerCase()].map((c) => RU_MAP[c] ?? c).join("").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return t.length > 80 ? t.slice(0, 80).replace(/-[^-]*$/, "") : t;
};

type Item = { enContent?: string; enSlug: string; title: string; excerpt: string; seoTitle: string; seoDescription: string; content: string };

async function main() {
  const dir = path.join(__dirname, "data", "ru-blog");
  const items: Item[] = readdirSync(dir).filter((f) => f.endsWith(".json")).sort().flatMap((f) => JSON.parse(readFileSync(path.join(dir, f), "utf8")));
  const used = new Set<string>();
  let n = 0;
  for (const it of items) {
    const en = await prisma.blogPostTranslation.findFirst({ where: { locale: "en", slug: it.enSlug }, select: { blogPostId: true } });
    if (!en) { console.log("YOK:", it.enSlug); continue; }
    let slug = slugify(it.title);
    if (used.has(slug)) slug += "-2";
    used.add(slug);
    const seoDescription = it.seoDescription.length > 160 ? it.seoDescription.slice(0, 157).replace(/\s+\S*$/, "") + "…" : it.seoDescription;
    console.log(slug, "|", it.content.length, "kr");
    if (!APPLY) continue;
    // Kaynak İngilizce gövde bozuksa (Türkçe metin) düzeltilmiş İngilizce gövde de yazılır
    if (it.enContent) await prisma.blogPostTranslation.update({ where: { blogPostId_locale: { blogPostId: en.blogPostId, locale: "en" } }, data: { content: it.enContent } });
    const data = { title: it.title, slug, excerpt: it.excerpt, content: it.content, seoTitle: it.seoTitle, seoDescription };
    await prisma.blogPostTranslation.upsert({ where: { blogPostId_locale: { blogPostId: en.blogPostId, locale: "ru" } }, create: { blogPostId: en.blogPostId, locale: "ru", ...data }, update: data });
    n++;
  }
  console.log(APPLY ? `yazıldı: ${n}` : "kuru çalıştırma");
}
main().finally(() => prisma.$disconnect());
