import "dotenv/config";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { newMigrationStats, type ProvenanceRecord } from "./migration/types";
import { reconcileKnownTestSlugs } from "./migration/reconcile";
import { importRedirects } from "./migration/import-redirects";
import { importCategories } from "./migration/import-categories";
import { importProjects } from "./migration/import-projects";
import { importProducts } from "./migration/import-products";
import { importBlogPosts } from "./migration/import-blog";

const DRY_RUN = process.argv.includes("--dry-run");
const ROOT = path.join(__dirname, "..");

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function formatStatsSection(title: string, stats: { new: number; updated: number; skipped: number; errors: { source: string; reason: string }[] }) {
  const lines = [
    `### ${title}`,
    "",
    `- Yeni: ${stats.new}`,
    `- Güncellendi: ${stats.updated}`,
    `- Değişmedi (atlandı): ${stats.skipped}`,
    `- Hata: ${stats.errors.length}`,
  ];
  if (stats.errors.length > 0) {
    lines.push("", "**Hatalar:**");
    for (const e of stats.errors) lines.push(`- \`${e.source}\`: ${e.reason}`);
  }
  return lines.join("\n");
}

/** entityId'leri DB'den çözüp docs/migration-provenance.json'a yazar (yalnızca gerçek çalıştırma). */
async function writeProvenance(records: ProvenanceRecord[]) {
  const out = path.join(ROOT, "docs", "migration-provenance.json");
  // İlk import zamanını koru: aynı kayıt + aynı kaynak özeti ise önceki importedAt değişmez.
  const previous = new Map<string, ProvenanceRecord>();
  if (existsSync(out)) {
    for (const r of (JSON.parse(readFileSync(out, "utf-8")).records ?? []) as ProvenanceRecord[]) previous.set(`${r.entityType}:${r.slug}`, r);
  }
  const resolved: ProvenanceRecord[] = [];
  for (const r of records) {
    let id: string | null = null;
    if (r.entityType === "product") id = (await prisma.product.findUnique({ where: { slug: r.slug }, select: { id: true } }))?.id ?? null;
    else if (r.entityType === "blogPost") id = (await prisma.blogPost.findUnique({ where: { slug: r.slug }, select: { id: true } }))?.id ?? null;
    else if (r.entityType === "project") id = (await prisma.project.findUnique({ where: { slug: r.slug }, select: { id: true } }))?.id ?? null;
    else id = (await prisma.productCategory.findUnique({ where: { slug: r.slug }, select: { id: true } }))?.id ?? null;
    const prev = previous.get(`${r.entityType}:${r.slug}`);
    resolved.push({ ...r, entityId: id, importedAt: prev && prev.sourceHash === r.sourceHash ? prev.importedAt : r.importedAt });
  }
  writeFileSync(out, JSON.stringify({ generatedAt: new Date().toISOString(), count: resolved.length, records: resolved }, null, 2), "utf-8");
  console.log(`Provenance: ${resolved.length} kayıt -> docs/migration-provenance.json`);
}

async function main() {
  console.log(`Migration ${DRY_RUN ? "(DRY RUN — DB'ye YAZILMAYACAK)" : "(GERÇEK ÇALIŞTIRMA)"} başlıyor...\n`);

  const stats = newMigrationStats();

  console.log("0. Bilinen test-slug uzlaştırması...");
  const reconcileNotes = await reconcileKnownTestSlugs(prisma, DRY_RUN);
  for (const note of reconcileNotes) console.log(`   ${note}`);

  console.log("1. Redirect'ler (url-migration-map.md)...");
  await importRedirects(prisma, DRY_RUN, stats);
  console.log(`   Yeni: ${stats.redirects.new}, Güncellendi: ${stats.redirects.updated}, Çakışma: ${stats.redirects.conflicts.length}`);

  console.log("2. Ürün kategorileri...");
  const categorySlugToId = await importCategories(prisma, DRY_RUN, stats);
  console.log(`   Yeni: ${stats.categories.new}, Güncellendi: ${stats.categories.updated}, Atlandı: ${stats.categories.skipped}`);

  console.log("3. Projeler (referans + kapasite paketleri)...");
  await importProjects(prisma, DRY_RUN, stats);
  console.log(`   Yeni: ${stats.projects.new}, Güncellendi: ${stats.projects.updated}, Atlandı: ${stats.projects.skipped}`);

  console.log("4. Ürünler...");
  await importProducts(prisma, categorySlugToId, DRY_RUN, stats);
  console.log(`   Yeni: ${stats.products.new}, Güncellendi: ${stats.products.updated}, Atlandı: ${stats.products.skipped}, Hata: ${stats.products.errors.length}`);

  console.log("5. Blog yazıları...");
  await importBlogPosts(prisma, DRY_RUN, stats);
  console.log(`   Yeni: ${stats.blogPosts.new}, Güncellendi: ${stats.blogPosts.updated}, Atlandı: ${stats.blogPosts.skipped}, Hata: ${stats.blogPosts.errors.length}`);

  console.log(`\nMedya: indirilen/oluşturulan ${stats.media.downloaded}, yeniden kullanılan ${stats.media.reused}, başarısız ${stats.media.failed}`);

  if (!DRY_RUN) await writeProvenance(stats.provenance);

  const report = [
    `# Migration ${DRY_RUN ? "Dry Run" : "Import"} Report`,
    "",
    `Çalıştırma zamanı: ${new Date().toISOString()}`,
    "",
    formatStatsSection("Categories", stats.categories),
    "",
    formatStatsSection("Products", stats.products),
    "",
    formatStatsSection("Projects", stats.projects),
    "",
    formatStatsSection("Blog Posts", stats.blogPosts),
    "",
    "### Media",
    "",
    `- İndirilen/oluşturulan: ${stats.media.downloaded}`,
    `- Yeniden kullanılan (dedupe): ${stats.media.reused}`,
    `- Başarısız: ${stats.media.failed}`,
    "",
    "### Redirects",
    "",
    `- Yeni: ${stats.redirects.new}`,
    `- Güncellendi: ${stats.redirects.updated}`,
    `- Çakışma/atlandı: ${stats.redirects.conflicts.length}`,
    ...(stats.redirects.conflicts.length > 0
      ? ["", "**Çakışmalar:**", ...stats.redirects.conflicts.map((c) => `- \`${c.source}\`: ${c.reason}`)]
      : []),
    "",
    "### Diff Detayları",
    "",
    ...(stats.diffs.length > 0 ? stats.diffs.map((d) => `- ${d}`) : ["(değişiklik yok)"]),
  ].join("\n");

  const reportPath = path.join(
    ROOT,
    "docs",
    DRY_RUN ? "migration-dry-run.md" : "migration-import-report.md"
  );
  writeFileSync(reportPath, report, "utf-8");
  // Her çalıştırma ayrıca zaman damgalı arşivlenir; sonraki koşular önceki raporun üzerine yazıp kaybettirmesin.
  const archiveDir = path.join(ROOT, "docs", "migration-runs");
  mkdirSync(archiveDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  writeFileSync(path.join(archiveDir, `${DRY_RUN ? "dry-run" : "import"}-${stamp}.md`), report, "utf-8");
  console.log(`\nRapor yazıldı: ${path.relative(ROOT, reportPath)}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
