import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/seo/site";
import { prisma } from "@/lib/db";
import { getCatalogs } from "@/lib/legacy-content";
import { getBlogTagsForSitemap } from "@/lib/queries";
import { CANONICAL_LOCALE, DEFAULT_LOCALE, ENABLED_LOCALES, isPageAvailable, type Locale } from "@/lib/i18n/config";
import { localizePath } from "@/lib/i18n/routes";

/** Saatte bir yeniden üretilir (içerik ve dil listesi değişince güncellenir). */
export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];
type Translated = { slug: string; updatedAt: Date; translations: { locale: string; slug: string | null }[]; images?: string[] };

/**
 * Çok dilli site haritası: her URL kendi dilinde bir kayıttır ve `alternates.languages` ile diğer dillerdeki karşılıklarını
 * (hreflang) taşır. Türkçe slug'ı ana kayıttan, diğer diller çeviri tablosundaki `slug`'dan gelir; çevirisi olmayan dilde kayıt yoktur.
 * Yalnızca ENABLED_LOCALES'teki diller yazılır.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const locales = ENABLED_LOCALES;
  const multi = locales.length > 1;
  const abs = (locale: Locale, internalPath: string) => {
    const p = localizePath(locale, internalPath);
    return p === "/" ? siteUrl : `${siteUrl}${p}`;
  };

  const tSel = { select: { locale: true as const, slug: true as const }, where: { locale: { in: [...locales] as string[] }, slug: { not: null } } };

  const [categoriesRaw, productsRaw, projectsRaw, postsRaw, servicePages, tags] = await Promise.all([
    prisma.productCategory.findMany({ where: { active: true }, select: { slug: true, updatedAt: true, translations: tSel, image: true } }),
    // Google Images keşfi için kapak + ilk 4 galeri görseli (aşırı büyük <image:image> listesinden kaçınmak amacıyla sınırlı).
    prisma.product.findMany({
      where: { status: "PUBLISHED", active: true },
      select: { slug: true, updatedAt: true, translations: tSel, coverImage: true, images: { select: { imageUrl: true }, orderBy: { sortOrder: "asc" }, take: 4 } },
    }),
    prisma.project.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true, translations: tSel, coverImage: true } }),
    prisma.blogPost.findMany({ where: { status: "PUBLISHED" }, select: { slug: true, updatedAt: true, translations: tSel, coverImage: true } }),
    prisma.page.findMany({ where: { status: "PUBLISHED", pageType: "service" }, select: { slug: true, updatedAt: true, translations: tSel } }),
    getBlogTagsForSitemap(),
  ]);

  const categories: Translated[] = categoriesRaw.map((c) => ({ ...c, images: c.image ? [c.image] : undefined }));
  const products: Translated[] = productsRaw.map((p) => ({ ...p, images: [p.coverImage, ...p.images.map((i) => i.imageUrl)].filter((x): x is string => Boolean(x)) }));
  const projects: Translated[] = projectsRaw.map((p) => ({ ...p, images: p.coverImage ? [p.coverImage] : undefined }));
  const posts: Translated[] = postsRaw.map((p) => ({ ...p, images: p.coverImage ? [p.coverImage] : undefined }));

  /** Bir gruptaki en son güncelleme tarihi (gerçek lastmod); grup boşsa undefined → etiket hiç yazılmaz. */
  const latest = (...groups: { updatedAt: Date }[][]) => {
    const times = groups.flat().map((x) => x.updatedAt.getTime());
    return times.length ? new Date(Math.max(...times)) : undefined;
  };

  /** Bir yolun her etkin dildeki karşılığı için kayıtlar (statik sayfalar: tüm etkin dillerde vardır). */
  const staticPage = (internalPath: string, rest: Omit<Entry, "url" | "alternates">): Entry[] => {
    const here = locales.filter((l) => isPageAvailable(l, internalPath));
    const languages = multi && here.length > 1 ? { ...Object.fromEntries(here.map((l) => [l, abs(l, internalPath)])), "x-default": abs(DEFAULT_LOCALE, internalPath) } : undefined;
    return here.map((l) => ({ url: abs(l, internalPath), ...rest, ...(languages ? { alternates: { languages } } : {}) }));
  };

  /** Çeviri tablolu varlıklar: her dilde kendi slug'ıyla; hreflang yalnızca var olan dillere. */
  const entityPages = (prefix: string, rows: Translated[], rest: Omit<Entry, "url" | "alternates" | "lastModified">): Entry[] => {
    const out: Entry[] = [];
    for (const row of rows) {
      const slugs: Partial<Record<Locale, string>> = { [CANONICAL_LOCALE]: row.slug };
      for (const t of row.translations) if (t.slug && t.locale !== CANONICAL_LOCALE) slugs[t.locale as Locale] = t.slug;
      const present = locales.filter((l) => slugs[l]);
      const languages =
        present.length > 1
          ? { ...Object.fromEntries(present.map((l) => [l, abs(l, `${prefix}/${slugs[l]}`)])), "x-default": abs(DEFAULT_LOCALE, `${prefix}/${slugs[DEFAULT_LOCALE]}`) }
          : undefined;
      // Aynı fiziksel görseller her dil kaydında tekrarlanır: Google Images bir görseli hangi dildeki sayfada bulursa bulsun aynı dosyayı tanır.
      const images = row.images?.length ? row.images.map((img) => new URL(img, siteUrl).toString()) : undefined;
      for (const l of present) out.push({ url: abs(l, `${prefix}/${slugs[l]}`), lastModified: row.updatedAt, ...rest, ...(languages ? { alternates: { languages } } : {}), ...(images ? { images } : {}) });
    }
    return out;
  };

  const staticEntries: Entry[] = [
    ...staticPage("/", { lastModified: latest(products, projects, posts), changeFrequency: "weekly", priority: 1 }),
    ...staticPage("/urunler", { lastModified: latest(products), changeFrequency: "weekly", priority: 0.8 }),
    ...staticPage("/teklif-al", { changeFrequency: "yearly", priority: 0.5 }),
    ...staticPage("/projeler", { lastModified: latest(projects), changeFrequency: "weekly", priority: 0.8 }),
    ...staticPage("/referanslar", { changeFrequency: "monthly", priority: 0.6 }),
    ...staticPage("/blog", { lastModified: latest(posts), changeFrequency: "weekly", priority: 0.6 }),
    ...staticPage("/kataloglar", { changeFrequency: "monthly", priority: 0.5 }),
    ...staticPage("/videolar", { changeFrequency: "monthly", priority: 0.5 }),
    ...staticPage("/hizmetler", { lastModified: latest(servicePages), changeFrequency: "monthly", priority: 0.5 }),
    ...staticPage("/hakkimizda", { changeFrequency: "monthly", priority: 0.5 }),
    ...staticPage("/iletisim", { changeFrequency: "monthly", priority: 0.5 }),
  ];

  const categoryEntries = entityPages("/urunler", categories, { changeFrequency: "weekly", priority: 0.7 });
  const productEntries = entityPages("/urun", products, { changeFrequency: "monthly", priority: 0.6 });
  const projectEntries = entityPages("/projeler", projects, { changeFrequency: "monthly", priority: 0.5 });
  const postEntries = entityPages("/blog", posts, { changeFrequency: "monthly", priority: 0.5 });
  const serviceEntries = entityPages("/hizmetler", servicePages, { changeFrequency: "monthly", priority: 0.5 });

  // Etiket sayfaları yalnızca Türkçedir (etiket kayıtları çevrilmemiştir).
  const tagEntries: Entry[] = tags.map((tag) => ({
    url: abs(CANONICAL_LOCALE, `/blog/etiket/${tag.slug}`),
    lastModified: latest(tag.posts),
    changeFrequency: "monthly",
    priority: 0.4,
  }));

  // Kataloglar: aynı slug, tüm etkin dillerde.
  const catalogEntries: Entry[] = getCatalogs().flatMap((catalog) => staticPage(`/kataloglar/${catalog.slug}`, { changeFrequency: "yearly", priority: 0.4 }));

  return [...staticEntries, ...categoryEntries, ...productEntries, ...projectEntries, ...postEntries, ...tagEntries, ...catalogEntries, ...serviceEntries];
}
