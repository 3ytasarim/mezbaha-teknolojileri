/**
 * Google'ın indexlediği eski URL'lerle ilgili iki sorunu birden düzeltir (veri prisma/migration/
 * fix-redirect-destinations-data.json içinde, her satır gerçek DB/dosya sistemiyle doğrulandı):
 *
 * 1) updateExisting / reactivateFixed: Redirect tablosundaki 173 kaydın hedefi (destinationPath), sitenin
 *    GERÇEKTE kullandığı rotalarla eşleşmiyordu — hiç var olmamış/terk edilmiş bir URL şemasına işaret
 *    ediyordu ("/tr/product/<slug>" yerine "/urun/<slug>", "/tr/corporate" yerine "/hakkimizda" vb.) ya da
 *    kendi kendine yönlendiriyordu (ör. "/contact-us" -> "/contact-us", bu yüzden pasif bırakılmıştı).
 *    8 kayıt tekil ürün değil KATEGORİ sayfasına gitmeliydi (ör. site:mezbahateknolojileri.com ile
 *    doğrulanan /slaughterhouse-equipments -> cattle-slaughterhouse kategorisi). 20 kayıt yeni sitede hiç
 *    karşılığı olmayan taşınmamış eski blog yazılarıydı — en yakın anlamlı hedef olan /blog (veya /tr/blog)
 *    anasayfasına yönlendirildi.
 *
 * 2) addEnDuplicates / addNew: Google'da site:mezbahateknolojileri.com ile canlı arama yapıldığında, aynı
 *    sayfaların "/en/<slug>" önekli bir nesli de ayrıca indexli çıktı (EN bir dönem ayrı önek alıyordu,
 *    şimdi varsayılan dil önek almıyor) — bunların Redirect tablosunda HİÇ kaydı yoktu, yani şu an çift 404
 *    veriyorlar. Önek'siz her kayıt için aynı (düzeltilmiş) hedefe giden bir "/en/..." eşleniği eklendi.
 *
 * Kullanım: node prisma/migration/fix-redirect-destinations.cjs [--apply]
 *
 * !! KULLANIMDAN KALDIRILDI (S1-01, 2026-10-25): bu betik hedefleri sabit TÜRKÇE iç yollara (/urun/…, /urunler) çevirir; sitenin
 * gerçek canonical adresleri ise dile göre yerelleşir (/product/…, /products, /ru/produkt/…). 13 Ekim'de çalıştırılması 204 kurala
 * canonical olmayan hedef yazdı ve 7 canonical URL'yi 301'e çevirdi. Yeniden çalıştırılmamalıdır; düzeltme için
 * prisma/migration/s1-01-redirect-recovery.cjs ve docs/seo/USA_SEO_S1_01_*.md kullanılır.
 */
if (!process.argv.includes("--i-know-this-reintroduces-the-regression")) {
  console.error("Bu betik kullanımdan kaldırıldı (bkz. dosya başı). Çıkılıyor.");
  process.exit(1);
}
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const APPLY = process.argv.includes("--apply");

const plan = JSON.parse(fs.readFileSync(path.join(__dirname, "fix-redirect-destinations-data.json"), "utf8"));

async function main() {
  const toUpdate = [...plan.updateExisting, ...plan.reactivateFixed];
  const toAdd = [...plan.addEnDuplicates, ...plan.addNew];

  console.log(`${toUpdate.length} kayıt güncellenecek (hedef düzeltme${plan.reactivateFixed.length ? " + " + plan.reactivateFixed.length + " yeniden aktifleştirme" : ""}).`);
  console.log(`${toAdd.length} yeni kayıt eklenecek (/en/ eşlenikleri + eksik kayıtlar).\n`);

  const current = await prisma.redirect.findMany({
    where: { id: { in: toUpdate.map((f) => f.id) } },
    select: { id: true, sourcePath: true, destinationPath: true, active: true },
  });
  const byId = new Map(current.map((r) => [r.id, r]));

  let updateSkipped = 0;
  for (const f of toUpdate) {
    const row = byId.get(f.id);
    if (!row) {
      console.log(`ATLANDI (kayıt artık yok): ${f.sourcePath}`);
      updateSkipped++;
      continue;
    }
    if (row.destinationPath === f.newDest && row.active) {
      updateSkipped++;
      continue; // zaten düzeltilmiş
    }
    console.log(`${f.sourcePath}\n  eski: ${row.destinationPath}${row.active ? "" : " (pasif)"}\n  yeni: ${f.newDest} (aktif)`);
  }

  const existingSources = new Set((await prisma.redirect.findMany({ select: { sourcePath: true } })).map((r) => r.sourcePath));
  const realToAdd = toAdd.filter((a) => !existingSources.has(a.sourcePath));
  console.log(`\n${toUpdate.length - updateSkipped} kayıt değişecek, ${updateSkipped} zaten güncel.`);
  console.log(`${realToAdd.length} yeni kayıt eklenecek (${toAdd.length - realToAdd.length} zaten var, atlanacak).`);

  if (!APPLY) {
    console.log("\nKuru çalıştırma. Uygulamak için: node prisma/migration/fix-redirect-destinations.cjs --apply");
    return;
  }

  let updated = 0;
  for (const f of toUpdate) {
    const row = byId.get(f.id);
    if (!row || (row.destinationPath === f.newDest && row.active)) continue;
    await prisma.redirect.update({ where: { id: f.id }, data: { destinationPath: f.newDest, active: true } });
    updated++;
  }

  let added = 0;
  for (const a of realToAdd) {
    await prisma.redirect.create({ data: { sourcePath: a.sourcePath, destinationPath: a.destinationPath, statusCode: 301, active: true } });
    added++;
  }

  console.log(`\n${updated} kayıt güncellendi, ${added} yeni kayıt eklendi.`);
}

main().finally(() => prisma.$disconnect());
