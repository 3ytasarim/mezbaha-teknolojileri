/**
 * Phase 11D: eski sitedeki gerçek "Endüstriyel Soğutma Sistemleri" hizmet sayfasını CMS `Page`
 * kaydına (pageType "service") taşır. Yalnızca kaynaktaki gerçek metin: uydurma yok.
 *
 *  - Başlık: kaynak H1. Gövde: kaynak içerik kutusu (p + h2), "&nbsp;" aralık paragrafları temizlenir,
 *    sanitize edilir. Kaynakta meta description / görsel YOK → seoDescription/ogImage NULL bırakılır
 *    (render sırasında description, gerçek metnin ilk cümlesinden türetilir; DB'ye yazılmaz).
 *  - Idempotent; kayıt varsa ve içerik farklıysa (admin düzenlemiş olabilir) ATLANIR ve raporlanır.
 *
 * Kullanım: npx tsx prisma/migration/import-legacy-pages.ts [--dry-run]
 */
import "dotenv/config";
import { createHash } from "crypto";
import { existsSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import * as cheerio from "cheerio";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { sanitizeContentHtml } from "./sanitize";

const DRY = process.argv.includes("--dry-run");
const ROOT = path.join(__dirname, "..", "..");
const UA = "MezbahaMigrationBot/1.0 (+content migration)";
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const PAGES = [
  {
    slug: "endustriyel-sogutma-sistemleri",
    pageType: "service",
    sourceUrl: "https://www.mezbahateknolojileri.com/tr/endustriyel-sogutma-sistemleri/",
  },
];

async function main() {
  const provPath = path.join(ROOT, "docs", "migration-provenance-legacy.json");
  const provFile = existsSync(provPath) ? JSON.parse(readFileSync(provPath, "utf-8")) : { records: [] };
  const report: string[] = [];

  for (const def of PAGES) {
    const res = await fetch(def.sourceUrl, { headers: { "User-Agent": UA } });
    if (!res.ok) throw new Error("Kaynak alınamadı: " + def.sourceUrl + " (" + res.status + ")");
    const $ = cheerio.load(await res.text());

    const title = $("h1").first().text().trim();
    const rawTitle = $("title").first().text().trim();
    const seoTitle = rawTitle.replace(/\s*[-–|]\s*Mezbaha Teknolojileri\s*$/i, "").trim() || null;
    const box = $("p:contains('günümüzde birçok firma')").first().parent();
    if (!title || box.length === 0) throw new Error("İçerik kutusu bulunamadı: " + def.sourceUrl);

    box.find("p").each((_, p) => {
      if ($(p).text().replace(/ /g, " ").trim() === "") $(p).remove();
    });
    const content = sanitizeContentHtml((box.html() ?? "").replace(/\s+/g, " ").replace(/> </g, ">\n<").trim());
    const sourceHash = createHash("sha256").update(content).digest("hex");
    const textLen = cheerio.load(content).text().length;

    const existing = await prisma.page.findUnique({ where: { slug: def.slug }, include: { translations: { where: { locale: "tr" } } } });
    let action: string;
    if (existing) {
      const same = existing.translations[0]?.content === content && existing.translations[0]?.title === title;
      action = same ? "SKIP (aynı)" : "SKIP (DB'de farklı içerik var — admin düzenlemiş olabilir, ezilmedi)";
    } else {
      action = DRY ? "WOULD-CREATE" : "CREATE";
      if (!DRY) {
        await prisma.$transaction(async (tx) => {
          const page = await tx.page.create({ data: { slug: def.slug, pageType: def.pageType, status: "PUBLISHED" } });
          await tx.pageTranslation.create({
            data: { pageId: page.id, locale: "tr", title, content, seoTitle, seoDescription: null, ogImage: null },
          });
        });
      }
    }
    report.push("- `" + def.slug + "`: " + action + " — başlık \"" + title + "\", seoTitle \"" + seoTitle + "\", " + textLen + " karakter metin, h2: " + $(box).find("h2").length);

    if (!DRY) {
      const key = "page|" + def.slug + "|" + def.sourceUrl;
      const prev = provFile.records.find((r: { entity: string; slug: string; sourceUrl: string }) => r.entity + "|" + r.slug + "|" + r.sourceUrl === key);
      const rec = { entity: "page", slug: def.slug, sourceUrl: def.sourceUrl, sourceHash, bytes: content.length, localPath: "db:Page/" + def.slug, importedAt: prev && prev.sourceHash === sourceHash ? prev.importedAt : new Date().toISOString() };
      provFile.records = [...provFile.records.filter((r: { entity: string; slug: string; sourceUrl: string }) => r.entity + "|" + r.slug + "|" + r.sourceUrl !== key), rec];
      provFile.count = provFile.records.length;
      provFile.updatedAt = new Date().toISOString();
    }
  }

  if (!DRY) writeFileSync(provPath, JSON.stringify(provFile, null, 2), "utf-8");
  console.log((DRY ? "[DRY-RUN]\n" : "") + report.join("\n"));
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
