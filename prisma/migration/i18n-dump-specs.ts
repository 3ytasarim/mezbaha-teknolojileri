import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const out = path.join(process.env.TEMP ?? ".", "loc");
async function main() {
  const trs = await prisma.productTranslation.findMany({ where: { locale: "en" }, select: { productId: true, slug: true } });
  const specs = await prisma.productSpecification.findMany({ where: { locale: "en" }, orderBy: { sortOrder: "asc" } });
  const prod = JSON.parse(readFileSync(path.join(out, "product.json"), "utf8")) as Record<string, unknown>[];
  const bySlug = new Map(trs.map((t) => [t.slug, t.productId]));
  for (const p of prod) p.specs = specs.filter((s) => s.productId === bySlug.get(p.slug as string)).map((s) => ({ label: s.label, value: s.value }));
  writeFileSync(path.join(out, "product.json"), JSON.stringify(prod, null, 1));
  console.log("specs", specs.length, "products with specs", prod.filter((p) => (p.specs as unknown[]).length).length);
  await prisma.$disconnect();
}
main();
