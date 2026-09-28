/**
 * Menü Yönetimi'ndeki kayıtlara "Referanslar" bağlantısını ekler: üst menü (sol) ve alt bilgi Kurumsal sütununda
 * "Projeler"den hemen sonra. Kayıtlı menü varsa sitede varsayılanlar değil kayıtlar görünür; bu betik onları günceller.
 * İdempotent. Kullanım: npx tsx prisma/migration/add-referanslar-menu.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  for (const location of ["header-left", "footer-kurumsal"]) {
    const rows = await prisma.navigationItem.findMany({ where: { location, parentId: null }, orderBy: { sortOrder: "asc" } });
    if (rows.length === 0) {
      console.log(location, "kayıt yok (varsayılan menü kullanılıyor) — atlandı");
      continue;
    }
    if (rows.some((r) => r.url === "/referanslar")) {
      console.log(location, "zaten var");
      continue;
    }
    const after = rows.findIndex((r) => r.url === "/projeler");
    const at = after >= 0 ? after + 1 : rows.length;
    const ids = rows.map((r) => r.id);
    await prisma.$transaction([
      ...rows.slice(at).map((r, i) => prisma.navigationItem.update({ where: { id: r.id }, data: { sortOrder: at + 1 + i } })),
      prisma.navigationItem.create({ data: { location, label: "Referanslar", url: "/referanslar", sortOrder: at, active: true } }),
    ]);
    console.log(location, "→ Referanslar eklendi (sıra", at + ")", ids.length, "→", ids.length + 1);
  }
}

main().finally(() => prisma.$disconnect());
