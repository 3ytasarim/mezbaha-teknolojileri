/** Etiketin görünen adı: kayıtlıysa `name` (Türkçe karakterli), yoksa slug'dan üretilir ("ikizray-sistemleri" → "Ikizray Sistemleri"). */
export function tagLabel(tag: { slug: string; name: string | null }): string {
  if (tag.name) return tag.name;
  return tag.slug
    .split("-")
    .filter(Boolean)
    .map((w) => w.charAt(0).toLocaleUpperCase("tr") + w.slice(1))
    .join(" ");
}

export const tagHref = (slug: string) => `/blog/etiket/${slug}`;
