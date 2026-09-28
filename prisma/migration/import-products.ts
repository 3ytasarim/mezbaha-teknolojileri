import { existsSync, readFileSync } from "fs";
import path from "path";
import type { PrismaClient } from "@prisma/client";
import { slugify } from "./slug";
import { sanitizeContentHtml } from "./sanitize";
import { applyDeadLinkOverrides } from "./link-overrides";
import { ensureMediaForImage } from "./media";
import { getCanonicalProductSlug } from "./parse-redirect-map";
import { getCategorySlugForSourceUrl } from "./import-categories";
import { hashSource, type MigrationStats, type SourceImage } from "./types";

const ROOT = path.join(__dirname, "..", "..");
const DATA_FILES = ["products-buyukbas.json", "products-other-categories.json"];

type SourceProduct = {
  sourceUrl: string;
  name: string;
  categorySourceUrl?: string;
  shortDescription?: string | null;
  descriptionHtml?: string | null;
  specifications?: { label: string; value: string }[];
  applications?: string | null;
  features?: string | null;
  sku?: string | null;
  coverImageSourceUrl?: string | null;
  images?: { sourceUrl: string; alt?: string | null }[];
  documents?: { sourceUrl: string; title: string }[];
  videoUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  localImages?: { sourceUrl: string; localPath: string; alt?: string | null }[];
};

function loadSourceProducts(): SourceProduct[] {
  const all: SourceProduct[] = [];
  for (const file of DATA_FILES) {
    const filePath = path.join(ROOT, "docs", "migration-data", file);
    if (!existsSync(filePath)) continue;
    const data = JSON.parse(readFileSync(filePath, "utf-8"));
    const products: SourceProduct[] = data.products ?? [];
    // Bazı agent dosyalarında categorySourceUrl yalnızca wrapper seviyesinde var
    // (tüm dosya tek bir kategoriye ait olduğu için per-product tekrarlanmamış).
    // Ürün kendi categorySourceUrl'ini taşımıyorsa wrapper'dakini fallback yap.
    const fallbackCategoryUrl: string | undefined = data.categorySourceUrl;
    for (const p of products) {
      all.push({ ...p, categorySourceUrl: p.categorySourceUrl ?? fallbackCategoryUrl });
    }
  }
  return all;
}

export async function importProducts(
  prisma: PrismaClient,
  categorySlugToId: Map<string, string>,
  dryRun: boolean,
  stats: MigrationStats
) {
  const entries = loadSourceProducts();

  if (entries.length === 0) {
    stats.products.errors.push({
      source: "docs/migration-data/products-*.json",
      reason: "Kaynak dosya bulunamadı, ürün importu atlandı.",
    });
    return;
  }

  const seenSlugs = new Set<string>();

  for (const src of entries) {
    try {
      const slug = getCanonicalProductSlug(src.sourceUrl) ?? slugify(src.name);

      if (seenSlugs.has(slug)) {
        stats.products.skipped += 1;
        stats.diffs.push(`Product ${slug}: aynı slug ile birden fazla kaynak kaydı, ilki kullanıldı.`);
        continue;
      }
      seenSlugs.add(slug);
      stats.provenance.push({ entityType: "product", entityId: null, slug, sourceUrl: src.sourceUrl, sourceHash: hashSource(src), importedAt: new Date().toISOString() });

      const categorySourceUrl = src.categorySourceUrl;
      const categorySlug = categorySourceUrl ? getCategorySlugForSourceUrl(categorySourceUrl) : null;
      const categoryId = categorySlug ? categorySlugToId.get(categorySlug) : undefined;

      if (!categoryId) {
        stats.products.errors.push({
          source: src.sourceUrl,
          reason: `Kategori çözümlenemedi (categorySourceUrl: ${categorySourceUrl ?? "yok"}), ürün atlandı.`,
        });
        continue;
      }

      const description = src.descriptionHtml ? sanitizeContentHtml(applyDeadLinkOverrides(src.descriptionHtml).html) : null;
      const applications = src.applications ? sanitizeContentHtml(src.applications) : null;
      const features = src.features ? sanitizeContentHtml(src.features) : null;

      // Görsel migrasyonu: localImages listesinden gerçekten indirilmiş olanları kullan.
      const localImages = src.localImages ?? [];
      const coverSource: SourceImage | undefined = src.coverImageSourceUrl
        ? localImages.find((i) => i.sourceUrl === src.coverImageSourceUrl)
        : localImages[0];

      const coverImage = coverSource
        ? await ensureMediaForImage(prisma, coverSource, dryRun, stats)
        : null;

      const galleryImages: { url: string; alt: string; caption: string }[] = [];
      for (const img of localImages) {
        if (coverSource && img.sourceUrl === coverSource.sourceUrl) continue;
        const url = await ensureMediaForImage(prisma, img, dryRun, stats);
        if (url) galleryImages.push({ url, alt: img.alt ?? "", caption: "" });
      }

      const existing = await prisma.product.findUnique({
        where: { slug },
        include: {
          translations: { where: { locale: "tr" } },
          images: true,
          specifications: true,
        },
      });

      if (existing) {
        const existingTranslation = existing.translations[0];
        const existingDescLen = existingTranslation?.description?.length ?? 0;
        const newDescLen = description?.length ?? 0;
        const meaningfullyRicher =
          newDescLen > existingDescLen || galleryImages.length > existing.images.length;

        if (!meaningfullyRicher) {
          stats.products.skipped += 1;
          continue;
        }

        stats.products.updated += 1;
        stats.diffs.push(
          `Product ${slug}: description ${existingDescLen} -> ${newDescLen} chars, images ${existing.images.length} -> ${galleryImages.length}. Action: UPDATE`
        );

        if (!dryRun) {
          await prisma.$transaction(async (tx) => {
            await tx.product.update({
              where: { id: existing.id },
              data: {
                categoryId,
                sku: src.sku ?? existing.sku,
                coverImage: coverImage ?? existing.coverImage,
                videoUrl: src.videoUrl ?? existing.videoUrl,
                status: "PUBLISHED",
                active: true,
              },
            });

            await tx.productTranslation.upsert({
              where: { productId_locale: { productId: existing.id, locale: "tr" } },
              create: {
                productId: existing.id,
                locale: "tr",
                name: src.name,
                shortDescription: src.shortDescription ?? undefined,
                description: description ?? undefined,
                applications: applications ?? undefined,
                features: features ?? undefined,
                seoTitle: src.seoTitle ?? src.name,
                seoDescription: src.seoDescription ?? src.shortDescription ?? undefined,
              },
              update: {
                shortDescription: src.shortDescription ?? existingTranslation?.shortDescription,
                description: description ?? existingTranslation?.description,
                applications: applications ?? existingTranslation?.applications,
                features: features ?? existingTranslation?.features,
                seoTitle: src.seoTitle ?? existingTranslation?.seoTitle,
                seoDescription: src.seoDescription ?? existingTranslation?.seoDescription,
              },
            });

            if (galleryImages.length > 0) {
              await tx.productImage.deleteMany({ where: { productId: existing.id } });
              await tx.productImage.createMany({
                data: galleryImages.map((img, index) => ({
                  productId: existing.id,
                  imageUrl: img.url,
                  alt: img.alt,
                  caption: img.caption,
                  sortOrder: index,
                })),
              });
            }

            if (src.specifications && src.specifications.length > 0) {
              await tx.productSpecification.deleteMany({ where: { productId: existing.id } });
              await tx.productSpecification.createMany({
                data: src.specifications.map((s, index) => ({
                  productId: existing.id,
                  locale: "tr",
                  label: s.label,
                  value: s.value,
                  sortOrder: index,
                })),
              });
            }
          });
        }
        continue;
      }

      stats.products.new += 1;
      if (!dryRun) {
        await prisma.$transaction(async (tx) => {
          const created = await tx.product.create({
            data: {
              slug,
              categoryId,
              sku: src.sku ?? undefined,
              coverImage,
              videoUrl: src.videoUrl ?? undefined,
              status: "PUBLISHED",
              active: true,
            },
          });

          await tx.productTranslation.create({
            data: {
              productId: created.id,
              locale: "tr",
              name: src.name,
              shortDescription: src.shortDescription ?? undefined,
              description: description ?? undefined,
              applications: applications ?? undefined,
              features: features ?? undefined,
              seoTitle: src.seoTitle ?? src.name,
              seoDescription: src.seoDescription ?? src.shortDescription ?? undefined,
            },
          });

          if (galleryImages.length > 0) {
            await tx.productImage.createMany({
              data: galleryImages.map((img, index) => ({
                productId: created.id,
                imageUrl: img.url,
                alt: img.alt,
                caption: img.caption,
                sortOrder: index,
              })),
            });
          }

          if (src.specifications && src.specifications.length > 0) {
            await tx.productSpecification.createMany({
              data: src.specifications.map((s, index) => ({
                productId: created.id,
                locale: "tr",
                label: s.label,
                value: s.value,
                sortOrder: index,
              })),
            });
          }

          if (src.documents && src.documents.length > 0) {
            await tx.productDocument.createMany({
              data: src.documents.map((d, index) => ({
                productId: created.id,
                title: d.title,
                fileUrl: d.sourceUrl,
                mimeType: "application/pdf",
                fileSize: 0,
                sortOrder: index,
              })),
            });
          }
        });
      }
    } catch (error) {
      stats.products.errors.push({
        source: src.sourceUrl,
        reason: error instanceof Error ? error.message : String(error),
      });
    }
  }
}
