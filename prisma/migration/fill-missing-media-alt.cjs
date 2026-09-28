/**
 * Medya kütüphanesindeki, görsellere bakılarak (uydurulmadan) yazılmış 19 eksik alt metni yazar.
 * Kullanım: node prisma/migration/fill-missing-media-alt.cjs [--apply]
 */
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const APPLY = process.argv.includes("--apply");

const ALT = {
  "/uploads/chatgpt-image-25-eyl-2026-20-01-18-b3e6339a.png":
    "Büyükbaş mezbaha hattının izometrik 3D şeması: tavan rayı, kesim istasyonları ve sersemletme kutusuna giren hayvanlar.",
  "/uploads/chatgpt-image-25-eyl-2026-19-59-29-28b5a4cc.png":
    "Elde taşınabilir paslanmaz çelik kemik kesme bant testeresi.",
  "/uploads/chatgpt-image-25-eyl-2026-19-57-49-be98c0a0.png":
    "Mezbaha Teknolojileri markalı otomatik deri yüzme makinesi — paslanmaz çelik gövde ve zincirli çekim ünitesi.",
  "/uploads/chatgpt-image-25-eyl-2026-19-56-06-d9f5418e.png":
    "Mezbaha Teknolojileri markalı otomatik deri yüzme makinesi, stüdyo arka planında.",
  "/uploads/chatgpt-image-25-eyl-2026-19-54-11-7ee2f534.png":
    "Mezbaha tesisinin tam kat planı — tavan rayları, kesim istasyonları ve çalışanlarla 3D iç mekan görünümü.",
  "/uploads/chatgpt-image-25-eyl-2026-19-51-53-7df0bb92.png":
    "Elde taşınabilir paslanmaz çelik kemik kesme bant testeresi, stüdyo arka planında.",
  "/uploads/chatgpt-image-25-eyl-2026-19-50-24-9af36161.png":
    "Mezbaha Teknolojileri markalı otomatik deri yüzme makinesi, farklı açıdan render.",
  "/uploads/chatgpt-image-25-eyl-2026-19-49-02-b4205675.png":
    "Otomatik deri yüzme makinesi — paslanmaz çelik gövde, motor ve zincirli çekim ünitesi.",
  "/uploads/chatgpt-image-25-eyl-2026-19-21-33-e40489ba.png":
    "Büyükbaş karkaslar mezbaha ray hattında asılı — soğuk oda öncesi işleme bölümü.",
  "/uploads/chatgpt-image-25-eyl-2026-19-21-33-78ea44e8.png":
    "Büyükbaş karkaslar mezbaha ray hattında asılı — soğuk oda öncesi işleme bölümü.",
  "/uploads/chatgpt-image-25-eyl-2026-19-21-33-23a26e0e.png":
    "Büyükbaş karkaslar mezbaha ray hattında asılı — soğuk oda öncesi işleme bölümü.",
  "/uploads/chatgpt-image-25-eyl-2026-19-21-33-210f121d.png":
    "Büyükbaş karkaslar mezbaha ray hattında asılı — soğuk oda öncesi işleme bölümü.",
  "/images/migrated/blog/soguk-oda-ve-ikizray-sistemleri-et-kalitesini-nasil-etkiler/cover-soguk-oda-ve-ikizray-sistemleri-et-kalitesini-nasil-etkiler.jpg":
    "Soğuk odada ikizray sistemine asılı karkaslar ve kontrol yapan çalışanlar.",
  "/images/migrated/blog/sigir-kesiminde-en-sik-kullanilan-makineler-nelerdir/cover-sigir-kesiminde-en-sik-kullanilan-makineler-nelerdir.jpg":
    "İmalathanede üretim aşamasındaki döner tip sığır sersemletme kutusu ve kontrol paneli.",
  "/images/migrated/blog/robotik-mezbaha-sistemleri-nedir/cover-robotik-mezbaha-sistemleri-nedir.jpg":
    "Döner masalı otomatik/robotik mezbaha işleme istasyonu.",
  "/images/migrated/blog/rayli-tasima-sistemleri-ikizray-nedir-ve-neden-kullanilir/cover-rayli-tasima-sistemleri-ikizray-nedir-ve-neden-kullanilir.jpg":
    "Küçükbaş karkasların ikizray taşıma hattında sıralı görünümü.",
  "/images/migrated/blog/otomatik-deri-yuzme-sistemleri-ile-iscilik-maliyeti-nasil-azalir/cover-otomatik-deri-yuzme-sistemleri-ile-iscilik-maliyeti-nasil-azalir.jpg":
    "Geniş et işleme salonunda çift sıra karkas hattı ve çalışan personel.",
  "/images/migrated/blog/online-magazamiz-yayinda/cover-online-magazamiz-yayinda.jpg":
    "Eski Mezbaha Teknolojileri web sitesinin online mağaza ekran görüntüsü — ürün vitrini.",
  "/images/migrated/blog/modern-mezbaha-ekipmanlari-nelerdir/cover-modern-mezbaha-ekipmanlari-nelerdir.jpg":
    "Boş mezbaha salonu iç mekanı — tavan rayı ve ızgaralı zemin kanalları.",
};

async function main() {
  const urls = Object.keys(ALT);
  const rows = await prisma.media.findMany({ where: { url: { in: urls } } });
  console.log(`Bulunan: ${rows.length} / ${urls.length}`);

  for (const row of rows) {
    const alt = ALT[row.url];
    console.log(`${APPLY ? "YAZILIYOR" : "[kuru]"} ${row.url} -> "${alt}"`);
  }

  const missing = urls.filter((u) => !rows.some((r) => r.url === u));
  if (missing.length) console.log("DB'de bulunamayan URL'ler:", missing);

  if (!APPLY) {
    console.log("\nKuru çalıştırma. Uygulamak için --apply");
    return;
  }

  for (const row of rows) {
    await prisma.media.update({ where: { id: row.id }, data: { alt: ALT[row.url] } });
  }
  console.log("yazıldı.");
}

main().finally(() => prisma.$disconnect());
