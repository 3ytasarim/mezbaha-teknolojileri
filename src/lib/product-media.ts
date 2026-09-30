import "server-only";

export type GalleryOverride = { baseImageUrl: string; imageUrl: string };

/** Dile özgü kapak görseli varsa onu, yoksa ortak (Türkçe) kapak görselini döner. */
export function resolveCoverImage(
  coverImage: string | null | undefined,
  localeCoverImage: string | null | undefined
): string | null {
  return localeCoverImage || coverImage || null;
}

/** Dile özgü galeri görseli eşlemesi varsa (üzerinde o dilde yazı olan görsel) onu, yoksa ortak görseli döner. */
export function resolveGalleryImageUrl(baseImageUrl: string, galleryOverrides: unknown): string {
  if (!Array.isArray(galleryOverrides)) return baseImageUrl;
  const match = (galleryOverrides as GalleryOverride[]).find(
    (o) => o && typeof o === "object" && o.baseImageUrl === baseImageUrl
  );
  return match?.imageUrl || baseImageUrl;
}
