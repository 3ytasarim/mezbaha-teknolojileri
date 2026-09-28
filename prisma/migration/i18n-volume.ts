import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const len = (r: Record<string, unknown>) => Object.values(r).reduce<number>((a, v) => a + (typeof v === "string" ? v.length : 0), 0);
async function main() {
  const sets: [string, Record<string, unknown>[]][] = [
    ["category", await prisma.productCategoryTranslation.findMany({ where: { locale: "en" } })],
    ["product", await prisma.productTranslation.findMany({ where: { locale: "en" } })],
    ["project", await prisma.projectTranslation.findMany({ where: { locale: "en" } })],
    ["blogcat", await prisma.blogCategoryTranslation.findMany({ where: { locale: "en" } })],
    ["blog", await prisma.blogPostTranslation.findMany({ where: { locale: "en" } })],
    ["page", await prisma.pageTranslation.findMany({ where: { locale: "en" } })],
  ];
  for (const [k, rows] of sets) console.log(k, rows.length, "rows,", Math.round(rows.reduce((a, r) => a + len(r), 0) / 1000), "KB");
  await prisma.$disconnect();
}
main();
