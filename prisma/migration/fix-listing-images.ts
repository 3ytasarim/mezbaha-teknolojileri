/**
 * Phase 12 öncesi düzeltme: eski sitenin KATEGORİ LİSTESİ küçük resimlerini (uploads/services/thumb/...)
 * ürün kartı görseli (Product.coverImage) olarak alır ve ürün sırasını (Product.sortOrder) eski
 * kategori sayfasındaki sıraya göre yazar.
 *
 * Neden: ilk taşımada kart görseli olarak ürün galerisinin ilk fotoğrafı kullanılmıştı; eski sitede kartlar
 * ürüne özel "thumb" görseli gösteriyor. Ayrıca Product.sortOrder hiç yazılmadığı için kategori sayfası
 * kaynak sırasında değildi.
 *
 * Nazik tarama (2 eşzamanlı, bekleme, yeniden deneme), gerçek dosya imzasıyla uzantı (jpg/webp/png),
 * provenance Media.sourceUrl. Idempotent. Kullanım: npx tsx prisma/migration/fix-listing-images.ts [--dry-run]
 */
import "dotenv/config";
import { createHash } from "crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import * as cheerio from "cheerio";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getCanonicalProductSlug } from "./parse-redirect-map";
import { ensureMediaForImage } from "./media";
import { newMigrationStats } from "./types";

const DRY = process.argv.includes("--dry-run");
const ROOT = path.join(__dirname, "..", "..");
const UA = "MezbahaMigrationBot/1.0 (+content migration)";
const CATEGORY_PAGES = ["buyukbas-mezbaha-makinalari", "kucukbas-mezbaha-makinalari", "kurban-kesim", "mezbaha-sistemleri"];
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

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
      last = new Error("HTTP " + r.status);
    } catch (e) { last = e; }
    await sleep(600 * 2 ** i);
  }
  throw last;
}

async function main() {
  const stats = newMigrationStats();
  const rows: string[] = [];
  const prov: { slug: string; sourceUrl: string; sourceHash: string; localPath: string; order: number }[] = [];
  let updated = 0, missing = 0, unchanged = 0;

  for (const cat of CATEGORY_PAGES) {
    const html = await (await fetch("https://www.mezbahateknolojileri.com/tr/" + cat + "/", { headers: { "User-Agent": UA } })).text();
    const $ = cheerio.load(html);
    const cards = $("a[href*='/tr/']")
      .map((_, a) => {
        const img = $(a).find("img").filter((__, im) => /\/thumb\//.test($(im).attr("data-src") || $(im).attr("src") || "")).first();
        return img.length ? { href: $(a).attr("href")!, thumb: (img.attr("data-src") || img.attr("src"))!, alt: $(a).text().trim() } : null;
      })
      .get()
      .filter(Boolean) as { href: string; thumb: string; alt: string }[];
    const unique = [...new Map(cards.map((c) => [c.href, c])).values()];
    console.log(cat + ": " + unique.length + " kart");

    for (let i = 0; i < unique.length; i++) {
      const c = unique[i];
      const slug = getCanonicalProductSlug(c.href) ?? null;
      const product = slug ? await prisma.product.findUnique({ where: { slug }, include: { translations: { where: { locale: "tr" } } } }) : null;
      if (!slug || !product) { missing++; rows.push("| " + c.href + " | ürün DB'de yok | - |"); continue; }

      const buf = await fetchBuf(c.thumb);
      const ext = sniffExt(buf);
      if (!ext) { rows.push("| " + slug + " | tanınmayan görsel biçimi | - |"); continue; }
      const rel = "public/images/migrated/products/" + slug + "/thumb." + ext;
      const abs = path.join(ROOT, rel);
      mkdirSync(path.dirname(abs), { recursive: true });
      if (!existsSync(abs) || !readFileSync(abs).equals(buf)) writeFileSync(abs, buf);

      const name = product.translations[0]?.name ?? slug;
      const url = await ensureMediaForImage(prisma, { sourceUrl: c.thumb, localPath: rel, alt: name }, DRY, stats);
      if (!url) { rows.push("| " + slug + " | Media oluşturulamadı | - |"); continue; }

      const order = i + 1;
      const same = product.coverImage === url && product.sortOrder === order;
      if (same) unchanged++;
      else {
        updated++;
        rows.push("| " + slug + " | cover: " + (product.coverImage ?? "NULL") + " → " + url + " ; sıra " + product.sortOrder + " → " + order + " | " + c.thumb + " |");
        if (!DRY) await prisma.product.update({ where: { id: product.id }, data: { coverImage: url, sortOrder: order } });
      }
      prov.push({ slug, sourceUrl: c.thumb, sourceHash: createHash("sha256").update(buf).digest("hex"), localPath: rel, order });
      await sleep(200);
    }
  }

  const md = [
    "# Liste küçük resimleri + sıra düzeltmesi", "",
    "Mod: " + (DRY ? "DRY-RUN" : "UYGULANDI") + " — " + new Date().toISOString(), "",
    "- Kart görseli + sıra güncellenen ürün: **" + updated + "**, zaten doğru: " + unchanged + ", eşleşmeyen: " + missing, "",
    "| Ürün | Değişiklik | Kaynak küçük resim |", "|---|---|---|", ...rows,
  ].join("\n");
  writeFileSync(path.join(ROOT, "docs", "listing-thumbnails-fix.md"), md, "utf-8");
  if (!DRY) writeFileSync(path.join(ROOT, "docs", "listing-thumbnails-provenance.json"), JSON.stringify({ updatedAt: new Date().toISOString(), records: prov }, null, 2), "utf-8");
  console.log(JSON.stringify({ updated, unchanged, missing, media: stats.media }));
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
