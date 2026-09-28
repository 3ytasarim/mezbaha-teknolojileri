/**
 * SEO Yönetimi denetiminde işaretlenen kayıtları düzeltir: 60 karakteri aşan başlıklar (marka hariç), 160'ı aşan / 70'ten kısa
 * açıklamalar ve boş SEO alanları (19 proje + 1 hizmet sayfası). Proje metinleri kayıttaki ülke/şehir/kapasite alanlarından üretilir;
 * yeni bilgi uydurulmaz. Yalnızca boş veya kuralı aşan alanlara dokunur (idempotent). Kullanım: npx tsx prisma/migration/fix-seo-fields.ts
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const clean = (t: string) => {
  let o = t.trim();
  const re = /\s*[-–—|]\s*Mezbaha Teknolojileri\s*$/i;
  while (re.test(o)) o = o.replace(re, "").trim();
  return o;
};
const check = (label: string, title: string | undefined, desc: string | undefined) => {
  if (title && title.length > 60) throw new Error(`${label}: başlık ${title.length}`);
  if (desc && (desc.length < 70 || desc.length > 160)) throw new Error(`${label}: açıklama ${desc.length}`);
};

const PRODUCTS: Record<string, { t: string; d?: string }> = {
  cmueeraj10085mcp6pai0h3ng: { t: "Çeyrekleme Elevatörü – Sessiz ve Sarsıntısız Taşıma" },
  cmueerbf0008hmcp6ksuhvl5s: {
    t: "Pnömatik Aktarma Platformu – Ayarlanabilir Yükseklik",
    d: "Pnömatik Aktarma Platformu, mezbaha istasyonlarında ayarlanabilir çalışma yüksekliği sunar. Çift silindir, 200 kg kapasite ve paslanmaz gövde.",
  },
  cmueercab008umcp6w75ly74n: {
    t: "Pnömatik İç Organ Platformu – İşkembe Aktarımı",
    d: "Pnömatik İç Organ Platformu, işkembenin banda zarar görmeden aktarılmasını destekler. 304 paslanmaz çelik yapı, ayak kumandası, bıçak sterilizatörü.",
  },
};
const POSTS: Record<string, { t: string }> = {
  cmuees2mb00hmmcp6udzudkji: { t: "Ayak Kesme Makası ile Manuel Kesim Hatalarını Azaltın" },
  cmueesfz100ksmcp6ck37lk7h: { t: "Mezbaha Otomasyonu ile Verimliliği %40 Artırın" },
  cmueeskzg00lzmcp6orktw408: { t: "Otomatik Deri Yüzme ile İşçilik Maliyeti Nasıl Azalır?" },
  cmuees7vs00iwmcp6j2ccde9a: { t: "İşkembe Atık Pompası ile Hijyenik Atık Yönetimi" },
};

const TYPES: [RegExp, string][] = [
  [/Micro Slaughterhouse/i, "mikro kesimhane"],
  [/Rotation(al)? Cattle Box/i, "döner büyükbaş kesim boksu"],
  [/Leather Skinning/i, "deri yüzme"],
  [/Meat Processing Cold Room/i, "et işleme soğuk oda"],
  [/Meat Processing/i, "et işleme"],
  [/Meat Factory/i, "et fabrikası"],
  [/Slaughterhouse/i, "kesimhane"],
];
const capacityTr = (c: string) =>
  c
    .replace(/cattle/gi, "büyükbaş")
    .replace(/sheep/gi, "koyun")
    .replace(/pig/gi, "domuz")
    .replace(/carcass/gi, "karkas")
    .replace(/\/hour/gi, "/saat")
    .replace(/\/shift/gi, "/vardiya")
    .replace(/kg\/saat/i, "kg/saat");

async function main() {
  for (const [id, v] of Object.entries(PRODUCTS)) {
    check(`ürün ${id}`, v.t, v.d);
    await prisma.productTranslation.update({ where: { id }, data: { seoTitle: v.t, ...(v.d ? { seoDescription: v.d } : {}) } });
  }
  for (const [id, v] of Object.entries(POSTS)) {
    check(`yazı ${id}`, v.t, undefined);
    await prisma.blogPostTranslation.update({ where: { id }, data: { seoTitle: v.t } });
  }

  const projects = await prisma.project.findMany({ include: { translations: { where: { locale: "tr" } } } });
  let n = 0;
  for (const p of projects) {
    const t = p.translations[0];
    if (!t) continue;
    const type = TYPES.find(([re]) => re.test(t.name))?.[1] ?? "kesimhane";
    const place = [p.country, p.city].filter(Boolean).join(" ");
    const data: { seoTitle?: string; seoDescription?: string } = {};
    if (!t.seoTitle || clean(t.seoTitle) === t.name) data.seoTitle = `${place} ${type.charAt(0).toLocaleUpperCase("tr")}${type.slice(1)} Projesi`;
    if (!t.seoDescription) {
      data.seoDescription = `${place} ${type} projesi, Mezbaha Teknolojileri referansı.${p.capacity ? ` Kapasite: ${capacityTr(p.capacity)}.` : ""}`;
    } else if (t.seoDescription.length < 70) {
      data.seoDescription = `${t.seoDescription.replace(/\.$/, "")}. Mezbaha Teknolojileri referansı, teklif için iletişime geçin.`;
    }
    if (!Object.keys(data).length) continue;
    check(`proje ${p.id}`, data.seoTitle, data.seoDescription);
    await prisma.projectTranslation.update({ where: { id: t.id }, data });
    n++;
    console.log(t.name, "→", data.seoTitle ?? "", "|", data.seoDescription ?? "");
  }

  const page = await prisma.pageTranslation.findFirst({ where: { locale: "tr", title: "Endüstriyel Soğutma Sistemleri", seoDescription: null } });
  if (page) {
    const d = "Mezbaha ve et işleme tesisleri için endüstriyel soğutma sistemleri: soğuk oda ve karkas soğutma çözümleri. Teklif için iletişime geçin.";
    check("sayfa", undefined, d);
    await prisma.pageTranslation.update({ where: { id: page.id }, data: { seoDescription: d } });
  }
  console.log("ürün", Object.keys(PRODUCTS).length, "yazı", Object.keys(POSTS).length, "proje", n, "sayfa", page ? 1 : 0);
}
main().finally(() => prisma.$disconnect());
