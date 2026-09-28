/** Phase 11C: ölü iç linkleri (link-overrides.ts) mevcut blog çevirilerinde düzeltir. Idempotent. */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { applyDeadLinkOverrides } from "./link-overrides";

const DRY = process.argv.includes("--dry-run");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const rows = await prisma.blogPostTranslation.findMany({ include: { blogPost: { select: { slug: true } } } });
  let touched = 0;
  for (const r of rows) {
    if (!r.content) continue;
    const { html, changes } = applyDeadLinkOverrides(r.content);
    if (changes.length === 0) continue;
    touched++;
    console.log(`${r.blogPost.slug}: ${changes.join("; ")}`);
    if (!DRY) await prisma.blogPostTranslation.update({ where: { id: r.id }, data: { content: html } });
  }
  // Ürün açıklamalarındaki eski ana sayfa linkleri
  const prods = await prisma.productTranslation.findMany({ include: { product: { select: { slug: true } } } });
  for (const r of prods) {
    if (!r.description) continue;
    const { html, changes } = applyDeadLinkOverrides(r.description);
    if (changes.length === 0) continue;
    touched++;
    console.log(`product ${r.product.slug}: ${changes.join("; ")}`);
    if (!DRY) await prisma.productTranslation.update({ where: { id: r.id }, data: { description: html } });
  }
  console.log(`${DRY ? "[DRY] " : ""}Etkilenen çeviri: ${touched}`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
