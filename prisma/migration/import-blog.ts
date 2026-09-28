import { existsSync, readFileSync } from "fs";
import path from "path";
import type { PrismaClient } from "@prisma/client";
import { slugify } from "./slug";
import { sanitizeContentHtml } from "./sanitize";
import { ensureMediaForImage } from "./media";
import { applyDeadLinkOverrides } from "./link-overrides";
import { loadImageMap, localizeBodyImages } from "./localize-images";
import { parseRedirectMap, getCanonicalBlogSlug } from "./parse-redirect-map";
import { hashSource, type MigrationStats, type SourceImage } from "./types";

const ROOT = path.join(__dirname, "..", "..");
const DATA_FILES = ["blog-posts-batch1.json", "blog-posts-batch2.json"];

type SourcePost = {
  sourceUrl: string;
  title: string;
  excerpt?: string | null;
  contentHtml?: string | null;
  categoryName?: string | null;
  publishedDate?: string | null;
  yearMissing?: boolean;
  modifiedDate?: string | null;
  author?: string | null;
  coverImageSourceUrl?: string | null;
  inlineImages?: { sourceUrl: string; alt?: string | null }[];
  internalLinks?: { href: string; linkText: string }[];
  seoTitle?: string | null;
  seoDescription?: string | null;
  localCoverImage?: SourceImage | null;
  localInlineImages?: SourceImage[];
};

function loadSourcePosts(): SourcePost[] {
  const all: SourcePost[] = [];
  for (const file of DATA_FILES) {
    const filePath = path.join(ROOT, "docs", "migration-data", file);
    if (!existsSync(filePath)) continue;
    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    all.push(...(data.posts ?? []));
  }
  return all;
}

/**
 * İçerik gövdesindeki eski site linklerini url-migration-map.md'deki kanonik yeni
 * yollarla değiştirir. Gerçek kaynak veride görülen İKİ format da desteklenir:
 *   - https://mezbahateknolojileri.com/tr/[slug]/  (nadir)
 *   - https://mezbahateknolojileri.com/[slug]/      (blog body'lerinde HAKİM format —
 *     site kendi internal linklerinde /tr/ önekini atlıyor, muhtemelen bir CMS/tema
 *     tutarsızlığı; biz gerçek siteyle birebir aynı davranışı taklit ediyoruz, sadece
 *     /tr/ önekini varsayarak migration map'te arıyoruz)
 * Eşleşme bulunamayan linkler OLDUĞU GİBİ bırakılır (uydurma yönlendirme yapılmaz).
 */
function rewriteInternalLinks(html: string): { html: string; unresolvedLinks: string[] } {
  const rows = parseRedirectMap();
  const unresolved: string[] = [];

  const rewritten = html.replace(
    /href="https?:\/\/(?:www\.)?mezbahateknolojileri\.com(\/(?:tr\/)?[a-z0-9-]+)\/?"/gi,
    (full, urlPath: string) => {
      const candidates = urlPath.startsWith("/tr/") ? [urlPath] : [`/tr${urlPath}`, urlPath];
      for (const candidate of candidates) {
        const row = rows.find((r) => r.oldUrl === candidate);
        if (row) return `href="${row.newUrl}"`;
      }
      unresolved.push(urlPath);
      return full;
    }
  );

  return { html: rewritten, unresolvedLinks: unresolved };
}

function parsePublishedDate(post: SourcePost): Date | null {
  if (!post.publishedDate || post.yearMissing) return null;
  const parsed = new Date(post.publishedDate);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export async function importBlogPosts(
  prisma: PrismaClient,
  dryRun: boolean,
  stats: MigrationStats
) {
  const entries = loadSourcePosts();

  if (entries.length === 0) {
    stats.blogPosts.errors.push({
      source: "docs/migration-data/blog-posts-batch*.json",
      reason: "Kaynak dosya bulunamadı, blog importu atlandı.",
    });
    return;
  }

  // Kategori: mevcut "mezbaha-sistemleri" kategorisi (Phase 9-11A'da zaten oluşturuldu,
  // breadcrumb'dan doğrulandı) - upsert ile garanti altına al.
  const category = await prisma.blogCategory.upsert({
    where: { slug: "mezbaha-sistemleri" },
    create: { slug: "mezbaha-sistemleri" },
    update: {},
  });
  await prisma.blogCategoryTranslation.upsert({
    where: { categoryId_locale: { categoryId: category.id, locale: "tr" } },
    create: { categoryId: category.id, locale: "tr", name: "Mezbaha Sistemleri" },
    update: {},
  });

  const seenSlugs = new Set<string>();

  for (const src of entries) {
    try {
      const slug = getCanonicalBlogSlug(src.sourceUrl) ?? slugify(src.title);

      if (seenSlugs.has(slug)) {
        stats.blogPosts.skipped += 1;
        continue;
      }
      seenSlugs.add(slug);
      stats.provenance.push({ entityType: "blogPost", entityId: null, slug, sourceUrl: src.sourceUrl, sourceHash: hashSource(src), importedAt: new Date().toISOString() });

      if (!src.contentHtml) {
        stats.blogPosts.errors.push({ source: src.sourceUrl, reason: "contentHtml boş, atlandı." });
        continue;
      }

      const { html: rewrittenHtml, unresolvedLinks } = rewriteInternalLinks(applyDeadLinkOverrides(src.contentHtml).html);
      const { html: localizedHtml } = await localizeBodyImages(rewrittenHtml, loadImageMap());
      const content = sanitizeContentHtml(localizedHtml);

      if (unresolvedLinks.length > 0) {
        stats.diffs.push(
          `BlogPost ${slug}: ${unresolvedLinks.length} internal link migration map'te bulunamadı, olduğu gibi bırakıldı (${unresolvedLinks.join(", ")}).`
        );
      }

      const coverImage = src.localCoverImage
        ? await ensureMediaForImage(prisma, src.localCoverImage, dryRun, stats)
        : null;

      for (const img of src.localInlineImages ?? []) {
        await ensureMediaForImage(prisma, img, dryRun, stats);
      }

      const publishedAt = parsePublishedDate(src);

      const existing = await prisma.blogPost.findUnique({
        where: { slug },
        include: { translations: { where: { locale: "tr" } } },
      });

      if (existing) {
        const existingTranslation = existing.translations[0];
        const existingContentLen = existingTranslation?.content?.length ?? 0;
        const newContentLen = content.length;

        // Phase 9-11A'da içerik boş bırakılan seeded post'lar için tam metin geldiğinde
        // GÜNCELLE; içerik zaten doluysa ve kaynak daha kısa/aynıysa dokunma.
        if (newContentLen <= existingContentLen && existingContentLen > 0) {
          stats.blogPosts.skipped += 1;
          continue;
        }

        stats.blogPosts.updated += 1;
        stats.diffs.push(
          `BlogPost ${slug}: content ${existingContentLen} -> ${newContentLen} chars (tam makale metni eklendi). Action: UPDATE`
        );

        if (!dryRun) {
          await prisma.$transaction([
            prisma.blogPost.update({
              where: { id: existing.id },
              data: {
                categoryId: category.id,
                coverImage: coverImage ?? existing.coverImage,
                authorName: src.author ?? existing.authorName,
                status: "PUBLISHED",
                publishedAt: publishedAt ?? existing.publishedAt,
              },
            }),
            prisma.blogPostTranslation.upsert({
              where: { blogPostId_locale: { blogPostId: existing.id, locale: "tr" } },
              create: {
                blogPostId: existing.id,
                locale: "tr",
                title: src.title,
                excerpt: src.excerpt ?? undefined,
                content,
                seoTitle: src.seoTitle ?? src.title,
                seoDescription: src.seoDescription ?? src.excerpt ?? undefined,
              },
              update: {
                excerpt: src.excerpt ?? existingTranslation?.excerpt,
                content,
                seoTitle: src.seoTitle ?? existingTranslation?.seoTitle,
                seoDescription: src.seoDescription ?? existingTranslation?.seoDescription,
              },
            }),
          ]);
        }
        continue;
      }

      stats.blogPosts.new += 1;
      if (!dryRun) {
        await prisma.$transaction(async (tx) => {
          const created = await tx.blogPost.create({
            data: {
              slug,
              categoryId: category.id,
              coverImage,
              authorType: "company",
              authorName: src.author ?? undefined,
              status: "PUBLISHED",
              publishedAt,
            },
          });

          await tx.blogPostTranslation.create({
            data: {
              blogPostId: created.id,
              locale: "tr",
              title: src.title,
              excerpt: src.excerpt ?? undefined,
              content,
              seoTitle: src.seoTitle ?? src.title,
              seoDescription: src.seoDescription ?? src.excerpt ?? undefined,
            },
          });
        });
      }
    } catch (error) {
      stats.blogPosts.errors.push({
        source: src.sourceUrl,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
