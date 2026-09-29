/**
 * Eski katalog URL'sini (2018, artık yok) yeni 2024 kataloğuna 301 yönlendirir.
 * Kullanım: node prisma/migration/redirect-old-catalog.cjs [--apply]
 */
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const APPLY = process.argv.includes("--apply");

const REDIRECTS = [
  { sourcePath: "/catalogs/2018-mezbaha-sistemleri-katalog", destinationPath: "/catalogs/2024-mezbaha-teknolojileri-katalog" },
  { sourcePath: "/tr/kataloglar/2018-mezbaha-sistemleri-katalog", destinationPath: "/tr/kataloglar/2024-mezbaha-teknolojileri-katalog" },
];

async function main() {
  for (const r of REDIRECTS) {
    const existing = await prisma.redirect.findUnique({ where: { sourcePath: r.sourcePath } });
    console.log(`${APPLY ? "YAZILIYOR" : "[kuru]"} ${r.sourcePath} -> ${r.destinationPath} (${existing ? "güncellenecek" : "yeni"})`);
    if (!APPLY) continue;
    await prisma.redirect.upsert({
      where: { sourcePath: r.sourcePath },
      create: { sourcePath: r.sourcePath, destinationPath: r.destinationPath, statusCode: 301, active: true },
      update: { destinationPath: r.destinationPath, statusCode: 301, active: true },
    });
  }
  if (!APPLY) console.log("\nKuru çalıştırma. Uygulamak için --apply");
  else console.log("\nyazıldı.");
}

main().finally(() => prisma.$disconnect());
