/**
 * Mevcut blog yazılarına konularına göre etiket atar (SEO: tutarlı bir etiket sözlüğü, her etiket birden çok yazıda).
 * Etiketler yazı başlığındaki konudan çıkarılmıştır; yazı içeriği değiştirilmez.
 * İdempotent: yalnızca hiç etiketi OLMAYAN yazılara dokunur, etiketleri slug'a göre upsert eder (görünen ad `name`).
 * Kullanım: npx tsx prisma/migration/tag-blog-posts.ts [--dry-run]
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { slugify } from "./slug";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const DRY = process.argv.includes("--dry-run");

const TAGS: Record<string, string[]> = {
  "rayli-tasima-sistemleri-ikizray-nedir-ve-neden-kullanilir": ["İkizray", "Raylı Taşıma Sistemleri", "Karkas Taşıma", "Mezbaha Ekipmanları"],
  "mezbaha-hijyeni-nasil-saglanir": ["Mezbaha Hijyeni", "Et Kalitesi", "Mezbaha Sistemleri"],
  "karkas-tasima-sistemleri-et-kalitesini-nasil-etkiler": ["Karkas Taşıma", "Et Kalitesi", "İkizray", "Raylı Taşıma Sistemleri"],
  "et-parcalama-testereleri-hizli-ve-guvenli-kesim-ekipmanlari": ["Et Parçalama Testeresi", "Kesim Ekipmanları", "İş Güvenliği", "Mezbaha Makineleri"],
  "otomatik-deri-yuzme-sistemleri-ile-iscilik-maliyeti-nasil-azalir": ["Deri Yüzme Makinası", "İşçilik Maliyeti", "Mezbaha Otomasyonu", "Verimlilik"],
  "hidrolik-deri-yuzme-makinasi-mi-mekanik-deri-yuzme-makinasi-mi": ["Deri Yüzme Makinası", "Hidrolik Sistemler", "Kesim Ekipmanları", "Mezbaha Makineleri"],
  "dos-acma-testeresi-ile-hizli-ve-hijyenik-kesim-icin-ipuclari": ["Döş Açma Testeresi", "Kesim Ekipmanları", "Mezbaha Hijyeni", "Et Parçalama Testeresi"],
  "ayak-kesme-makasi-avantajlari": ["Ayak Kesme Makası", "Kesim Ekipmanları", "İş Güvenliği", "Mezbaha Makineleri"],
  "soguk-oda-ve-ikizray-sistemleri-et-kalitesini-nasil-etkiler": ["Soğuk Oda", "İkizray", "Et Kalitesi", "Raylı Taşıma Sistemleri"],
  "robotik-mezbaha-sistemleri-nedir": ["Robotik Mezbaha", "Mezbaha Otomasyonu", "Teknoloji", "Verimlilik"],
  "iskembe-atik-pompasi-ile-atik-yonetimi": ["Atık Yönetimi", "İşkembe Atık Pompası", "Mezbaha Hijyeni", "Mezbaha Ekipmanları"],
  "buyukbas-sersemletme-sistemleri": ["Sersemletme", "Büyükbaş Mezbaha", "Hayvan Refahı", "Mezbaha Ekipmanları"],
  "mezbahane-teknolojik-ekipmanlar": ["Mezbaha Ekipmanları", "Teknoloji", "Mezbaha Otomasyonu", "Mezbaha Makineleri"],
  "mezbaha-kullanmaya-gecmenin-finansal-avantajlari": ["Mezbaha Kurulumu", "Kurulum Maliyeti", "Verimlilik"],
  "kesim-oncesi-hayvan-stresi-azaltma": ["Hayvan Refahı", "Et Kalitesi", "Mezbaha Tasarımı"],
  "devlet-tesvigi-ile-mezbaha-kurmak": ["Devlet Teşviki", "Mezbaha Kurulumu", "Kurulum Maliyeti"],
  "et-kalitesini-artiran-mezbaha-uygulamalari": ["Et Kalitesi", "Mezbaha Hijyeni", "Mezbaha Sistemleri", "Verimlilik"],
  "kesimhanelerde-enerji-tasarrufu-saglama": ["Enerji Tasarrufu", "Soğuk Oda", "Verimlilik", "Mezbaha Sistemleri"],
  "mezbaha-kurmak-ne-kadar-surer": ["Mezbaha Kurulumu", "Kurulum Süreci", "Mezbaha Belgeleri"],
  "mezbaha-tasariminda-hayvan-refahi-koruma": ["Hayvan Refahı", "Mezbaha Tasarımı", "Mezbaha Sistemleri"],
  "modern-mezbaha-ekipmanlari-nelerdir": ["Mezbaha Ekipmanları", "Mezbaha Makineleri", "Mezbaha Sistemleri", "Teknoloji"],
  "mezbaha-kurulumunda-hangi-belgeler-gereklidir": ["Mezbaha Belgeleri", "Mezbaha Kurulumu", "Kurulum Süreci"],
  "kucukbas-buyukbas-mezbaha-farki": ["Küçükbaş Mezbaha", "Büyükbaş Mezbaha", "Mezbaha Sistemleri"],
  "mezbaha-kurulum-maliyeti": ["Kurulum Maliyeti", "Mezbaha Kurulumu", "Mezbaha Sistemleri"],
  "mezbaha-otomasyonu-verimlilik-artisi": ["Mezbaha Otomasyonu", "Verimlilik", "Teknoloji", "İşçilik Maliyeti"],
  "modern-mezbaha-sistemleri-nedir": ["Mezbaha Sistemleri", "Mezbaha Ekipmanları", "Mezbaha Otomasyonu", "Teknoloji"],
  "sigir-kesiminde-en-sik-kullanilan-makineler-nelerdir": ["Büyükbaş Mezbaha", "Mezbaha Makineleri", "Kesim Ekipmanları"],
  "modern-makinelerle-bir-hayvanin-islenmesi-ne-kadar-surer": ["Mezbaha Makineleri", "Verimlilik", "Mezbaha Otomasyonu"],
  "kucuk-ciftlikler-mezbaha-makineleri-kullanabilir-mi": ["Küçük Ölçekli Mezbaha", "Mezbaha Makineleri", "Mezbaha Kurulumu"],
  "mezbahalarda-kullanilan-makineler-guvenli-mi": ["İş Güvenliği", "Hayvan Refahı", "Mezbaha Makineleri"],
  "mezbaha-makineleri-et-kalitesini-etkiler-mi": ["Et Kalitesi", "Mezbaha Makineleri", "Mezbaha Hijyeni"],
  "online-magazamiz-yayinda": ["Online Mağaza", "Mezbaha Ekipmanları"],
};

async function main() {
  const posts = await prisma.blogPost.findMany({ select: { id: true, slug: true, tags: { select: { id: true } } } });
  let tagged = 0;
  const seen = new Set<string>();

  for (const post of posts) {
    const names = TAGS[post.slug];
    if (!names) {
      console.log("etiket planı yok:", post.slug);
      continue;
    }
    if (post.tags.length > 0) continue; // dokunma
    if (DRY) {
      console.log(post.slug, "→", names.join(", "));
      tagged++;
      continue;
    }
    const ids: string[] = [];
    for (const name of names) {
      const slug = slugify(name);
      seen.add(slug);
      const tag = await prisma.blogTag.upsert({ where: { slug }, create: { slug, name }, update: { name } });
      ids.push(tag.id);
    }
    await prisma.blogPost.update({ where: { id: post.id }, data: { tags: { set: ids.map((id) => ({ id })) } } });
    tagged++;
  }
  console.log(`${DRY ? "[dry-run] " : ""}${tagged} yazı etiketlendi${DRY ? "" : `, ${seen.size} benzersiz etiket`}.`);
}

main().finally(() => prisma.$disconnect());
