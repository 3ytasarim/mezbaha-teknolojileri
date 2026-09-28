/**
 * EN/RU çevirilerinde 160 karakteri aşan SEO açıklamalarını cümle/sözcük sınırında kısaltır (yalnızca locale en/ru).
 * Kaynak sitedeki uzun açıklamalar olduğu gibi aktarılmıştı; bu betik yalnızca sınırı aşanlara dokunur. İdempotent.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const MAX = 160;

function trim(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  let out = "";
  for (const s of sentences) {
    if ((out + " " + s).trim().length > MAX) break;
    out = (out + " " + s).trim();
  }
  if (out.length >= 70) return out;
  const cut = text.slice(0, MAX - 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:\s-]+$/, "") + "…";
}

async function main() {
  const models = [prisma.productTranslation, prisma.productCategoryTranslation, prisma.blogPostTranslation, prisma.projectTranslation] as const;
  let n = 0;
  for (const model of models) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const m = model as any;
    const rows = await m.findMany({ where: { locale: { in: ["en", "ru"] } }, select: { id: true, seoDescription: true } });
    for (const r of rows) {
      if (r.seoDescription && r.seoDescription.length > MAX) {
        await m.update({ where: { id: r.id }, data: { seoDescription: trim(r.seoDescription) } });
        n++;
      }
    }
  }
  console.log("kısaltılan SEO açıklaması:", n);
}
main().finally(() => prisma.$disconnect());
