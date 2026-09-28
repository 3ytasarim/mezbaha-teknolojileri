/** Phase 11C: mevcut blog çevirilerindeki hotlink görselleri yerel kopyalara çevirir. Idempotent. */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { loadImageMap, localizeBodyImages } from "./localize-images";

const DRY = process.argv.includes("--dry-run");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const map = loadImageMap();
  const rows = await prisma.blogPostTranslation.findMany({ include: { blogPost: { select: { slug: true } } } });
  let touched = 0, replaced = 0;
  const missing: string[] = [];
  for (const r of rows) {
    if (!r.content) continue;
    const res = await localizeBodyImages(r.content, map);
    missing.push(...res.missing.map((m) => r.blogPost.slug + " -> " + m));
    if (res.replaced === 0) continue;
    touched++;
    replaced += res.replaced;
    if (!DRY) await prisma.blogPostTranslation.update({ where: { id: r.id }, data: { content: res.html } });
  }
  console.log(JSON.stringify({ mode: DRY ? "dry-run" : "applied", mapEntries: map.size, postsChanged: touched, imagesLocalized: replaced, missingLocalCopy: missing }, null, 1));
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
