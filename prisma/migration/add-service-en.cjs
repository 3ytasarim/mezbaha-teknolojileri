/**
 * Tek hizmet sayfasının ("Endüstriyel Soğutma Sistemleri") eksik İngilizce çevirisini ekler.
 * Kaynak Türkçe metnin sadık çevirisi; yeni hizmet/iddia uydurulmadı. "abattoir" eş anlamlısı
 * doğal biçimde iki noktada kullanıldı (SEO audit madde 11).
 * Kullanım: node prisma/migration/add-service-en.cjs [--apply]
 */
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const APPLY = process.argv.includes("--apply");

const EN = {
  title: "Industrial Cooling Systems",
  slug: "industrial-cooling-systems",
  seoTitle: "Industrial Cooling Systems",
  seoDescription: "Industrial cooling systems for slaughterhouses and meat processing plants: cold room and carcass chilling solutions. Contact us for a quote.",
  content: `<p>Industrial cooling systems are the high-quality, long-lasting refrigeration solutions preferred by companies today. In the past, cooling systems could not provide protection for very long periods, but with today's technological advances, hygienic environments with a much longer service life can now be created. This is especially important in the food industry, where these cooling units deliver the highest-quality refrigeration at the most competitive price. The quality of a cooling system is critical for preserving and shipping food products. Products such as meat, in particular, must be kept under strict control with high-quality refrigeration equipment and systems. The cooling units used in slaughterhouses where cattle and small ruminants are processed must meet the same standards, since meat that is slaughtered warm has to rest after bleeding and hide removal before it is either delivered to the customer or placed into cold storage. All materials used in cooling systems must be built to be durable, because even a minor breakdown can spoil tons of meat. To prevent this, cooling units equipped with extra safety features provide a much more reliable service.</p>
<h2>Quality Standards for Industrial Cooling Systems</h2>
<p>Industrial cooling systems must operate within the standards set out in relevant laws and regulations. Since these systems are used to preserve foods such as meat, they need to run reliably and provide service 24 hours a day, 7 days a week. At the same time, energy consumption is a key factor in industrial cooling equipment. Units that have to run continuously are typically used in warehouses and production facilities. Despite operating at very high capacity, these units are built from the highest-quality materials to ensure a long service life, allowing them to serve abattoirs reliably for many years.</p>
<h2>Industrial Cooling Systems and Noise Levels</h2>
<p>The latest technologies are used to minimise noise during the operation of industrial cooling systems. To keep meat stored after slaughter in the best possible condition, these continuously running cooling systems are insulated to achieve the lowest possible noise level. Backed by a warranty, these units are built to offer a very long service life. Highly practical from a customer-satisfaction standpoint, these cooling systems can also be operated easily through a simple interface. They are, moreover, manufactured to suit any type of slaughterhouse or abattoir facility.</p>`,
};

async function main() {
  const page = await prisma.page.findFirst({ where: { slug: "endustriyel-sogutma-sistemleri" } });
  if (!page) { console.log("Sayfa bulunamadı."); return; }

  const existing = await prisma.pageTranslation.findUnique({ where: { pageId_locale: { pageId: page.id, locale: "en" } } });
  console.log(existing ? "EN çeviri zaten var, üzerine yazılacak." : "EN çeviri yok, oluşturulacak.");
  console.log(JSON.stringify(EN, null, 1).slice(0, 300) + "...");

  if (!APPLY) { console.log("\nKuru çalıştırma. Uygulamak için --apply"); return; }

  await prisma.pageTranslation.upsert({
    where: { pageId_locale: { pageId: page.id, locale: "en" } },
    create: { pageId: page.id, locale: "en", ...EN },
    update: EN,
  });
  console.log("yazıldı.");
}

main().finally(() => prisma.$disconnect());
