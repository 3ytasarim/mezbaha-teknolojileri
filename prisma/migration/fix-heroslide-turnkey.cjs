/**
 * Ana sayfa hero slider'ındaki ilk slaytın başlığı/alt metni "Anahtar Teslim" ve "uçtan uca / devreye alma"
 * ifadeleri içeriyordu — daha önce sitenin geri kalanından (sözlükler, home-seo.json) kaldırılan, müşterinin
 * "bizde yok" dediği aynı iddialar. Dictionary'deki (tr.ts home.hero) düzeltmeyle birebir aynı metne çekilir.
 * Kullanım: node prisma/migration/fix-heroslide-turnkey.cjs [--apply]
 */
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const APPLY = process.argv.includes("--apply");

const NEW = {
  title: "Mezbaha ve Et İşleme Sistemlerinde Mühendislik ve İmalat",
  subtitle: "Kesim hücrelerinden soğuk oda sistemlerine — büyükbaş ve küçükbaş üretim hatları için mühendislik ve imalat çözümleri.",
};

async function main() {
  const row = await prisma.heroSlide.findFirst({ where: { title: { contains: "Anahtar Teslim" } } });
  if (!row) { console.log("Bulunamadı (zaten düzeltilmiş olabilir)."); return; }

  console.log("Mevcut:", JSON.stringify({ title: row.title, subtitle: row.subtitle }, null, 1));
  console.log("Yeni:  ", JSON.stringify(NEW, null, 1));

  if (!APPLY) { console.log("\nKuru çalıştırma. Uygulamak için --apply"); return; }

  await prisma.heroSlide.update({ where: { id: row.id }, data: NEW });
  console.log("yazıldı.");
}

main().finally(() => prisma.$disconnect());
