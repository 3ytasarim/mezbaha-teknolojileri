import type { PrismaClient } from "@prisma/client";
import { ensureMediaForImage } from "./media";
import { hashSource, type MigrationStats } from "./types";

// Kaynak: docs/current-site-inventory.md §2 + §9. Görseller Phase 7-8'de zaten
// public/images/categories/ altına indirilmişti (image-inventory.md).
const CATEGORIES = [
  {
    slug: "buyukbas",
    sourceUrl: "https://www.mezbahateknolojileri.com/tr/buyukbas-mezbaha-makinalari/",
    name: "Büyükbaş Mezbaha Makinaları",
    shortDescription:
      "Kesim hücreleri, karkas taşıma ve deri yüzme hatlarından oluşan büyükbaş üretim hattı ekipmanları.",
    localImage: "public/images/categories/buyukbas-mezbaha-makinalari.png",
    imageSourceUrl:
      "https://www.mezbahateknolojileri.com/uploads/services/cover/buyukbas-mezbaha-makinalari-1786714622.webp",
    sortOrder: 0,
  },
  {
    slug: "kucukbas",
    sourceUrl: "https://www.mezbahateknolojileri.com/tr/kucukbas-mezbaha-makinalari/",
    name: "Küçükbaş Mezbaha Makinaları",
    shortDescription:
      "Koyun işleme konveyörü, kanama elevatörü ve taşıma arabalarıyla küçükbaş işleme hattı ekipmanları.",
    localImage: "public/images/categories/kucukbas-mezbaha-makinalari.png",
    imageSourceUrl:
      "https://www.mezbahateknolojileri.com/uploads/services/cover/kucukbas-mezbaha-makinalari-1786713549.webp",
    sortOrder: 1,
  },
  {
    slug: "kurban-kesim",
    sourceUrl: "https://www.mezbahateknolojileri.com/tr/kurban-kesim/",
    name: "Kurban Kesim Makinaları",
    shortDescription:
      "Kurban kesim yerleri için otomatik kesim kabinleri ve komple kesim-parçalama hatları.",
    localImage: "public/images/categories/kurban-kesim-makinalari.png",
    imageSourceUrl:
      "https://www.mezbahateknolojileri.com/uploads/services/cover/kurban-kesim-makinalari-1786714749.webp",
    sortOrder: 2,
  },
  {
    slug: "mezbaha-sistemleri",
    sourceUrl: "https://www.mezbahateknolojileri.com/tr/mezbaha-sistemleri/",
    name: "Mezbaha Sistemleri",
    shortDescription:
      "Profesyonel ve standart mezbaha sistemleri, soğuk oda ikizray hatları ve Kosher Line çözümleri.",
    localImage: "public/images/categories/mezbaha-sistemleri.png",
    imageSourceUrl:
      "https://www.mezbahateknolojileri.com/uploads/services/cover/mezbaha-sistemleri-1786963201.webp",
    sortOrder: 3,
  },
] as const;

export async function importCategories(
  prisma: PrismaClient,
  dryRun: boolean,
  stats: MigrationStats
): Promise<Map<string, string>> {
  const slugToId = new Map<string, string>();

  for (const cat of CATEGORIES) {
    stats.provenance.push({ entityType: "category", entityId: null, slug: cat.slug, sourceUrl: cat.sourceUrl, sourceHash: hashSource(cat), importedAt: new Date().toISOString() });
    const image = await ensureMediaForImage(
      prisma,
      { sourceUrl: cat.imageSourceUrl, localPath: cat.localImage, alt: cat.name },
      dryRun,
      stats
    );

    const existing = await prisma.productCategory.findUnique({
      where: { slug: cat.slug },
      include: { translations: { where: { locale: "tr" } } },
    });

    if (existing) {
      slugToId.set(cat.slug, existing.id);
      const translation = existing.translations[0];
      const needsUpdate =
        translation?.name !== cat.name ||
        translation?.shortDescription !== cat.shortDescription ||
        (image && existing.image !== image);

      if (needsUpdate) {
        stats.categories.updated += 1;
        stats.diffs.push(`Category ${cat.slug}: içerik/görsel kaynakla senkronize edildi.`);
        if (!dryRun) {
          await prisma.$transaction([
            prisma.productCategory.update({
              where: { id: existing.id },
              data: { image: image ?? existing.image, sortOrder: cat.sortOrder, active: true },
            }),
            prisma.productCategoryTranslation.upsert({
              where: { categoryId_locale: { categoryId: existing.id, locale: "tr" } },
              create: {
                categoryId: existing.id,
                locale: "tr",
                name: cat.name,
                shortDescription: cat.shortDescription,
                seoTitle: cat.name,
                seoDescription: cat.shortDescription,
              },
              update: {
                name: cat.name,
                shortDescription: cat.shortDescription,
                seoTitle: cat.name,
                seoDescription: cat.shortDescription,
              },
            }),
          ]);
        }
      } else {
        stats.categories.skipped += 1;
      }
      continue;
    }

    stats.categories.new += 1;
    if (!dryRun) {
      const created = await prisma.$transaction(async (tx) => {
        const c = await tx.productCategory.create({
          data: { slug: cat.slug, image, sortOrder: cat.sortOrder, active: true },
        });
        await tx.productCategoryTranslation.create({
          data: {
            categoryId: c.id,
            locale: "tr",
            name: cat.name,
            shortDescription: cat.shortDescription,
            seoTitle: cat.name,
            seoDescription: cat.shortDescription,
          },
        });
        return c;
      });
      slugToId.set(cat.slug, created.id);
    } else {
      slugToId.set(cat.slug, "dry-run-placeholder");
    }
  }

  return slugToId;
}

export function getCategorySlugForSourceUrl(sourceUrl: string): string | null {
  const match = CATEGORIES.find((c) => sourceUrl.startsWith(c.sourceUrl));
  return match?.slug ?? null;
}
