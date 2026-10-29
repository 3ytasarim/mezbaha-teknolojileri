/**
 * 29.10.2026 — 3 yeni blog yazısı × 6 dil (TR/EN/RU/DE/FR/AR). Varsayılan DRY-RUN; yazmak için --apply.
 *   - Kapaklar (blog-2026-10-29/images/cover-N.webp, 16:9) SEO dostu İngilizce dosya adıyla S3'e (uploads/) yüklenir, Medya'ya kaydedilir.
 *   - Her dil: başlık, özet, SEO başlık/açıklama, dile özgü slug ve dile özgü kapak alt metni. Canonical/hreflang kodla üretilir
 *     (kendine canonical; EN = ABD/varsayılan ve x-default). `canonicalUrl` alanı BİLİNÇLİ OLARAK boş bırakılır: blog sayfası bu alanı
 *     yol (path) olarak okuyup yerelleştirir; mutlak URL yazmak canonical'ı bozar.
 *   - Etiketler (BlogTag) sitede tek dillidir (Türkçe) ve yalnız TR sayfalarında görünür.
 *   - Yayın/oluşturulma tarihi: 29.10.2026. Veritabanı bağlantısı DIRECT_URL (pooler değil).
 * Yeniden çalıştırılabilir: slug varsa o yazı atlanır.
 * Kullanım: npx tsx prisma/migration/add-blog-posts-2026-10-29.ts [--apply]
 */
import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { localizePath } from "../../src/lib/i18n/routes";
import { findClaims, findGatedTerms } from "../../src/lib/seo/commercial-claims";
import { scanText } from "../../src/lib/seo/commercial-claims-i18n";
import { html, POSTS, type Loc } from "./blog-2026-10-29/posts";

const APPLY = process.argv.includes("--apply");
const DIR = path.join(__dirname, "blog-2026-10-29");
const DATE = new Date("2026-10-29T00:00:00.000Z");
const LOCALES: Loc[] = ["tr", "en", "ru", "de", "fr", "ar"];

const UI: Record<Loc, { related: string; product: string; cta: string }> = {
  tr: { related: "İlgili sayfalar", product: "Ürün sayfası", cta: "Teklif talep edin" },
  en: { related: "Related pages", product: "Product page", cta: "Request a quote" },
  ru: { related: "Связанные страницы", product: "Страница изделия", cta: "Запросить предложение" },
  de: { related: "Weiterführende Seiten", product: "Produktseite", cta: "Angebot anfordern" },
  fr: { related: "Pages associées", product: "Fiche produit", cta: "Demander un devis" },
  ar: { related: "صفحات ذات صلة", product: "صفحة المنتج", cta: "اطلب عرض سعر" },
};
// Her yazının iç bağlantı verdiği mevcut blog yazısı (kanonik TR slug)
const RELATED_BLOG: Record<number, string> = { 1: "karkas-isleme-istasyonlari-hijyen-ergonomi", 2: "buyukbas-hayvan-kesim-hatti-modern-mezbaha-sistemleri", 3: "karkas-isleme-istasyonlari-hijyen-ergonomi" };

const TR_MAP: Record<string, string> = { ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", I: "i", İ: "i", ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u" };
const slugify = (s: string) => s.split("").map((c) => TR_MAP[c] ?? c).join("").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").replace(/-{2,}/g, "-");
const balanced = (h: string, tag: string) => (h.match(new RegExp(`<${tag}[ >]`, "g")) ?? []).length === (h.match(new RegExp(`</${tag}>`, "g")) ?? []).length;

const getS3 = () => new S3Client({ endpoint: process.env.STORAGE_ENDPOINT, region: process.env.STORAGE_REGION || "us-east-1", credentials: { accessKeyId: process.env.STORAGE_ACCESS_KEY!, secretAccessKey: process.env.STORAGE_SECRET_KEY! }, forcePathStyle: true });

async function main() {
  const url = process.env.DIRECT_URL;
  if (!url) throw new Error("DIRECT_URL tanımlı değil");
  if (/-pooler\./.test(new URL(url).hostname)) throw new Error("DIRECT_URL pooler görünüyor");
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
  try {
    const category = await prisma.blogCategory.findUnique({ where: { slug: "mezbaha-sistemleri" } });
    if (!category) throw new Error("mezbaha-sistemleri kategorisi yok");
    let problems = 0;
    const warn = (m: string) => { problems++; console.log("  UYARI:", m); };

    const plan: { post: (typeof POSTS)[number]; exists: boolean; img: string; meta: Awaited<ReturnType<ReturnType<typeof sharp>["metadata"]>>; size: number; contents: Record<Loc, string> }[] = [];
    for (const post of POSTS) {
      const exists = !!(await prisma.blogPost.findUnique({ where: { slug: post.slug } }));
      console.log(`\n=== Yazı ${post.key}: ${post.slug} ${exists ? "(ZATEN VAR — atlanacak)" : ""}`);
      const product = await prisma.product.findUnique({ where: { slug: post.productSlug }, include: { translations: true } });
      if (!product) throw new Error(`ürün yok: ${post.productSlug}`);
      const rel = await prisma.blogPost.findUnique({ where: { slug: RELATED_BLOG[post.key] }, include: { translations: true } });
      if (!rel) throw new Error(`ilgili blog yok: ${RELATED_BLOG[post.key]}`);

      const contents = {} as Record<Loc, string>;
      for (const loc of LOCALES) {
        const t = post.locales[loc];
        const pt = product.translations.find((x) => x.locale === loc);
        const rt = rel.translations.find((x) => x.locale === loc);
        if (!pt || !rt) { warn(`${loc}: ürün/ilgili blog çevirisi yok`); continue; }
        const productPath = localizePath(loc, `/urun/${pt.slug ?? product.slug}`);
        const relPath = localizePath(loc, `/blog/${loc === "tr" ? rel.slug : rt.slug}`);
        const links = `\n<h2>${UI[loc].related}</h2>\n<ul>\n<li><a href="${productPath}">${UI[loc].product}: ${pt.name}</a></li>\n<li><a href="${relPath}">${rt.title}</a></li>\n</ul>\n<p><a href="${localizePath(loc, "/teklif-al")}">${UI[loc].cta}</a></p>`;
        const content = html(t.doc) + links;
        contents[loc] = content;
        const words = content.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
        console.log(`  ${loc}: başlık(${t.title.length}) seoTitle(${t.seoTitle.length}) seoDesc(${t.seoDescription.length}) alt(${t.imageAlt.length}) kelime(${words}) slug=${t.slug ?? "(kanonik)"}`);
        const titleMax = loc === "en" ? 45 : 60;
        if (t.seoTitle.length > titleMax) warn(`${loc}: seoTitle ${t.seoTitle.length} > ${titleMax}`);
        if (t.seoDescription.length > (loc === "en" ? 160 : 170)) warn(`${loc}: seoDescription ${t.seoDescription.length} çok uzun`);
        if (t.seoDescription.length < 110) warn(`${loc}: seoDescription ${t.seoDescription.length} kısa`);
        if (t.imageAlt.length > 170) warn(`${loc}: imageAlt çok uzun`);
        for (const tag of ["p", "h2", "h3", "ul", "li", "strong"]) if (!balanced(content, tag)) warn(`${loc}: <${tag}> dengesiz`);
        const all = [t.title, t.excerpt, t.seoTitle, t.seoDescription, t.imageAlt, content].join("\n");
        // Ticari iddia korumaları: kesin iddia (DEFINITE) ve kapılı terimler 0 olmalı; anahtar teslim/kurulum/üretici dili yok
        const hits = scanText(all, loc).filter((h) => h.severity === "DEFINITE");
        if (hits.length) warn(`${loc}: ticari iddia ${hits.map((h) => `${h.rule}«${h.match}»`).join(", ")}`);
        if (loc === "en") {
          const c = findClaims(all), g = findGatedTerms(all);
          if (c.length || g.length) warn(`en: ${[...c.map((h) => h.rule + "«" + h.match + "»"), ...g.map((h) => h.id + "«" + h.match + "»")].join(", ")}`);
          if (/\b(installation|commission|turnkey|guarantee|certified|leader|best|manufactur)/i.test(all.replace(/<[^>]+>/g, " "))) warn("en: yasak/riskli sözcük (installation|commission|turnkey|guarantee|certified|leader|best|manufactur)");
        }
        if (/anahtar teslim|turnkey|под ключ|schlüsselfertig|clé en main|تسليم المفتاح/i.test(all)) warn(`${loc}: anahtar teslim ifadesi`);
        if (loc !== "tr") {
          const clash = await prisma.blogPostTranslation.findFirst({ where: { locale: loc, slug: t.slug! } });
          if (clash && !exists) warn(`${loc}: slug zaten kullanılıyor: ${t.slug}`);
        }
      }
      console.log(`  etiketler (${post.tags.length}): ${post.tags.join(", ")}`);
      const img = path.join(DIR, "images", post.cover.file);
      const meta = await sharp(img).metadata();
      const size = fs.statSync(img).size;
      console.log(`  kapak: ${post.cover.file} ${meta.width}x${meta.height} ${meta.format} ${(size / 1024).toFixed(0)} KB → uploads/${post.cover.seoName}-<hash>.webp`);
      plan.push({ post, exists, img, meta, size, contents });
    }

    if (problems) console.log(`\n${problems} uyarı var.`);
    if (!APPLY) { console.log("\nKuru çalıştırma (DB/S3'e yazılmadı). Uygulamak için: --apply"); process.exitCode = problems ? 1 : 0; return; }
    if (problems) throw new Error("Uyarılar giderilmeden uygulanmaz.");

    const s3 = getS3();
    for (const { post, exists, img, meta, size, contents } of plan) {
      if (exists) continue;
      const data = fs.readFileSync(img);
      const hash = crypto.createHash("sha1").update(data).digest("hex").slice(0, 8);
      const key = `${post.cover.seoName}-${hash}.webp`;
      const urlPath = `/uploads/${key}`;
      await s3.send(new PutObjectCommand({ Bucket: process.env.STORAGE_BUCKET, Key: `uploads/${key}`, Body: data, ContentType: "image/webp", CacheControl: "public, max-age=31536000, immutable" }));
      console.log(`\nS3'e yüklendi: uploads/${key}`);
      const trAlt = post.locales.tr.imageAlt;
      await prisma.$transaction(async (tx) => {
        if (!(await tx.media.findUnique({ where: { storageKey: key } }))) {
          await tx.media.create({ data: { filename: key, originalName: post.cover.originalName, mimeType: "image/webp", url: urlPath, storageKey: key, alt: trAlt, width: meta.width ?? 1600, height: meta.height ?? 900, fileSize: size } });
        }
        const tagIds: string[] = [];
        for (const name of post.tags) {
          const slug = slugify(name);
          const tag = (await tx.blogTag.findUnique({ where: { slug } })) ?? (await tx.blogTag.create({ data: { slug, name } }));
          tagIds.push(tag.id);
        }
        await tx.blogPost.create({
          data: {
            slug: post.slug, categoryId: category.id, coverImage: urlPath, coverImageAlt: trAlt, authorType: "company", status: "PUBLISHED", featured: false,
            publishedAt: DATE, createdAt: DATE, tags: { connect: tagIds.map((id) => ({ id })) },
            translations: { create: LOCALES.map((loc) => { const t = post.locales[loc]; return { locale: loc, slug: t.slug, title: t.title, excerpt: t.excerpt, content: contents[loc], seoTitle: t.seoTitle, seoDescription: t.seoDescription, imageAlt: t.imageAlt }; }) },
          },
        });
      }, { maxWait: 10000, timeout: 60000 });
      console.log(`DB'ye eklendi: ${post.slug} (6 dil, ${post.tags.length} etiket)`);
    }
    // Taze bağlantıyla doğrulama
    const check = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
    try {
      for (const { post } of plan) {
        const p = await check.blogPost.findUnique({ where: { slug: post.slug }, include: { translations: true, tags: true } });
        console.log(`doğrulama ${post.slug}: durum ${p?.status}, yayın ${p?.publishedAt?.toISOString().slice(0, 10)}, çeviri ${p?.translations.length}, etiket ${p?.tags.length}, kapak ${p?.coverImage}`);
      }
    } finally { await check.$disconnect(); }
  } finally { await prisma.$disconnect(); }
}

main().catch((e) => { console.error(String(e instanceof Error ? e.message : e).replace(/[a-z][a-z0-9+.-]*:\/\/[^\s'"]+/gi, "[redacted-url]").slice(0, 600)); process.exitCode = 1; });
