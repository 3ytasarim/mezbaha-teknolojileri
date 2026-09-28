/**
 * Product.coverImage / ProductImage alt metinleri için ProductTranslation.imageAlt doldurma:
 * gerçek DB verisinden (kategori ataması + İngilizce açıklamada tespit edilen malzeme/mekanizma) üretilir,
 * uydurma özellik eklenmez. Kalıp: "{Malzeme} {Ürün adı} — {kategori bağlamı}" (malzeme yoksa atlanır).
 * Kullanım: node prisma/migration/generate-image-alt.cjs [--apply]
 */
require("dotenv/config");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const fs = require("fs");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const APPLY = process.argv.includes("--apply");
const materialMap = JSON.parse(fs.readFileSync(__dirname + "/scratch_material_map.json", "utf8"));

const MATERIALS = {
  "stainless steel": { tr: "Paslanmaz çelik", en: "Stainless steel", de: "Edelstahl", fr: "Acier inoxydable", ru: "Нержавеющая сталь", ar: "فولاذ مقاوم للصدأ" },
  hydraulic: { tr: "Hidrolik", en: "Hydraulic", de: "Hydraulisch", fr: "Hydraulique", ru: "Гидравлический", ar: "هيدروليكي" },
  pneumatic: { tr: "Pnömatik", en: "Pneumatic", de: "Pneumatisch", fr: "Pneumatique", ru: "Пневматический", ar: "هوائي" },
  "galvanized steel": { tr: "Galvanizli çelik", en: "Galvanized steel", de: "Verzinkter Stahl", fr: "Acier galvanisé", ru: "Оцинкованная сталь", ar: "فولاذ مجلفن" },
  aluminium: { tr: "Alüminyum", en: "Aluminium", de: "Aluminium", fr: "Aluminium", ru: "Алюминиевый", ar: "ألومنيوم" },
  "cast steel": { tr: "Döküm çelik", en: "Cast steel", de: "Stahlguss", fr: "Acier moulé", ru: "Литая сталь", ar: "فولاذ مصبوب" },
  polyethylene: { tr: "Polietilen", en: "Polyethylene", de: "Polyethylen", fr: "Polyéthylène", ru: "Полиэтиленовый", ar: "بولي إيثيلين" },
};

const CATEGORY_PHRASE = {
  buyukbas: { tr: "sığır kesim hattı", en: "cattle slaughter lines", de: "Rinderschlachtlinien", fr: "lignes d'abattage de bovins", ru: "линии убоя крупного рогатого скота", ar: "خطوط ذبح الأبقار" },
  kucukbas: { tr: "küçükbaş kesim hattı", en: "sheep and goat slaughter lines", de: "Schaf- und Ziegenschlachtlinien", fr: "lignes d'abattage d'ovins et de caprins", ru: "линии убоя овец и коз", ar: "خطوط ذبح الأغنام والماعز" },
  "kurban-kesim": { tr: "küçük ölçekli mezbahalar", en: "small-scale slaughterhouses", de: "kleine Schlachthöfe", fr: "petits abattoirs", ru: "небольшие бойни", ar: "المسالخ الصغيرة" },
  "mezbaha-sistemleri": { tr: "mezbaha işleme hattı", en: "slaughterhouse processing lines", de: "Schlachthof-Verarbeitungslinien", fr: "lignes de transformation d'abattoir", ru: "перерабатывающие линии боен", ar: "خطوط تجهيز المسالخ" },
};

const LOCALES = ["tr", "en", "ru", "de", "fr", "ar"];
const DASH = { ar: " — " }; // AR: aynı em dash, RTL otomatik ters çevirir

function build(name, materials, categoryPhrase, locale) {
  const mat = materials.length ? MATERIALS[materials[0]]?.[locale] : null;
  const sep = DASH[locale] || " — ";
  const head = mat ? `${mat} ${name}` : name;
  return `${head}${sep}${categoryPhrase}`;
}

async function main() {
  const products = await prisma.product.findMany({
    select: { id: true, categoryId: true, category: { select: { slug: true } }, translations: { select: { id: true, locale: true, name: true } } },
  });

  const rows = [];
  for (const p of products) {
    const catSlug = p.category.slug;
    const materials = materialMap[p.id]?.materials ?? [];
    for (const t of p.translations) {
      if (!LOCALES.includes(t.locale)) continue;
      const phrase = CATEGORY_PHRASE[catSlug]?.[t.locale];
      if (!phrase) continue;
      const alt = build(t.name, materials, phrase, t.locale);
      rows.push({ id: t.id, productId: p.id, locale: t.locale, alt });
    }
  }

  console.log(`${rows.length} satır üretildi (${products.length} ürün × ${LOCALES.length} dil).`);
  console.log("--- örnek (ilk 12) ---");
  for (const r of rows.slice(0, 12)) console.log(`[${r.locale}] ${r.alt}`);

  if (!APPLY) {
    console.log("\nKuru çalıştırma. Uygulamak için: node prisma/migration/generate-image-alt.cjs --apply");
    return;
  }
  let n = 0;
  for (const r of rows) {
    await prisma.productTranslation.update({ where: { id: r.id }, data: { imageAlt: r.alt } });
    n++;
  }
  console.log("yazıldı:", n);
}

main().finally(() => prisma.$disconnect());
