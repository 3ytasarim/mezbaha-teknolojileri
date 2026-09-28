/**
 * Ürün kapak (55) ve galeri (122) görsellerini açıklayıcı, benzersiz dosya adlarına taşır:
 *  - kapak: {dizin}/thumb.ext -> {dizin}/{enSlug}.ext
 *  - galeri: {dizin}/NN.ext veya eski-şablon ad -> {dizin}/{enSlug}-NN.ext (NN: 02'den başlayan orijinal sıra)
 * Dizin DEĞİŞMEZ, yalnızca dosya adı. Uzantı DEĞİŞMEZ (gerçek encoding dönüşümü yapılmıyor).
 * Her adım için: eski dosya var mı, yeni ad boşta mı kontrol edilir; çakışma varsa o kayıt ATLANIR ve raporlanır.
 * DB (Product.coverImage / ProductImage.imageUrl) güncellenir + Redirect tablosuna eski->yeni 301 eklenir (idempotent).
 * Kullanım: node prisma/migration/rename-product-images.cjs [--apply]
 */
require("dotenv/config");
const fs = require("fs");
const path = require("path");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const APPLY = process.argv.includes("--apply");
const PUBLIC_ROOT = path.join(__dirname, "..", "..", "public");

function toDisk(publicPath) {
  return path.join(PUBLIC_ROOT, publicPath.replace(/^\//, ""));
}

async function main() {
  const products = await prisma.product.findMany({
    select: {
      id: true,
      coverImage: true,
      images: { select: { id: true, imageUrl: true }, orderBy: { sortOrder: "asc" } },
      translations: { where: { locale: "en" }, select: { slug: true } },
    },
  });

  const plan = []; // { kind, id, oldPublic, newPublic, oldDisk, newDisk }
  const skipped = [];

  for (const p of products) {
    const enSlug = p.translations[0]?.slug;
    if (!enSlug) { skipped.push(`ürün ${p.id}: EN slug yok, atlandı`); continue; }

    if (p.coverImage) {
      const ext = path.extname(p.coverImage);
      const dir = path.posix.dirname(p.coverImage);
      const newPublic = `${dir}/${enSlug}${ext}`;
      if (newPublic !== p.coverImage) plan.push({ kind: "cover", productId: p.id, oldPublic: p.coverImage, newPublic });
    }

    let seq = 2; // mevcut adlandırma "02, 03, ..." ile başladığı için korunuyor
    for (const img of p.images) {
      const ext = path.extname(img.imageUrl);
      const dir = path.posix.dirname(img.imageUrl);
      const n = String(seq).padStart(2, "0");
      const newPublic = `${dir}/${enSlug}-${n}${ext}`;
      seq++;
      if (newPublic !== img.imageUrl) plan.push({ kind: "gallery", imageId: img.id, oldPublic: img.imageUrl, newPublic });
    }
  }

  // Güvenlik: aynı hedef yola iki kaynağın çakışması var mı?
  const destCount = new Map();
  for (const item of plan) destCount.set(item.newPublic, (destCount.get(item.newPublic) || 0) + 1);
  const collisions = [...destCount.entries()].filter(([, c]) => c > 1);
  if (collisions.length) {
    console.log("DURDU: hedef dosya adı çakışması tespit edildi, hiçbir işlem yapılmadı:");
    console.log(collisions);
    return;
  }

  console.log(`Plan: ${plan.length} dosya (${plan.filter((x) => x.kind === "cover").length} kapak, ${plan.filter((x) => x.kind === "gallery").length} galeri).`);
  console.log("--- örnek (ilk 8) ---");
  for (const item of plan.slice(0, 8)) console.log(`${item.oldPublic} -> ${item.newPublic}`);
  if (skipped.length) { console.log("--- atlanan ---"); console.log(skipped); }

  if (!APPLY) {
    console.log("\nKuru çalıştırma. Uygulamak için: node prisma/migration/rename-product-images.cjs --apply");
    return;
  }

  const results = { renamed: [], dbUpdated: 0, redirectsCreated: 0, errors: [] };

  for (const item of plan) {
    const oldDisk = toDisk(item.oldPublic);
    const newDisk = toDisk(item.newPublic);
    try {
      if (!fs.existsSync(oldDisk)) { results.errors.push(`YOK (eski dosya): ${item.oldPublic}`); continue; }
      if (fs.existsSync(newDisk)) { results.errors.push(`ÇAKIŞMA (yeni ad zaten var, atlandı): ${item.newPublic}`); continue; }

      fs.renameSync(oldDisk, newDisk);
      results.renamed.push({ old: item.oldPublic, new: item.newPublic });

      if (item.kind === "cover") {
        await prisma.product.update({ where: { id: item.productId }, data: { coverImage: item.newPublic } });
      } else {
        await prisma.productImage.update({ where: { id: item.imageId }, data: { imageUrl: item.newPublic } });
      }
      results.dbUpdated++;

      const exists = await prisma.redirect.findUnique({ where: { sourcePath: item.oldPublic } });
      if (!exists) {
        await prisma.redirect.create({ data: { sourcePath: item.oldPublic, destinationPath: item.newPublic, statusCode: 301, active: true } });
        results.redirectsCreated++;
      }
    } catch (e) {
      results.errors.push(`HATA ${item.oldPublic}: ${e.message}`);
    }
  }

  fs.writeFileSync(path.join(__dirname, "scratch_rename_report.json"), JSON.stringify(results, null, 1));
  console.log("Yeniden adlandırılan:", results.renamed.length, "| DB güncellenen:", results.dbUpdated, "| Redirect oluşturulan:", results.redirectsCreated, "| Hata:", results.errors.length);
  if (results.errors.length) console.log(results.errors);
}

main().finally(() => prisma.$disconnect());
