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
