/**
 * Phase 11D: kurtarılan yayın tarihlerini BAĞIMSIZ ikinci bir kanıtla çapraz doğrular.
 * Kaynak sitede yüklenen dosya adları Unix zaman damgasıyla başlar
 * (ör. uploads/news/1767081839freepik...jpg -> 2025-12-30). Yazının görselinin yükleme günü ile
 * blog kartındaki yayın tarihi ±1 gün içinde uyuşuyorsa tarih iki bağımsız kanıtla desteklenir.
 * Salt-okunur (DB'ye yazmaz). Çıktı: docs/publish-date-corroboration.md
 */
import "dotenv/config";
import { readFileSync, writeFileSync } from "fs";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { getCanonicalBlogSlug } from "./parse-redirect-map";
import { slugify } from "./slug";

const ROOT = path.join(__dirname, "..", "..");
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

type Src = { sourceUrl: string; title?: string; coverImageSourceUrl?: string | null; inlineImages?: { sourceUrl: string }[] };

async function main() {
  const src: Src[] = ["blog-posts-batch1.json", "blog-posts-batch2.json"].flatMap(
    (f) => JSON.parse(readFileSync(path.join(ROOT, "docs", "migration-data", f), "utf-8")).posts
  );
  const rows: string[] = [];
  let withTs = 0, agree = 0, noTs = 0, disagree = 0;

  for (const s of src) {
    const slug = getCanonicalBlogSlug(s.sourceUrl) ?? (s.title ? slugify(s.title) : "?");
    const post = await prisma.blogPost.findUnique({ where: { slug }, select: { publishedAt: true } });
    const db = post?.publishedAt ? post.publishedAt.toISOString().slice(0, 10) : null;
    const urls = [s.coverImageSourceUrl, ...(s.inlineImages ?? []).map((i) => i.sourceUrl)].filter(Boolean) as string[];
    const stamps = [...new Set(
      urls.map((u) => u.match(/\/uploads\/news\/(\d{10})/)?.[1]).filter(Boolean).map((t) => new Date(Number(t) * 1000).toISOString().slice(0, 10))
    )];
    if (stamps.length === 0) { noTs++; rows.push("| " + slug + " | " + db + " | (görsel yok/zaman damgasız) | - |"); continue; }
    withTs++;
    const diff = db ? Math.min(...stamps.map((d) => Math.abs((Date.parse(d) - Date.parse(db)) / 86400000))) : NaN;
    const ok = diff <= 1;
    if (ok) agree++; else disagree++;
    rows.push("| " + slug + " | " + db + " | " + stamps.join(", ") + " | " + (ok ? "EŞLEŞTİ (±" + diff + " gün)" : "FARKLI (" + diff + " gün)") + " |");
  }

  writeFileSync(
    path.join(ROOT, "docs", "publish-date-corroboration.md"),
    [
      "# Publish Date Corroboration (Phase 11D)", "",
      "İkinci, bağımsız kanıt: kaynak sitede yüklenen görsel dosya adlarının Unix zaman damgası ön eki (`uploads/news/<unix>...`) → yükleme günü. Blog kartındaki yayın tarihiyle (`docs/publish-date-evidence.md`) karşılaştırıldı.", "",
      "- Zaman damgalı görseli olan yazı: **" + withTs + "**, ±1 gün içinde eşleşen: **" + agree + "**, farklı: **" + disagree + "**",
      "- Zaman damgalı görseli olmayan: " + noTs + " (`online-magazamiz-yayinda`: yalnızca kart+makale kanıtı; ek dolaylı ipucu: sitenin 2018 kataloğunun kapak dosyası `uploads/gallery/gallery_1536524805.jpg` = 2018-09-09, duyuru tarihiyle aynı gün — aynı varlık olmadığı için yalnızca destekleyici, kesin kanıt değildir).", "",
      "| Slug | DB publishedAt | Görsel yükleme günü(leri) | Sonuç |", "|---|---|---|---|",
      ...rows,
    ].join("\n"),
    "utf-8"
  );
  console.log(JSON.stringify({ withTs, agree, disagree, noTs }));
}
main().catch((e) => { console.error(e); process.exitCode = 1; }).finally(() => prisma.$disconnect());
