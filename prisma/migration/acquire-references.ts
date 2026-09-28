/**
 * Eski sitenin /tr/referanslar/ sayfasındaki referans listesi (61 kurum/tesis) + tek görsel.
 * Metinler kaynakla AYNEN (büyük harf) alınır; ad/yer ayrımı yalnızca sondaki parantezden yapılır. Tür (belediye mezbahası,
 * monoray hattı, soğuk oda…) adın içindeki anahtar kelimelerden belirlenir — yeni bilgi eklenmez.
 * Çıktı: src/content/legacy/references.json, public/images/references/*, docs/references-provenance.json
 * Kullanım: npx tsx prisma/migration/acquire-references.ts
 */
import { createHash } from "crypto";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";

const ROOT = path.join(__dirname, "..", "..");
const PAGE = "https://www.mezbahateknolojileri.com/tr/referanslar/";
const UA = "MezbahaMigrationBot/1.0 (+content migration)";

const decode = (s: string) =>
  s
    .replace(/&Ccedil;/g, "Ç").replace(/&ccedil;/g, "ç").replace(/&Ouml;/g, "Ö").replace(/&ouml;/g, "ö")
    .replace(/&Uuml;/g, "Ü").replace(/&uuml;/g, "ü").replace(/&amp;/g, "&").replace(/&nbsp;/g, " ")
    .replace(/&#39;/g, "'").replace(/&quot;/g, '"');

const FOREIGN = ["TÜKMENİSTAN", "KIRGIZİSTAN", "AZERBAYCAN", "AFGANİSTAN", "GÜRCİSTAN", "TÜKMENİSTAN", "TÜRKMENİSTAN", "TURKMENISTAN"];

function typeOf(name: string): string {
  const n = name.toLocaleUpperCase("tr");
  if (/MONORAY/.test(n)) return "Monoray Hattı";
  if (/SOĞUK ODA/.test(n)) return "Soğuk Oda";
  if (/CEZAEVİ/.test(n)) return "Cezaevi Mezbahası";
  if (/BELEDİYE/.test(n)) return "Belediye Mezbahası";
  if (/KURBAN/.test(n)) return "Kurban Kesim Tesisi";
  if (/MEZBAHA/.test(n)) return "Mezbaha";
  if (/KESİMHANE/.test(n)) return "Kesimhane";
  if (/ET (ENTEGRE|TESİSİ|KOMBİNASI|CENTER)|SUCUK|ET VE SÜT|ENTEGRE/.test(n)) return "Et Tesisi";
  return "Tesis";
}

async function main() {
  const html = await (await fetch(PAGE, { headers: { "User-Agent": UA } })).text();
  const table = html.slice(html.indexOf("<tbody>"), html.indexOf("</tbody>"));
  const cells = [...table.matchAll(/<td>([\s\S]*?)<\/td>/g)].map((m) => m[1]);

  const items: { name: string; place: string; foreign: boolean; type: string; image?: string; imageAlt?: string }[] = [];
  const prov: unknown[] = [];

  for (const cell of cells) {
    const img = cell.match(/<img[^>]*src="([^"]+)"/)?.[1];
    const text = decode(cell.replace(/<img[^>]*>/g, "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();
    if (!text) continue;
    const m = text.match(/^(.*?)\s*\(\s*([^)]+?)\s*\)\s*$/);
    const name = (m ? m[1] : text).trim();
    const place = (m ? m[2] : "").trim();
    const foreign = FOREIGN.includes(place.toLocaleUpperCase("tr"));
    const item: (typeof items)[number] = { name, place, foreign, type: typeOf(text) };

    if (img) {
      const buf = Buffer.from(await (await fetch(img, { headers: { "User-Agent": UA } })).arrayBuffer());
      const ext = buf[0] === 0xff ? "jpg" : buf.slice(8, 12).toString() === "WEBP" ? "webp" : "png";
      const dir = path.join(ROOT, "public", "images", "references");
      mkdirSync(dir, { recursive: true });
      const file = `adal-azyk-kirgizistan.${ext}`;
      writeFileSync(path.join(dir, file), buf);
      item.image = `/images/references/${file}`;
      item.imageAlt = `${name} referans projesi`;
      prov.push({ sourceUrl: img, local: item.image, sha256: createHash("sha256").update(buf).digest("hex"), bytes: buf.length });
    }
    items.push(item);
  }

  mkdirSync(path.join(ROOT, "src", "content", "legacy"), { recursive: true });
  writeFileSync(path.join(ROOT, "src", "content", "legacy", "references.json"), JSON.stringify({ source: PAGE, items }, null, 2));
  writeFileSync(path.join(ROOT, "docs", "references-provenance.json"), JSON.stringify({ source: PAGE, fetchedAt: new Date().toISOString(), count: items.length, images: prov }, null, 2));
  console.log("referans:", items.length, "| yurt dışı:", items.filter((i) => i.foreign).length, "| görsel:", prov.length);
  console.log("türler:", [...new Set(items.map((i) => i.type))].join(", "));
}

main();
