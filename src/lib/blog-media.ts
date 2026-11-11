import { CANONICAL_LOCALE, type Locale } from "@/lib/i18n/config";

/**
 * Blog kapak görseli alt metni: önce dile özgü `imageAlt`; Türkçede (kanonik dil) yönetim panelindeki
 * `coverImageAlt`; yoksa yazının başlığı. Başka dilin alt metni asla başka dilde görünmez.
 */
export function blogCoverAlt(
  post: { slug: string; coverImageAlt: string | null },
  translation: { title?: string | null; imageAlt?: string | null } | undefined,
  locale: Locale
): string {
  return translation?.imageAlt || (locale === CANONICAL_LOCALE ? post.coverImageAlt : null) || translation?.title || post.slug;
}

/**
 * Kapak görselinin en/boy oranı (Medya tablosundaki gerçek ölçülerden). Kare/dikey görseller kart ve kapakta
 * kırpılmadan gösterilebilsin diye kullanılır. Tüm medya ölçüleri tek sorguyla çekilir ve kısa süre bellekte tutulur;
 * Medya kaydı olmayan (eski) görseller için `null` döner ve mevcut kırpmalı yerleşim sürer.
 */
let ratioCache: { at: number; map: Map<string, number> } | null = null;
export async function getCoverRatio(url: string | null | undefined): Promise<number | null> {
  if (!url) return null;
  if (!ratioCache || Date.now() - ratioCache.at > 5 * 60_000) {
    const { prisma } = await import("@/lib/db");
    const rows = await prisma.media.findMany({ where: { url: { startsWith: "/uploads/" }, width: { gt: 0 }, height: { gt: 0 } }, select: { url: true, width: true, height: true } });
    ratioCache = { at: Date.now(), map: new Map(rows.map((r) => [r.url, r.width! / r.height!])) };
  }
  return ratioCache.map.get(url) ?? null;
}
