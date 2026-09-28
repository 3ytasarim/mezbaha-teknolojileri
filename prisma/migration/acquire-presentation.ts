/**
 * Ana sayfadaki "PRESENTATİON" bölümü (eski sitenin referans projeler slaytı): 19 proje + görseller + arka plan.
 * Kaynak: https://www.mezbahateknolojileri.com/tr/ (.s4 owl-carousel). Metinler kaynakla AYNEN (İngilizce, büyük harf).
 * Çıktı: public/images/presentation/*, src/content/legacy/presentation.json, docs/presentation-provenance.json
 * Kullanım: npx tsx prisma/migration/acquire-presentation.ts
 */
import { createHash } from "crypto";
import { mkdirSync, writeFileSync } from "fs";
import path from "path";

const ROOT = path.join(__dirname, "..", "..");
const ORIGIN = "https://www.mezbahateknolojileri.com";
const UA = "MezbahaMigrationBot/1.0 (+content migration)";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Tarayıcıda (.s4 slaytından) okunan gerçek veri: [ülke, başlık, şehir, tür, kapasite, görsel dosyası]
const RAW: [string, string, string, string, string, string][] = [
  ["NETHERLANDS", "SLAUGHTERHOUSE IN NETHERLANDS", "HARDERWICJK", "SLAUGHTERHOUSE", "180 SHEEP / HOUR", "content_thumb_1786971351.webp"],
  ["AZERBAIJAN", "SLAUGHTERHOUSE IN AZERBAIJAN", "GOBUSTAN", "SLAUGHTERHOUSE", "150 CATTLE 1500 SHEEP", "content_thumb_1786971590.webp"],
  ["QATAR", "SLAUGHTERHOUSE IN QATAR", "AL KHOOR", "SLAUGHTERHOUSE", "100 CATTLE PER SHIFT", "content_thumb_1786971372.webp"],
  ["PORTO RICO", "ROTATION CATTLE BOXPORTO RICO", "SAN JUAN", "ROTATION CATTLE BOX", "60 CATTLE-HOUR", "content_thumb_1786971143.webp"],
  ["MOROCCO", "MODERN SLAUGHTERHOUSE MOROCCO", "KENITRA", "SLAUGHTERHOUSE", "500 CATTLE 3000 SHEEP", "content_thumb_1786971477.webp"],
  ["KIRGIZISTAN", "SLAUGHTERHOUSE IN KYRGYZSTAN", "KARAKOL", "SLAUGHTERHOUSE", "200 CATTLE 1500 SHEEP", "content_thumb_1786971451.webp"],
  ["GEORGIA", "SLAUGHTERHOUSE IN GEORGIA", "KHASHURI", "SLAUGHTERHOUSE", "25 CATTLE 25 PIG", "content_thumb_1786971806.webp"],
  ["TURKMENISTAN", "SLAUGHTERHOUSE IN TURKMENISTAN", "ASKABAT", "SLAUGHTERHOUSE", "100 CATTLE 300 SHEEP", "content_thumb_1786971848.webp"],
  ["ARGENTINA", "CATTLE DEHIDING IN ARGENTINA", "BUENOS AIRES", "LEATHER SKINNING", "100 CATTLE-HOUR", "content_thumb_1786971186.webp"],
  ["AZERBAIJAN", "MEAT PROCESSING FACTORY IN AZERBAIJAN", "BAKU", "MEAT PROCESSING", "200 CATTLE 400 SHEEP", "content_thumb_1786971826.webp"],
  ["TURKİYE", "SLAUGHTERHOUSE IN TURKEY", "ÇORUM", "SLAUGHTERHOUSE", "700 CATTLE 3000 SHEEP", "content_thumb_1786971328.webp"],
  ["BOSNIA AND HERZEGOVINIA", "ROTATIONAL CATTLE BOX BOSNIA AND HERZEGOVINIA", "PRIJEDOR", "ROTATIONAL CATTLE BOX", "60 CATTLE-HOUR", "content_thumb_1786971397.webp"],
  ["ALBANIA", "SLAUGHTERHOUSE IN ALBANIA", "POGRADEC", "MICRO SLAUGHTERHOUSE", "50 CATTLE", "content_thumb_1786971687.webp"],
  ["KIRGIZISTAN", "MEAT PROCESSING IN KYRGYZSTAN", "", "MEAT PROCESSING COLD ROOM", "", "content_thumb_1786971778.webp"],
  ["AZERBAIJAN", "SLAUGHTERHOUSE IN AZERBAIJAN", "", "SLAUGHTERHOUSE", "", "content_thumb_1786971291.webp"],
  ["AZERBAIJAN", "SLAUGHTERHOUSE IN AZERBAIJAN", "NOVHANI", "SLAUGHTERHOUSE", "50 CATTLE 100 SHEEP", "content_thumb_1786971743.webp"],
  ["TURKİYE", "SLAUGHTERHOUSE IN TURKEY", "AFYON", "SLAUGHTERHOUSE", "700 CATTLE 2000 SHEEP", "content_thumb_1786971507.webp"],
  ["AZERBAIJAN", "SLAUGHTERHOUSE IN AZERBAIJAN", "TOVUZ", "SLAUGHTERHOUSE", "100 CATTLE 300 SHEEP", "content_thumb_1786971531.webp"],
  ["TAJIKISTAN", "MEATFACTORY IN TAJIKISTAN", "DUŞANBE", "MEAT FACTORY", "2000 KG / HOUR", "content_thumb_1786971254.webp"],
];

function sniffExt(b: Buffer): string | null {
  if (b.length > 12 && b.slice(0, 4).toString() === "RIFF" && b.slice(8, 12).toString() === "WEBP") return "webp";
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) return "jpg";
  if (b.length > 8 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "png";
  return null;
}

async function fetchBuf(url: string): Promise<Buffer> {
  let last: unknown;
  for (let i = 0; i < 4; i++) {
    try {
      const r = await fetch(url, { headers: { "User-Agent": UA } });
      if (r.ok) return Buffer.from(await r.arrayBuffer());
      last = new Error("HTTP " + r.status + " " + url);
    } catch (e) {
      last = e;
    }
    await sleep(600 * 2 ** i);
  }
  throw last;
}

async function main() {
  const dir = path.join(ROOT, "public", "images", "presentation");
  mkdirSync(dir, { recursive: true });
  const prov: { sourceUrl: string; local: string; sha256: string; bytes: number }[] = [];

  const items = [];
  for (let i = 0; i < RAW.length; i++) {
    const [country, title, city, type, capacity, file] = RAW[i];
    const url = ORIGIN + "/uploads/contents/thumb/" + file;
    const buf = await fetchBuf(url);
    const ext = sniffExt(buf);
    if (!ext) throw new Error("Tanınmayan görsel: " + url);
    // Dosya adı slayt sırasını içerir (aynı ad yeniden kullanılmaz: önbellek sorunu olmasın)
    const name = "proje-" + String(i + 1).padStart(2, "0") + "." + ext;
    writeFileSync(path.join(dir, name), buf);
    prov.push({ sourceUrl: url, local: "public/images/presentation/" + name, sha256: createHash("sha256").update(buf).digest("hex"), bytes: buf.length });
    items.push({ id: "proje-" + (i + 1), country, title, city, type, capacity, image: "/images/presentation/" + name, sourceImage: url });
    await sleep(250);
  }

  // Bölümün turuncu arka plan görseli (eski sitenin kendi varlığı)
  const bgUrl = ORIGIN + "/templates/images/s4-bg.png";
  const bg = await fetchBuf(bgUrl);
  const bgExt = sniffExt(bg) ?? "png";
  const bgName = "presentation-bg." + bgExt;
  writeFileSync(path.join(dir, bgName), bg);
  prov.push({ sourceUrl: bgUrl, local: "public/images/presentation/" + bgName, sha256: createHash("sha256").update(bg).digest("hex"), bytes: bg.length });

  mkdirSync(path.join(ROOT, "src", "content", "legacy"), { recursive: true });
  writeFileSync(
    path.join(ROOT, "src", "content", "legacy", "presentation.json"),
    JSON.stringify({ sectionTitle: "PRESENTATİON", sourcePage: ORIGIN + "/tr/", background: "/images/presentation/" + bgName, items }, null, 2),
    "utf-8"
  );
  writeFileSync(path.join(ROOT, "docs", "presentation-provenance.json"), JSON.stringify({ importedAt: new Date().toISOString(), files: prov }, null, 2), "utf-8");
  console.log("proje:", items.length, "| dosya:", prov.length, "| toplam KB:", Math.round(prov.reduce((a, p) => a + p.bytes, 0) / 1024), "| arka plan:", bgName);
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
