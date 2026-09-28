import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const out = path.join(process.env.TEMP ?? ".", "loc");
async function main() {
  mkdirSync(out, { recursive: true });
  const strip = ({ id, productId, projectId, categoryId, blogPostId, locale, ...r }: Record<string, unknown>) => r;
  writeFileSync(path.join(out, "category.json"), JSON.stringify((await prisma.productCategoryTranslation.findMany({ where: { locale: "en" }, orderBy: { slug: "asc" } })).map(strip), null, 1));
  writeFileSync(path.join(out, "product.json"), JSON.stringify((await prisma.productTranslation.findMany({ where: { locale: "en" }, orderBy: { slug: "asc" } })).map(strip), null, 1));
  writeFileSync(path.join(out, "project.json"), JSON.stringify((await prisma.projectTranslation.findMany({ where: { locale: "en" }, orderBy: { slug: "asc" } })).map(strip), null, 1));
  writeFileSync(path.join(out, "blog.json"), JSON.stringify((await prisma.blogPostTranslation.findMany({ where: { locale: "en" }, orderBy: { slug: "asc" } })).map(strip), null, 1));
  console.log("ok", out);
  await prisma.$disconnect();
}
main();
