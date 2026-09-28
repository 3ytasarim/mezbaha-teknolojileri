/**
 * Phase 11D: Endüstriyel Soğutma Sistemleri hizmet sayfası artık var → Phase 11C'de kaldırılan
 * ("Soğutma sistemleri" anchor'lı) iç linki geri ekler. Kaynak makaledeki orijinal link buydu.
 * Yalnızca link öncesi hali birebir eşleşirse değiştirir (tam 1 eşleşme şart); idempotent.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const DRY = process.argv.includes("--dry-run");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const SLUG = "mezbahane-teknolojik-ekipmanlar";
const BEFORE = "<strong>Soğutma sistemleri</strong>";
const AFTER = '<strong><a href="/hizmetler/endustriyel-sogutma-sistemleri" rel="noopener noreferrer">Soğutma sistemleri</a></strong>';

async function main() {
  const page = await prisma.page.findUnique({ where: { slug: "endustriyel-sogutma-sistemleri" } });
  if (!page) throw new Error("Hedef hizmet sayfası DB'de yok; link geri eklenmedi.");

  const post = await prisma.blogPost.findUnique({ where: { slug: SLUG }, include: { translations: { where: { locale: "tr" } } } });
  const tr = post?.translations[0];
  if (!tr?.content) throw new Error("Yazı bulunamadı: " + SLUG);

  if (tr.content.includes(AFTER)) return console.log("Zaten geri eklenmiş, işlem yok.");
  const count = tr.content.split(BEFORE).length - 1;
  if (count !== 1) throw new Error("Beklenen tam 1 eşleşme, bulunan: " + count + " — dokunulmadı.");

  if (!DRY) await prisma.blogPostTranslation.update({ where: { id: tr.id }, data: { content: tr.content.replace(BEFORE, AFTER) } });
  console.log((DRY ? "[DRY] " : "") + "Link geri eklendi: " + SLUG + " -> /hizmetler/endustriyel-sogutma-sistemleri");
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
