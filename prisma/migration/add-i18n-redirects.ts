/**
 * Eski sitenin EN/RU adreslerinden yeni çok dilli adreslere 301 yönlendirmeleri (Redirect tablosu).
 *  - varlık sayfaları: docs/i18n-slug-map.json (import-translations.ts çıktısı: eski adres → yeni slug)
 *  - statik sayfalar: aşağıdaki STATIC listesi (TR yönlendirmeleriyle aynı hedef mantığı)
 * Eski İngilizce adresler KÖKTEDİR (/slaughterhouse-equipments/); yeni Türkçe rotalarla (ör. /blog) çakışan kaynaklar atlanır.
 * Kaynağı ile hedefi aynı olan kayıtlar atlanır (döngü olmasın).
 *
 * VARSAYILAN: kayıtlar PASİF (active=false) eklenir — hedef diller (ENABLED_LOCALES) açılana kadar /en, /ru adresleri 404 verir.
 * Dilleri açarken: npx tsx prisma/migration/add-i18n-redirects.ts --activate
 * Kuru çalıştırma: --dry. İdempotent (sourcePath benzersiz).
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const DRY = process.argv.includes("--dry");
const ACTIVATE = process.argv.includes("--activate");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const RESERVED_ROOT = new Set(["urunler", "urun", "projeler", "blog", "hizmetler", "kataloglar", "referanslar", "videolar", "hakkimizda", "iletisim", "teklif-al", "admin", "api", "uploads", "images", "en", "ru", "de", "fr", "ar", "tr", "sitemap.xml", "robots.txt", "llms.txt"]);

type SlugRow = { lang: "en" | "ru"; kind: "product" | "category" | "blog"; oldUrl: string; oldSlug: string; newSlug: string };
const slugMap: SlugRow[] = JSON.parse(readFileSync("docs/i18n-slug-map.json", "utf8"));

const ROUTE: Record<"en" | "ru", Record<SlugRow["kind"], string>> = {
  en: { product: "product", category: "products", blog: "blog" },
  ru: { product: "produkt", category: "produkty", blog: "blog" },
};

const STATIC: [string, string][] = [
  // İngilizce (eski adresler kökte)
  ["/2018-slaughterhouse-catalog", "/en/catalogs/2018-mezbaha-sistemleri-katalog"],
  ["/corporate", "/en/corporate"],
  ["/contact-us", "/en/contact-us"],
  ["/catalogs", "/en/catalogs"],
  ["/project-images", "/en/projects"],
  ["/slaughterhouse-project", "/en/projects"],
  ["/projects", "/en/projects"],
  ["/references", "/en/references"],
  ["/sales-network", "/en/corporate"],
  ["/representations", "/en/corporate"],
  ["/slaughterhouse-product-videos", "/en/videos"],
  // Rusça
  ["/ru/katalog-sistem-mezbaha-2018", "/ru/katalogi/2018-mezbaha-sistemleri-katalog"],
  ["/ru/proekty-kartinki", "/ru/proekty"],
  ["/ru/set-prodazh", "/ru/kompaniya"],
  ["/ru/predstavitelstva", "/ru/kompaniya"],
  ["/ru/ssylki-716", "/ru/referencii"],
  ["/ru/video-mezbaha-makinalari", "/ru/video"],
];

async function main() {
  const rows = new Map<string, string>();
  const skipped: string[] = [];

  for (const m of slugMap) {
    const src = m.lang === "en" ? `/${m.oldSlug}` : `/ru/${m.oldSlug}`;
    const dst = `/${m.lang}/${ROUTE[m.lang][m.kind]}/${m.newSlug}`;
    if (m.lang === "en" && RESERVED_ROOT.has(m.oldSlug)) {
      skipped.push(`${src} (Türkçe rota ile çakışır)`);
      continue;
    }
    rows.set(src, dst);
  }
  for (const [src, dst] of STATIC) {
    if (src === dst) continue;
    const first = src.split("/")[1];
    if (!src.startsWith("/ru/") && RESERVED_ROOT.has(first)) {
      skipped.push(`${src} (Türkçe rota ile çakışır)`);
      continue;
    }
    rows.set(src, dst);
  }

  console.log(`yönlendirme: ${rows.size}${skipped.length ? ` · atlanan: ${skipped.join(", ")}` : ""}`);
  if (DRY) {
    for (const [s, d] of [...rows].slice(0, 12)) console.log(" ", s, "→", d);
    return;
  }

  if (ACTIVATE) {
    const r = await prisma.redirect.updateMany({ where: { sourcePath: { in: [...rows.keys()] } }, data: { active: true } });
    console.log("etkinleştirildi:", r.count);
    return;
  }

  let created = 0;
  for (const [sourcePath, destinationPath] of rows) {
    const exists = await prisma.redirect.findUnique({ where: { sourcePath } });
    if (exists) continue;
    await prisma.redirect.create({ data: { sourcePath, destinationPath, statusCode: 301, active: false } });
    created++;
  }
  console.log("eklendi (pasif):", created);
}
main().finally(() => prisma.$disconnect());
