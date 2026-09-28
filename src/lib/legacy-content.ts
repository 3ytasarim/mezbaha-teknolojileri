import "server-only";
import catalogsJson from "@/content/legacy/catalogs.json";
import videosJson from "@/content/legacy/videos.json";

/**
 * Eski siteden (Phase 11D) taşınan, CMS tablosu olmayan gerçek içerik: kataloglar ve videolar.
 * Veri `prisma/migration/acquire-legacy-content.ts` ile üretilir; kaynak/provenance
 * `docs/migration-provenance-legacy.json` içindedir. Yeni katalog/video eklemek için bu JSON
 * dosyalarına kayıt eklemek ve görselleri `public/images/migrated/` altına koymak yeterlidir.
 */

export type Catalog = {
  slug: string;
  title: string;
  cover: { path: string; alt: string; width: number; height: number };
  pageCount: number;
  pageWidth: number;
  pageHeight: number;
  pagePathPattern: string;
};

export type LegacyVideo = {
  id: string;
  order: number;
  title: string;
  channel: string | null;
  channelUrl: string | null;
  thumbnail: string;
  watchUrl: string;
};

export function getCatalogs(): Catalog[] {
  return catalogsJson.map((c) => ({
    slug: c.slug,
    title: c.title,
    cover: c.cover,
    pageCount: c.pageCount,
    pageWidth: c.pageWidth,
    pageHeight: c.pageHeight,
    pagePathPattern: c.pagePathPattern,
  }));
}

export function getCatalogBySlug(slug: string): Catalog | null {
  return getCatalogs().find((c) => c.slug === slug) ?? null;
}

export function catalogPagePath(catalog: Catalog, page: number): string {
  return catalog.pagePathPattern.replace("{NNN}", String(page).padStart(3, "0"));
}

/** Yalnızca herkese açık oynatılabilen videolar (gizli/kaldırılmış olanlar yayınlanmaz). */
export function getPlayableVideos(): LegacyVideo[] {
  return videosJson.videos
    .filter((v) => v.available && v.title && v.thumbnail)
    .map((v) => ({
      id: v.id,
      order: v.order,
      title: v.title as string,
      channel: v.channel,
      channelUrl: v.channelUrl,
      thumbnail: v.thumbnail as string,
      watchUrl: v.watchUrl,
    }));
}

export const VIDEO_GALLERY_TITLE = videosJson.pageTitle;
