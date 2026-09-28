/**
 * İngilizce blog gövdelerindeki kaynak kusurlarını giderir (yalnızca locale=en, `--apply` ile yazar):
 *  - 150 karakterden uzun veya Türkçe karakterli img alt'ları → en yakın başlıktan kısa alt
 *  - <h2>/<h3> içindeki boş başlıklar silinir; başlıksız düz metin satırı (soru/başlık biçiminde) <h2> yapılır
 *  - kalıntı </span> etiketleri, "drilling" kaynaklı sondaj/rig ifadeleri (sondaj sitesinden kalma) düzeltilir
 * Kullanım: npx tsx prisma/migration/clean-en-blog.ts [--apply]
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const APPLY = process.argv.includes("--apply");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const TR = /[çğıöşüÇĞİÖŞÜ]/;
const strip = (h: string) => h.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim();

function clean(title: string, html: string): { html: string; changes: string[] } {
  const changes: string[] = [];
  let out = html;

  // Boş başlıklar
  out = out.replace(/<h([23])>\s*(?:&nbsp;)?\s*<\/h\1>\s*/g, () => (changes.push("boş başlık"), ""));
  // Kalıntı </span>
  out = out.replace(/<\/span>(?=\s*<\/(?:p|li)>)/g, () => (changes.push("</span>"), ""));
  out = out.replace(/(<img[^>]*\/>)<\/span>/g, (_m, a) => (changes.push("</span>"), a));
  // Başlıksız düz satır başlıkları (etiket dışında kalan kısa satır)
  out = out.replace(/(<\/(?:p|ul|ol|table|h[23])>)\s*\n([^<\n]{8,110})\n(?=\s*<)/g, (m, close, line) => {
    const t = line.trim();
    if (/[.!]$/.test(t) && !/\?$/.test(t)) return m;
    changes.push("düz başlık → h2");
    return `${close}\n<h2>${t}</h2>\n`;
  });
  // Başlık paragrafı olarak yazılmış tek satır (ilk paragraf sonrası): "<p>Key Documents Required ...</p>" bırakılır (kaynak biçim)

  // img alt'ları
  const heads: { at: number; text: string }[] = [];
  for (const m of out.matchAll(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/g)) heads.push({ at: m.index ?? 0, text: strip(m[1]) });
  out = out.replace(/<img\b[^>]*>/g, (tag, offset: number) => {
    const alt = tag.match(/alt="([^"]*)"/)?.[1] ?? "";
    if (alt.length <= 150 && !TR.test(alt)) return tag;
    const next = heads.find((h) => h.at > offset) ?? [...heads].reverse().find((h) => h.at < offset);
    const short = (next?.text || title).slice(0, 110).replace(/"/g, "&quot;");
    changes.push(`alt (${alt.length} kr)`);
    return tag.replace(/alt="[^"]*"/, `alt="${short}"`);
  });

  // Sondaj sitesinden kalan ifadeler
  out = out.replace(/many drilling operations/g, () => (changes.push("drilling"), "many slaughterhouse operations"));
  out = out.replace(/many drilling contractors/g, () => (changes.push("drilling"), "many meat processors"));
  out = out.replace(/drilling contractors/g, () => (changes.push("drilling"), "meat processors"));
  out = out.replace(/drilling operations/g, () => (changes.push("drilling"), "slaughterhouse operations"));
  return { html: out, changes };
}

async function main() {
  const rows = await prisma.blogPostTranslation.findMany({ where: { locale: "en" }, select: { id: true, slug: true, title: true, content: true } });
  let n = 0;
  for (const r of rows) {
    if (!r.content) continue;
    const { html, changes } = clean(r.title, r.content);
    if (changes.length === 0) continue;
    n++;
    console.log(r.slug, "|", [...new Set(changes)].join(", "), `(${changes.length})`);
    if (APPLY) await prisma.blogPostTranslation.update({ where: { id: r.id }, data: { content: html } });
  }
  console.log(APPLY ? `güncellendi: ${n}` : `kuru çalıştırma: ${n} yazı etkilenecek`);
}
main().finally(() => prisma.$disconnect());
