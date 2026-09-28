/**
 * Kapasite paketi (C-50 … C-300) EN/RU çevirileri. Eski sitede bu metinlerin EN/RU karşılığı yoktur (Türkçe metinler yeni siteye
 * özgü derlenmiştir); bu yüzden çeviriler burada elle yazılmıştır ve YALNIZCA Türkçe metindeki gerçek veriyi (alan, kapasite,
 * oda/depo sayıları, ekipman listesi) aktarır — yeni iddia eklenmez. Ekipman adları, EN/RU ürün adlarıyla (import-translations.ts)
 * tutarlıdır. Referans projeler (19) bilerek ÇEVRİLMEZ: /projeler'den kaldırıldılar, ince içerik olarak yeni dillerde yayınlanmasın.
 *
 * Yalnızca ekler/günceller (locale = en/ru). Kullanım: npx tsx prisma/migration/import-project-translations.ts [--apply]
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const APPLY = process.argv.includes("--apply");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

type Pack = { slug: string; en: string; ru: string };

const EQUIP_EN = "circular stunning box, bleeding crane, transfer crane, transfer station, hydraulic skinning machine, tripe station, carcass splitting station and carcass splitting saw, leg cutting shear, brisket saw";
const EQUIP_RU = "камера круговой обрезки, кран для крови, кран для переноски, станция переноски, гидравлическая машина для снятия кожи, станция для рубца, станция разделения туш и пила для разделения туш, ножницы для обрезания ног, пила для распила груди";

const PACKS: Pack[] = [
  {
    slug: "c-50",
    en: "C50 is a compact, small-scale slaughterhouse project designed for a capacity plan of 50 cattle and 100 sheep on approximately 350 m². It includes the slaughter area, an offal preparation room, a cold room, an office area and the basic machinery and equipment required for cattle and sheep slaughter processes. Thanks to its economical investment structure, simple layout plan and hygienic process flow, C50 is an ideal mini slaughterhouse solution for municipalities, cooperatives and small meat businesses.",
    ru: "C50 — компактный небольшой проект скотобойни, рассчитанный на 50 голов крупного рогатого скота и 100 овец на площади около 350 м². Он включает зону убоя, помещение для подготовки субпродуктов, холодильную камеру, офисную зону, а также основные машины и оборудование, необходимые для процессов убоя крупного рогатого скота и овец. Благодаря экономичным инвестициям, простой планировке и гигиеничной организации процесса C50 — идеальное решение мини-скотобойни для муниципалитетов, кооперативов и небольших мясных предприятий.",
  },
  {
    slug: "c-50-plus",
    en: "A slaughterhouse built on a 400 m² area for 70 cattle and 200 small ruminants, with a slaughter hall, an offal room, a cold room, a meat cutting area and an office on a mezzanine floor. It meets all hygiene and red meat regulation requirements. Main equipment: cattle slaughter box, bleeding crane, transfer crane, transfer station, classic skinning machine, tripe station, carcass splitting station and carcass splitting saw.",
    ru: "Скотобойня на площади 400 м² для 70 голов крупного и 200 голов мелкого рогатого скота: зал убоя, помещение для субпродуктов, холодильная камера, зона разделки мяса и офис на антресольном этаже. Соответствует всем требованиям гигиены и регламента по красному мясу. Основное оборудование: камера обрезки, кран для крови, кран для переноски, станция переноски, классическая машина для снятия кожи, станция для рубца, станция разделения туш и пила для разделения туш.",
  },
  {
    slug: "c-100",
    en: `A slaughterhouse built on a 550 m² area for 100 cattle and 300 small ruminants, with a slaughter hall, an offal room, 2 carcass cold rooms, 2 storage rooms (-18/-40) and an office on a mezzanine floor. Main equipment: ${EQUIP_EN}.`,
    ru: `Скотобойня на площади 550 м² для 100 голов крупного и 300 голов мелкого рогатого скота: зал убоя, помещение для субпродуктов, 2 холодильные камеры для туш, 2 склада хранения (-18/-40) и офис на антресольном этаже. Основное оборудование: ${EQUIP_RU}.`,
  },
  {
    slug: "c-100-plus",
    en: `A slaughterhouse built on a 680 m² area for 100 cattle and 300 small ruminants, with a slaughter hall, an offal room, 3 carcass cold rooms, 2 storage rooms (-18/-40), a meat cutting room and an office on a mezzanine floor. Main equipment: ${EQUIP_EN}, meat cutting saw and meat cutting tables.`,
    ru: `Скотобойня на площади 680 м² для 100 голов крупного и 300 голов мелкого рогатого скота: зал убоя, помещение для субпродуктов, 3 холодильные камеры для туш, 2 склада хранения (-18/-40), помещение для разделки мяса и офис на антресольном этаже. Основное оборудование: ${EQUIP_RU}, пила для разделки мяса и столы для разделки мяса.`,
  },
  {
    slug: "c-100-xl",
    en: `A slaughterhouse built on a 980 m² area for 150 cattle and 500 small ruminants, with a slaughter hall, an offal room, 2 carcass cold rooms, 2 storage rooms (-18/-40) and an office on a mezzanine floor. Main equipment: ${EQUIP_EN}.`,
    ru: `Скотобойня на площади 980 м² для 150 голов крупного и 500 голов мелкого рогатого скота: зал убоя, помещение для субпродуктов, 2 холодильные камеры для туш, 2 склада хранения (-18/-40) и офис на антресольном этаже. Основное оборудование: ${EQUIP_RU}.`,
  },
  {
    slug: "c-200",
    en: `A slaughterhouse built on a 1200 m² area for 200 cattle and 700 small ruminants, with a slaughter hall, an offal room, 3 carcass cold rooms, 2 storage rooms (-18/-40) and an office on a mezzanine floor. Main equipment: ${EQUIP_EN}.`,
    ru: `Скотобойня на площади 1200 м² для 200 голов крупного и 700 голов мелкого рогатого скота: зал убоя, помещение для субпродуктов, 3 холодильные камеры для туш, 2 склада хранения (-18/-40) и офис на антресольном этаже. Основное оборудование: ${EQUIP_RU}.`,
  },
  {
    slug: "c-300",
    en: "A slaughterhouse built on a 2700 m² area for 300 cattle and 2000 small ruminants, with a slaughter hall, an offal room, 4 carcass cold rooms, 2 storage rooms (-18/-40) and an office on a mezzanine floor. Main equipment: circular stunning box, cattle slaughter box, automatic bleeding line, bleeding crane, transfer crane, transfer station, hydraulic skinning machine, tripe station, carcass splitting station and carcass splitting saw, leg cutting shear, brisket saw.",
    ru: "Скотобойня на площади 2700 м² для 300 голов крупного и 2000 голов мелкого рогатого скота: зал убоя, помещение для субпродуктов, 4 холодильные камеры для туш, 2 склада хранения (-18/-40) и офис на антресольном этаже. Основное оборудование: камера круговой обрезки, камера обрезки, автоматическая линия обескровливания, кран для крови, кран для переноски, станция переноски, гидравлическая машина для снятия кожи, станция для рубца, станция разделения туш и пила для разделения туш, ножницы для обрезания ног, пила для распила груди.",
  },
];

const firstSentences = (text: string, max: number) => {
  const s = text.split(/(?<=\.)\s+/);
  let out = "";
  for (const x of s) {
    if ((out + " " + x).trim().length > max) break;
    out = (out + " " + x).trim();
  }
  if (out) return out;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:]$/, "") + "…";
};

async function main() {
  const projects = await prisma.project.findMany({ where: { type: "CAPACITY_SOLUTION" }, select: { id: true, slug: true } });
  let n = 0;
  for (const pack of PACKS) {
    const project = projects.find((p) => p.slug === pack.slug);
    if (!project) {
      console.log("YOK:", pack.slug);
      continue;
    }
    const name = pack.slug.toUpperCase().replace("-PLUS", " Plus").replace("-XL", " XL");
    for (const [lang, text] of [["en", pack.en], ["ru", pack.ru]] as const) {
      const seoTitle = lang === "en" ? `${name} Capacity Package` : `Пакет мощности ${name}`;
      const data = {
        name,
        slug: pack.slug,
        shortDescription: firstSentences(text, 220),
        description: text,
        seoTitle,
        seoDescription: firstSentences(text, 160),
      };
      console.log(`${lang} ${pack.slug}: ${data.seoDescription.length} kr SEO, ${text.length} kr gövde`);
      if (!APPLY) continue;
      await prisma.projectTranslation.upsert({
        where: { projectId_locale: { projectId: project.id, locale: lang } },
        create: { projectId: project.id, locale: lang, ...data },
        update: data,
      });
      n++;
    }
  }
  console.log(APPLY ? `yazıldı: ${n}` : "kuru çalıştırma (yazılmadı)");
}
main().finally(() => prisma.$disconnect());
