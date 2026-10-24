/**
 * Üç yeni blog yazısını (Word: Blog-1/2/3.docx) 6 dilde (TR/EN/RU/DE/FR/AR) ekler:
 *   - Kapak görselleri 16:9'a kırpılıp WebP'e sıkıştırıldı (prisma/migration/blog-2026-10-12/images), SEO dostu dosya adıyla
 *     S3 kovasına (uploads/) yüklenir ve Medya Kütüphanesi'ne (Türkçe alt metinle) kaydedilir.
 *   - Her dil için başlık, özet, SEO başlık/açıklama, dile özgü slug ve dile özgü kapak alt metni (BlogPostTranslation.imageAlt).
 *   - Etiketler (BlogTag, Türkçe) belgedeki "SEO Etiketleri"nden; "Anahtar Teslim Mezbaha" etiketi/anahtar kelimesi YAYINLANMAZ
 *     (firma anahtar teslim hizmeti vermiyor).
 *   - Yayın ve oluşturulma tarihi: 12.10.2026 (kullanıcı talebi). Dilin kendi iç bağlantıları (mevcut iki yazı) ve
 *     teklif sayfası bağlantısı içeriğin sonuna eklenir.
 * Yeniden çalıştırılabilir: slug zaten varsa o yazı atlanır.
 * Kullanım: node prisma/migration/add-blog-posts-2026-10-12.cjs [--apply]
 */
require("dotenv/config");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { PrismaClient } = require("@prisma/client");
const { PrismaPg } = require("@prisma/adapter-pg");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });
const APPLY = process.argv.includes("--apply");
const DIR = path.join(__dirname, "blog-2026-10-12");
const DATE = new Date("2026-10-12T00:00:00.000Z");

const LOCALES = ["tr", "en", "ru", "de", "fr", "ar"];
const PREFIX = { tr: "/tr", en: "", ru: "/ru", de: "/de", fr: "/fr", ar: "/ar" };

const UI = {
  tr: { related: "İlgili yazılar", cta: "Teklif talep edin", links: ["Büyükbaş Kesim Hattı", "Konveyör ve Ray Sistemleri"] },
  en: { related: "Related reading", cta: "Request a quote", links: ["Cattle Slaughter Line", "Conveyor and Rail Systems"] },
  ru: { related: "Читайте также", cta: "Запросить предложение", links: ["Линия убоя КРС", "Конвейерные и рельсовые системы"] },
  de: { related: "Weiterführende Artikel", cta: "Angebot anfordern", links: ["Rinderschlachtlinie", "Förder- und Rohrbahnsysteme"] },
  fr: { related: "À lire aussi", cta: "Demander un devis", links: ["Ligne d’abattage bovin", "Systèmes de convoyage et rails"] },
  ar: { related: "اقرأ أيضًا", cta: "اطلب عرض سعر", links: ["خط ذبح الأبقار", "أنظمة الناقلات والقضبان"] },
};

// Mevcut iki yazıya iç bağlantı (belgedeki "İç bağlantılar" notu): [kanonik TR slug, ...]
const RELATED_SLUGS = ["buyukbas-hayvan-kesim-hatti-modern-mezbaha-sistemleri", "buyukbas-kesim-hatti-konveyor-ray-sistemleri"];

const TR_MAP = { ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", I: "i", İ: "i", ö: "o", Ö: "o", ş: "s", Ş: "s", ü: "u", Ü: "u" };
function slugify(input) {
  return input
    .split("")
    .map((c) => TR_MAP[c] ?? c)
    .join("")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function getS3() {
  return new S3Client({
    endpoint: process.env.STORAGE_ENDPOINT,
    region: process.env.STORAGE_REGION || "us-east-1",
    credentials: { accessKeyId: process.env.STORAGE_ACCESS_KEY, secretAccessKey: process.env.STORAGE_SECRET_KEY },
    forcePathStyle: true,
  });
}

function balanced(html, tag) {
  return (html.match(new RegExp(`<${tag}[ >]`, "g")) || []).length === (html.match(new RegExp(`</${tag}>`, "g")) || []).length;
}

async function main() {
  const posts = [1, 2, 3].map((n) => require(path.join(DIR, `blog-${n}.cjs`)));

  const category = await prisma.blogCategory.findUnique({ where: { slug: "mezbaha-sistemleri" } });
  if (!category) throw new Error("mezbaha-sistemleri blog kategorisi bulunamadı");

  const related = await prisma.blogPost.findMany({
    where: { slug: { in: RELATED_SLUGS } },
    include: { translations: { select: { locale: true, slug: true } } },
  });
  const relatedBySlug = new Map(related.map((p) => [p.slug, p]));
  const relatedHtml = (locale) => {
    const items = RELATED_SLUGS.map((slug, i) => {
      const p = relatedBySlug.get(slug);
      if (!p) return null;
      const localSlug = locale === "tr" ? p.slug : p.translations.find((t) => t.locale === locale)?.slug;
      if (!localSlug) return null;
      return `<li><a href="${PREFIX[locale]}/blog/${localSlug}">${UI[locale].links[i]}</a></li>`;
    }).filter(Boolean);
    return items.length ? `\n<h2>${UI[locale].related}</h2>\n<ul>\n${items.join("\n")}\n</ul>` : "";
  };
  const ctaHtml = (locale) => `\n<p><a href="${PREFIX[locale]}/teklif-al">${UI[locale].cta}</a></p>`;

  let problems = 0;
  const warn = (m) => {
    problems++;
    console.log("  UYARI:", m);
  };

  const plan = [];
  for (const post of posts) {
    const exists = await prisma.blogPost.findUnique({ where: { slug: post.slug } });
    console.log(`\n=== Blog ${post.key}: ${post.slug} ${exists ? "(ZATEN VAR — atlanacak)" : ""}`);

    // Doğrulamalar
    for (const loc of LOCALES) {
      const t = post.locales[loc];
      const L = `${loc}`;
      if (!t) { warn(`${L}: çeviri yok`); continue; }
      console.log(`  ${L}: başlık(${t.title.length}) seoTitle(${t.seoTitle.length}) seoDesc(${t.seoDescription.length}) içerik(${t.content.length}) slug=${t.slug ?? "(kanonik)"}`);
      if (t.seoTitle.length > 62) warn(`${L}: seoTitle ${t.seoTitle.length} karakter (>62)`);
      if (t.seoDescription.length > 162) warn(`${L}: seoDescription ${t.seoDescription.length} karakter (>162)`);
      if (t.imageAlt.length > 160) warn(`${L}: imageAlt ${t.imageAlt.length} karakter (>160)`);
      for (const tag of ["p", "h2", "h3", "ul", "li", "strong"]) if (!balanced(t.content, tag)) warn(`${L}: <${tag}> dengesiz`);
      if (/anahtar teslim|turnkey|«под ключ»|clé en main|schlüsselfertig|تسليم المفتاح/i.test(t.content + t.seoTitle + t.seoDescription)) warn(`${L}: "anahtar teslim" ifadesi bulundu`);
      if (loc !== "tr" && loc !== "ar") {
        const clash = await prisma.blogPostTranslation.findFirst({ where: { locale: loc, slug: t.slug } });
        if (clash && !exists) warn(`${L}: slug zaten kullanılıyor: ${t.slug}`);
      }
      if (loc === "ar") {
        const clash = await prisma.blogPostTranslation.findFirst({ where: { locale: "ar", slug: t.slug } });
        if (clash && !exists) warn(`ar: slug zaten kullanılıyor: ${t.slug}`);
      }
    }
    console.log(`  etiketler (${post.tags.length}): ${post.tags.join(", ")}`);
    const img = path.join(DIR, "images", post.cover.file);
    const meta = await sharp(img).metadata();
    const stat = fs.statSync(img);
    console.log(`  kapak: ${post.cover.file} ${meta.width}x${meta.height} ${meta.format} ${(stat.size / 1024).toFixed(0)} KB`);
    plan.push({ post, exists, img, meta, size: stat.size });
  }

  if (problems) console.log(`\n${problems} uyarı var.`);
  if (!APPLY) {
    console.log("\nKuru çalıştırma. Uygulamak için: node prisma/migration/add-blog-posts-2026-10-12.cjs --apply");
    return;
  }
  if (problems) throw new Error("Uyarılar giderilmeden uygulanmaz.");

  const s3 = getS3();
  for (const { post, exists, img, meta, size } of plan) {
    if (exists) continue;
    const data = fs.readFileSync(img);
    const hash = crypto.createHash("sha1").update(data).digest("hex").slice(0, 8);
    const key = `${post.cover.seoName}-${hash}.webp`;
    const url = `/uploads/${key}`;

    await s3.send(
      new PutObjectCommand({
        Bucket: process.env.STORAGE_BUCKET,
        Key: `uploads/${key}`,
        Body: data,
        ContentType: "image/webp",
        CacheControl: "public, max-age=31536000, immutable",
      })
    );
    console.log(`\nS3'e yüklendi: uploads/${key}`);

    const trAlt = post.locales.tr.imageAlt;
    await prisma.$transaction(
      async (tx) => {
        const hasMedia = await tx.media.findUnique({ where: { storageKey: key } });
        if (!hasMedia) {
          await tx.media.create({
            data: {
              filename: key,
              originalName: post.cover.originalName,
              mimeType: "image/webp",
              url,
              storageKey: key,
              alt: trAlt,
              width: meta.width,
              height: meta.height,
              fileSize: size,
            },
          });
        }

        const tagIds = [];
        for (const name of post.tags) {
          const slug = slugify(name);
          const tag = (await tx.blogTag.findUnique({ where: { slug } })) ?? (await tx.blogTag.create({ data: { slug, name } }));
          tagIds.push(tag.id);
        }

        await tx.blogPost.create({
          data: {
            slug: post.slug,
            categoryId: category.id,
            coverImage: url,
            coverImageAlt: trAlt,
            authorType: "company",
            status: "PUBLISHED",
            featured: false,
            publishedAt: DATE,
            createdAt: DATE,
            tags: { connect: tagIds.map((id) => ({ id })) },
            translations: {
              create: LOCALES.map((loc) => {
                const t = post.locales[loc];
                return {
                  locale: loc,
                  slug: t.slug,
                  title: t.title,
                  excerpt: t.excerpt,
                  content: t.content + relatedHtml(loc) + ctaHtml(loc),
                  seoTitle: t.seoTitle,
                  seoDescription: t.seoDescription,
                  imageAlt: t.imageAlt,
                };
              }),
            },
          },
        });
      },
      { maxWait: 10000, timeout: 60000 }
    );
    console.log(`DB'ye eklendi: ${post.slug} (6 dil, ${post.tags.length} etiket)`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
