import { existsSync, readFileSync } from "fs";
import path from "path";
import type { PrismaClient } from "@prisma/client";
import { slugify } from "./slug";
import { ensureMediaForImage } from "./media";
import { hashSource, type MigrationStats } from "./types";

// Kapasite paketleri ve referans kartlarının ayrı detay sayfası yok; kaynak sayfa ana sayfadır.
const HOME_SOURCE_URL = "https://www.mezbahateknolojileri.com/tr/";

const ROOT = path.join(__dirname, "..", "..");
const VERIFICATION_PATH = path.join(
  ROOT,
  "docs",
  "migration-data",
  "projects-verification.json"
);

type VerificationData = {
  capacityPackages: {
    code: string;
    area: string;
    capacity: string;
    description: string;
    imageSourceUrl: string | null;
  }[];
  referenceProjectCards: {
    haveIndividualUrls: boolean;
    cards: { country: string; city: string; type: string; capacity: string; detailUrl: string | null }[];
  };
};

function findLocalCapacityImage(code: string): string | null {
  const dir = path.join(ROOT, "public", "images", "migrated", "projects", "capacity");
  const key = slugify(code);
  for (const ext of ["png", "jpg", "webp"]) {
    const candidate = path.join(dir, `${key}.${ext}`);
    if (existsSync(candidate)) {
      return path.relative(ROOT, candidate);
    }
  }
  return null;
}

export async function importProjects(
  prisma: PrismaClient,
  dryRun: boolean,
  stats: MigrationStats
) {
  if (!existsSync(VERIFICATION_PATH)) {
    stats.projects.errors.push({
      source: VERIFICATION_PATH,
      reason: "projects-verification.json bulunamadı, proje importu atlandı.",
    });
    return;
  }

  const data: VerificationData = JSON.parse(readFileSync(VERIFICATION_PATH, "utf-8"));

  // --- Kapasite paketleri (ProjectType.CAPACITY_SOLUTION) ---
  for (let i = 0; i < data.capacityPackages.length; i++) {
    const pkg = data.capacityPackages[i];
    const slug = slugify(pkg.code);
    stats.provenance.push({ entityType: "project", entityId: null, slug, sourceUrl: HOME_SOURCE_URL, sourceHash: hashSource(pkg), importedAt: new Date().toISOString() });

    let coverImage: string | null = null;
    const localImagePath = findLocalCapacityImage(pkg.code);
    if (localImagePath && pkg.imageSourceUrl) {
      coverImage = await ensureMediaForImage(
        prisma,
        { sourceUrl: pkg.imageSourceUrl, localPath: localImagePath, alt: `${pkg.code} kapasite paketi` },
        dryRun,
        stats
      );
    }

    const existing = await prisma.project.findUnique({ where: { slug } });

    if (existing) {
      const existingTranslation = await prisma.projectTranslation.findUnique({
        where: { projectId_locale: { projectId: existing.id, locale: "tr" } },
      });
      const descChanged = existingTranslation?.description !== pkg.description;
      if (descChanged || existing.area !== pkg.area || existing.capacity !== pkg.capacity) {
        stats.projects.updated += 1;
        stats.diffs.push(
          `Project (capacity) ${slug}: açıklama/alan/kapasite kaynaktan güncellendi.`
        );
        if (!dryRun) {
          await prisma.$transaction([
            prisma.project.update({
              where: { id: existing.id },
              data: {
                area: pkg.area,
                capacity: pkg.capacity,
                sortOrder: i,
                coverImage: coverImage ?? existing.coverImage,
              },
            }),
            prisma.projectTranslation.upsert({
              where: { projectId_locale: { projectId: existing.id, locale: "tr" } },
              create: {
                projectId: existing.id,
                locale: "tr",
                name: pkg.code,
                shortDescription: pkg.description.slice(0, 200),
                description: pkg.description,
              },
              update: { shortDescription: pkg.description.slice(0, 200), description: pkg.description },
            }),
          ]);
        }
      } else {
        stats.projects.skipped += 1;
      }
      continue;
    }

    stats.projects.new += 1;
    if (!dryRun) {
      await prisma.$transaction(async (tx) => {
        const created = await tx.project.create({
          data: {
            slug,
            type: "CAPACITY_SOLUTION",
            country: "Türkiye",
            capacity: pkg.capacity,
            area: pkg.area,
            coverImage,
            sortOrder: i,
            status: "PUBLISHED",
            publishedAt: null, // kaynakta yayın tarihi yok; migration zamanı damgalanmaz
          },
        });
        await tx.projectTranslation.create({
          data: {
            projectId: created.id,
            locale: "tr",
            name: pkg.code,
            shortDescription: pkg.description.slice(0, 200),
            description: pkg.description,
            seoTitle: `${pkg.code} Kapasite Paketi`,
            seoDescription: pkg.description.slice(0, 155),
          },
        });
      });
    }
  }

  // --- Uluslararası referans projeler (ProjectType.REFERENCE) ---
  // detailUrl == null (doğrulandı: bu kartların ayrı detay URL'si yok) — sourceUrl olarak
  // her zaman homepage kullanılıyor, ayrı bir ürün sayfası URL'i UYDURULMUYOR.
  const cards = data.referenceProjectCards.cards;
  for (let i = 0; i < cards.length; i++) {
    const card = cards[i];
    const slug = slugify(`${card.country}-${card.city}`);
    stats.provenance.push({ entityType: "project", entityId: null, slug, sourceUrl: HOME_SOURCE_URL, sourceHash: hashSource(card), importedAt: new Date().toISOString() });
    const name = `${card.country} / ${card.city} — ${card.type}`;

    const existing = await prisma.project.findUnique({ where: { slug } });
    if (existing) {
      stats.projects.skipped += 1;
      continue;
    }

    stats.projects.new += 1;
    if (!dryRun) {
      await prisma.$transaction(async (tx) => {
        const created = await tx.project.create({
          data: {
            slug,
            type: "REFERENCE",
            country: card.country,
            city: card.city,
            capacity: card.capacity,
            sortOrder: i,
            status: "PUBLISHED",
            publishedAt: null, // kaynakta yayın tarihi yok; migration zamanı damgalanmaz
            featured: i < 4,
          },
        });
        await tx.projectTranslation.create({
          data: {
            projectId: created.id,
            locale: "tr",
            name,
            seoTitle: name,
          },
        });
      });
    }
  }
}
