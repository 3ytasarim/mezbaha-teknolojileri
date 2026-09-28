/**
 * EN/RU çeviriler (elle): (1) KURBAN PRO ürünü — eski sitede EN/RU karşılığı yok; Türkçe metnin (kısa, başlık, 3 teknik özellik) birebir çevirisi.
 * (2) 19 referans proje — ad/şehir/tür kayıttaki alanlardan türetilir (yeni bilgi eklenmez); kapasite gösterimde localizeMeasure ile çevrilir.
 * Yalnızca ekler/günceller (locale en/ru). Kullanım: npx tsx prisma/migration/import-reference-and-kurban-translations.ts [--apply]
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { localizeMeasure } from "../../src/lib/i18n/format";

const APPLY = process.argv.includes("--apply");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

type L = "en" | "ru";
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const COUNTRY: Record<string, Record<L, string>> = {
  Azerbaycan: { en: "Azerbaijan", ru: "Азербайджан" }, Hollanda: { en: "Netherlands", ru: "Нидерланды" }, Fas: { en: "Morocco", ru: "Марокко" },
  Katar: { en: "Qatar", ru: "Катар" }, "Porto Riko": { en: "Puerto Rico", ru: "Пуэрто-Рико" }, "Kırgızistan": { en: "Kyrgyzstan", ru: "Кыргызстан" },
  "Gürcistan": { en: "Georgia", ru: "Грузия" }, "Türkmenistan": { en: "Turkmenistan", ru: "Туркменистан" }, Arjantin: { en: "Argentina", ru: "Аргентина" },
  "Türkiye": { en: "Turkey", ru: "Турция" }, "Bosna Hersek": { en: "Bosnia and Herzegovina", ru: "Босния и Герцеговина" }, Arnavutluk: { en: "Albania", ru: "Албания" },
  Tacikistan: { en: "Tajikistan", ru: "Таджикистан" },
};
const CITY: Record<string, Record<L, string>> = {
  Gobustan: { en: "Gobustan", ru: "Гобустан" }, Harderwijk: { en: "Harderwijk", ru: "Хардервейк" }, Kenitra: { en: "Kenitra", ru: "Кенитра" },
  "Al Khoor": { en: "Al Khor", ru: "Эль-Хор" }, "San Juan": { en: "San Juan", ru: "Сан-Хуан" }, Karakol: { en: "Karakol", ru: "Каракол" },
  Khashuri: { en: "Khashuri", ru: "Хашури" }, "Aşkabat": { en: "Ashgabat", ru: "Ашхабад" }, "Buenos Aires": { en: "Buenos Aires", ru: "Буэнос-Айрес" },
  "Bakü": { en: "Baku", ru: "Баку" }, "Çorum": { en: "Corum", ru: "Чорум" }, Prijedor: { en: "Prijedor", ru: "Приедор" }, Pogradec: { en: "Pogradec", ru: "Поградец" },
  "Bişkek": { en: "Bishkek", ru: "Бишкек" }, "Xaçmaz": { en: "Khachmaz", ru: "Хачмаз" }, Novhani: { en: "Novkhani", ru: "Новхани" }, Afyon: { en: "Afyon", ru: "Афьон" },
  Tovuz: { en: "Tovuz", ru: "Товуз" }, "Duşanbe": { en: "Dushanbe", ru: "Душанбе" },
};
// Türkçe kayıt adındaki tür ifadesi ("… — Slaughterhouse") → EN/RU
const TYPES: [RegExp, Record<L, string>][] = [
  [/Meat Processing Cold Room/i, { en: "Meat Processing Cold Room", ru: "Холодильная камера для переработки мяса" }],
  [/Micro Slaughterhouse/i, { en: "Micro Slaughterhouse", ru: "Микро-скотобойня" }],
  [/Rotation(al)? Cattle Box/i, { en: "Rotational Cattle Box", ru: "Ротационный бокс для КРС" }],
  [/Leather Skinning/i, { en: "Hide Skinning", ru: "Снятие шкур" }],
  [/Meat Processing/i, { en: "Meat Processing", ru: "Переработка мяса" }],
  [/Meat Factory/i, { en: "Meat Factory", ru: "Мясокомбинат" }],
  [/Modern Kesimhane/i, { en: "Modern Slaughterhouse", ru: "Современная скотобойня" }],
  [/Kesimhane|Slaughterhouse/i, { en: "Slaughterhouse", ru: "Скотобойня" }],
];

async function main() {
  // ---- KURBAN PRO
  const kp = await prisma.product.findUnique({ where: { slug: "kurban-pro" }, select: { id: true } });
  const KP: Record<L, { name: string; short: string; h2: string; seoTitle: string; seoDescription: string; specs: [string, string][] }> = {
    en: {
      name: "Kurban Pro",
      short: "Complete system: 3 m wide, 16 m long, with a 4 m cutting line. Make your sacrifice slaughter work easier.",
      h2: "Slaughter Easily, Save Time.",
      seoTitle: "KURBAN PRO Slaughter System – Efficient, Fast & Modern Solution",
      seoDescription: "Safe, fast and practical sacrifice slaughter systems with KURBAN PRO. Save time with a complete line 3 m wide and 16 m long.",
      specs: [["Width", "3 meters"], ["Length", "16 meters"], ["Cutting line", "4 meters"]],
    },
    ru: {
      name: "Kurban Pro",
      short: "Комплексная система: ширина 3 м, длина 16 м, линия разделки 4 м. Упростите работу при жертвенном забое.",
      h2: "Забивайте легко и экономьте время.",
      seoTitle: "Система жертвенного забоя KURBAN PRO — эффективно, быстро, современно",
      seoDescription: "Безопасные, быстрые и удобные системы жертвенного забоя KURBAN PRO. Экономьте время с комплексной линией шириной 3 м и длиной 16 м.",
      specs: [["Ширина", "3 метра"], ["Длина", "16 метров"], ["Линия разделки", "4 метра"]],
    },
  };
  if (kp) {
    for (const l of ["en", "ru"] as L[]) {
      const k = KP[l];
      const data = { name: k.name, slug: "kurban-pro", shortDescription: k.short, description: `<h2>${k.h2}</h2>\n<p>${k.short}</p>`, seoTitle: k.seoTitle, seoDescription: k.seoDescription };
      console.log("kurban-pro", l);
      if (!APPLY) continue;
      await prisma.productTranslation.upsert({ where: { productId_locale: { productId: kp.id, locale: l } }, create: { productId: kp.id, locale: l, ...data }, update: data });
      await prisma.productSpecification.deleteMany({ where: { productId: kp.id, locale: l } });
      await prisma.productSpecification.createMany({ data: k.specs.map(([label, value], i) => ({ productId: kp.id, locale: l, label, value, sortOrder: i })) });
    }
  }

  // ---- referans projeler
  const refs = await prisma.project.findMany({ where: { type: "REFERENCE" }, include: { translations: { where: { locale: "tr" } } } });
  let n = 0;
  for (const p of refs) {
    const trName = p.translations[0]?.name ?? "";
    const typeSrc = trName.split("—").pop() ?? "";
    const type = TYPES.find(([re]) => re.test(typeSrc))?.[1];
    const c = COUNTRY[p.country];
    const city = p.city ? CITY[p.city] : undefined;
    if (!type || !c || (p.city && !city)) {
      console.log("ATLANDI (eşleme yok):", trName, "|", p.country, p.city);
      continue;
    }
    for (const l of ["en", "ru"] as L[]) {
      const place = city ? `${c[l]} / ${city[l]}` : c[l];
      const name = `${place} — ${type[l]}`;
      const cap = localizeMeasure(p.capacity, l);
      const short =
        l === "en"
          ? `${type.en} project in ${city ? city.en + ", " : ""}${c.en}, a Slaughterhouse Technologies reference.${cap ? ` Capacity: ${cap}.` : ""}`
          : `Проект: ${type.ru.toLowerCase()} — ${city ? city.ru + ", " : ""}${c.ru}, референс Mezbaha Teknolojileri.${cap ? ` Мощность: ${cap}.` : ""}`;
      const seoTitle = l === "en" ? `${c.en} ${city?.en ?? ""} ${type.en} Project`.replace(/\s+/g, " ") : `${type.ru}: ${city ? city.ru + ", " : ""}${c.ru}`;
      const slug = slugify(`${c.en} ${city?.en ?? ""} ${type.en}`);
      const data = { name, slug, shortDescription: short, description: short, seoTitle, seoDescription: short.slice(0, 160) };
      console.log(l, slug);
      if (!APPLY) continue;
      await prisma.projectTranslation.upsert({ where: { projectId_locale: { projectId: p.id, locale: l } }, create: { projectId: p.id, locale: l, ...data }, update: data });
      n++;
    }
  }
  console.log(APPLY ? `yazıldı: referans ${n}` : "kuru çalıştırma");
}
main().finally(() => prisma.$disconnect());
