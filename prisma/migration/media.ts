import { existsSync, statSync } from "fs";
import path from "path";
import type { PrismaClient } from "@prisma/client";
import type { MigrationStats, SourceImage } from "./types";

const ROOT = path.join(__dirname, "..", "..");
const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/**
 * Agent'lar iki farklı konvansiyon kullandı: bazıları proje köküne göre
 * "public/images/migrated/..." verdi, bazıları web-root'a göre "/images/migrated/...".
 * Her ikisini de gerçek dosya sistemi yoluna ve gerçek public URL'e normalize eder.
 */
function resolveLocalImage(localPath: string): { absolutePath: string; publicUrl: string } {
  const normalized = localPath.replace(/\\/g, "/");
  const idx = normalized.indexOf("public/");

  if (idx >= 0) {
    // "...public/images/..." (proje köküne göre, mutlak veya göreli)
    const rel = normalized.slice(idx + "public/".length);
    return {
      absolutePath: path.join(ROOT, "public", rel),
      publicUrl: "/" + rel.replace(/^\/+/, ""),
    };
  }

  // Web-root stili: "/images/migrated/..." -> public/images/migrated/...
  const rel = normalized.replace(/^\/+/, "");
  return {
    absolutePath: path.join(ROOT, "public", rel),
    publicUrl: "/" + rel,
  };
}

/**
 * Daha önce agent'lar tarafından public/images/migrated/... altına indirilmiş bir
 * görsel için Media row'u upsert eder (sourceUrl bazlı dedupe). Dosya diskte yoksa
 * hata olarak raporlar, DB'yi bozmaz.
 */
export async function ensureMediaForImage(
  prisma: PrismaClient,
  image: SourceImage,
  dryRun: boolean,
  stats: MigrationStats
): Promise<string | null> {
  if (!image.localPath) {
    stats.media.failed += 1;
    return null;
  }

  const { absolutePath, publicUrl } = resolveLocalImage(image.localPath);

  if (!existsSync(absolutePath)) {
    stats.media.failed += 1;
    return null;
  }

  const existing = await prisma.media.findFirst({ where: { sourceUrl: image.sourceUrl } });
  if (existing) {
    stats.media.reused += 1;
    if (!dryRun && image.alt && !existing.alt) {
      await prisma.media.update({ where: { id: existing.id }, data: { alt: image.alt } });
    }
    return existing.url;
  }

  const ext = path.extname(absolutePath).toLowerCase();
  const stat = statSync(absolutePath);

  stats.media.downloaded += 1;

  if (dryRun) {
    return publicUrl;
  }

  const media = await prisma.media.create({
    data: {
      filename: path.basename(absolutePath),
      originalName: path.basename(absolutePath),
      mimeType: MIME_BY_EXT[ext] ?? "application/octet-stream",
      url: publicUrl,
      storageKey: publicUrl,
      alt: image.alt ?? null,
      fileSize: stat.size,
      sourceUrl: image.sourceUrl,
    },
  });

  return media.url;
}
