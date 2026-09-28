import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";
import { CANONICAL_LOCALE, type Locale } from "@/lib/i18n/config";

/**
 * Tüm sorgular `locale` (varsayılan Türkçe) alır; Türkçe davranış eskisiyle aynıdır. Diğer dillerde bir kayıt yalnızca o dilde
 * çevirisi VE dile özel slug'ı varsa görünür (`avail`); slug ile arama çeviri tablosundaki `slug` alanından yapılır (`bySlug`).
 */
const avail = (locale: Locale) => (locale === CANONICAL_LOCALE ? {} : { translations: { some: { locale, slug: { not: null } } } });
const bySlug = (slug: string, locale: Locale) => (locale === CANONICAL_LOCALE ? { slug } : { translations: { some: { locale, slug } } });
const tr = (locale: Locale) => ({ where: { locale } });

export function getCategoryListing(locale: Locale = CANONICAL_LOCALE) {
  return prisma.productCategory.findMany({
    where: { active: true, ...avail(locale) },
    orderBy: { sortOrder: "asc" },
    include: {
      translations: tr(locale),
      _count: { select: { products: { where: { status: "PUBLISHED", active: true, ...avail(locale) } } } },
    },
  });
}

export function getCategoryBySlug(slug: string, locale: Locale = CANONICAL_LOCALE) {
  return prisma.productCategory.findFirst({
    where: { ...bySlug(slug, locale), active: true },
    include: { translations: tr(locale) },
  });
}

export function getPublishedProductsByCategory(categoryId: string, locale: Locale = CANONICAL_LOCALE) {
  return prisma.product.findMany({
    where: { categoryId, status: "PUBLISHED", active: true, ...avail(locale) },
    orderBy: { sortOrder: "asc" },
    include: { translations: tr(locale) },
  });
}

/** Ürünler sayfası: tüm yayınlı ürünler (filtre/arama/sayfalama sunucuda yapılır). */
export function getAllPublishedProducts(locale: Locale = CANONICAL_LOCALE) {
  return prisma.product.findMany({
    where: { status: "PUBLISHED", active: true, ...avail(locale) },
    orderBy: [{ category: { sortOrder: "asc" } }, { sortOrder: "asc" }, { createdAt: "asc" }],
    include: {
      translations: tr(locale),
      category: { include: { translations: tr(locale) } },
    },
  });
}

/** React cache: sayfa + generateMetadata aynı istekte tek DB sorgusu yapar. */
export const getProductBySlug = cache((slug: string, locale: Locale = CANONICAL_LOCALE) => {
  return prisma.product.findFirst({
    where: { ...bySlug(slug, locale), status: "PUBLISHED", active: true },
    include: {
      translations: tr(locale),
      category: { include: { translations: tr(locale) } },
      images: { orderBy: { sortOrder: "asc" } },
      specifications: { where: { locale }, orderBy: { sortOrder: "asc" } },
      documents: { orderBy: { sortOrder: "asc" } },
      relatedProjects: {
        where: { status: "PUBLISHED", ...avail(locale) },
        include: { translations: tr(locale) },
        take: 4,
      },
      relatedPosts: {
        where: { status: "PUBLISHED", ...avail(locale) },
        include: { translations: tr(locale) },
        take: 4,
      },
    },
  });
});

/** Ürün detay sayfası: aynı kategorideki diğer yayınlı ürünler (görseli olanlar önce). */
export function getRelatedProducts(categoryId: string, excludeId: string, take = 4, locale: Locale = CANONICAL_LOCALE) {
  return prisma.product.findMany({
    where: { categoryId, id: { not: excludeId }, status: "PUBLISHED", active: true, ...avail(locale) },
    orderBy: [{ coverImage: { sort: "desc", nulls: "last" } }, { sortOrder: "asc" }],
    take,
    include: { translations: tr(locale) },
  });
}

/**
 * Öne çıkan ürünler: `featured` işaretliler önce gelir; işaretli sayısı `take`'ten azsa kalan
 * kontenjan yayındaki gerçek ürünlerle (görseli olanlar öncelikli) doldurulur — böylece ana
 * sayfa DB dolu olduğu halde ince kalmaz ve statik yedek içeriğe düşmez.
 */
export function getFeaturedProducts(take = 6, locale: Locale = CANONICAL_LOCALE) {
  return prisma.product.findMany({
    where: { status: "PUBLISHED", active: true, ...avail(locale) },
    orderBy: [
      { featured: "desc" },
      { sortOrder: "asc" },
      { coverImage: { sort: "desc", nulls: "last" } },
      { createdAt: "asc" },
    ],
    take,
    include: {
      translations: tr(locale),
      category: { include: { translations: tr(locale) } },
    },
  });
}

export function getReferenceProjects(locale: Locale = CANONICAL_LOCALE) {
  return prisma.project.findMany({
    where: { status: "PUBLISHED", type: "REFERENCE", ...avail(locale) },
    orderBy: { publishedAt: "desc" },
    include: { translations: tr(locale) },
  });
}

export function getFeaturedProjects(take = 4, locale: Locale = CANONICAL_LOCALE) {
  return prisma.project.findMany({
    where: { status: "PUBLISHED", type: "REFERENCE", featured: true, ...avail(locale) },
    orderBy: { publishedAt: "desc" },
    take,
    include: { translations: tr(locale) },
  });
}

export function getCapacitySolutions(locale: Locale = CANONICAL_LOCALE) {
  return prisma.project.findMany({
    where: { status: "PUBLISHED", type: "CAPACITY_SOLUTION", ...avail(locale) },
    orderBy: { sortOrder: "asc" },
    include: { translations: tr(locale), images: { orderBy: { sortOrder: "asc" } } },
  });
}

/** React cache: sayfa + generateMetadata aynı istekte tek DB sorgusu yapar. */
export const getProjectBySlug = cache((slug: string, locale: Locale = CANONICAL_LOCALE) => {
  return prisma.project.findFirst({
    where: { ...bySlug(slug, locale), status: "PUBLISHED" },
    include: {
      translations: tr(locale),
      images: { orderBy: { sortOrder: "asc" } },
      relatedProducts: {
        where: { status: "PUBLISHED", active: true, ...avail(locale) },
        include: { translations: tr(locale) },
        take: 4,
      },
    },
  });
});

export function getBlogListing(locale: Locale = CANONICAL_LOCALE) {
  return prisma.blogPost.findMany({
    where: { status: "PUBLISHED", ...avail(locale) },
    orderBy: { publishedAt: "desc" },
    include: {
      translations: tr(locale),
      category: { include: { translations: tr(locale) } },
    },
  });
}

/** `featured` yazılar önce; eksik kontenjan en yeni yayınlı yazılarla tamamlanır (bkz. getFeaturedProducts). */
export function getFeaturedBlogPosts(take = 3, locale: Locale = CANONICAL_LOCALE) {
  return prisma.blogPost.findMany({
    where: { status: "PUBLISHED", ...avail(locale) },
    orderBy: [
      { featured: "desc" },
      { publishedAt: { sort: "desc", nulls: "last" } },
      { createdAt: "desc" },
    ],
    take,
    include: { translations: tr(locale) },
  });
}

/** React cache: sayfa + generateMetadata aynı istekte tek DB sorgusu yapar. */
export const getBlogPostBySlug = cache((slug: string, locale: Locale = CANONICAL_LOCALE) => {
  return prisma.blogPost.findFirst({
    where: { ...bySlug(slug, locale), status: "PUBLISHED" },
    include: {
      translations: tr(locale),
      category: { include: { translations: tr(locale) } },
      tags: true,
      relatedProducts: {
        where: { status: "PUBLISHED", active: true, ...avail(locale) },
        include: { translations: tr(locale) },
        take: 4,
      },
      relatedProjects: {
        where: { status: "PUBLISHED", ...avail(locale) },
        include: { translations: tr(locale) },
        take: 4,
      },
    },
  });
});

/** Blog yazısı sayfası: "Son Gönderiler" (geçerli yazı hariç). */
export function getRecentBlogPosts(excludeId: string, take = 3, locale: Locale = CANONICAL_LOCALE) {
  return prisma.blogPost.findMany({
    where: { status: "PUBLISHED", id: { not: excludeId }, ...avail(locale) },
    orderBy: [{ publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    take,
    include: { translations: tr(locale) },
  });
}

/**
 * Bağlamsal "İlgili Yazılar": geçerli yazıyla en çok ortak etikete sahip yayınlı yazılar (eşitlikte en yeni önce);
 * 3'ten az bulunursa en yeni yazılarla tamamlanır.
 */
export async function getRelatedBlogPosts(postId: string, tagIds: string[], take = 4, locale: Locale = CANONICAL_LOCALE) {
  const include = { translations: tr(locale) } as const;

  const shared = tagIds.length
    ? await prisma.blogPost.findMany({
        where: { status: "PUBLISHED", id: { not: postId }, tags: { some: { id: { in: tagIds } } }, ...avail(locale) },
        include: { ...include, tags: { select: { id: true } } },
      })
    : [];

  const ranked = shared
    .map((p) => ({ post: p, overlap: p.tags.filter((t) => tagIds.includes(t.id)).length }))
    .sort((a, b) => b.overlap - a.overlap || (b.post.publishedAt?.getTime() ?? 0) - (a.post.publishedAt?.getTime() ?? 0))
    .slice(0, take)
    .map((x) => x.post);

  if (ranked.length >= 3) return ranked;

  const fill = await prisma.blogPost.findMany({
    where: { status: "PUBLISHED", id: { notIn: [postId, ...ranked.map((p) => p.id)] }, ...avail(locale) },
    orderBy: [{ publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
    take: take - ranked.length,
    include: { ...include, tags: { select: { id: true } } },
  });
  return [...ranked, ...fill];
}

/** Etiket sayfası: etiket + o etikete sahip yayınlı yazılar. */
export const getBlogTagWithPosts = cache((slug: string, locale: Locale = CANONICAL_LOCALE) => {
  return prisma.blogTag.findUnique({
    where: { slug },
    include: {
      posts: {
        where: { status: "PUBLISHED", ...avail(locale) },
        orderBy: [{ publishedAt: { sort: "desc", nulls: "last" } }, { createdAt: "desc" }],
        include: {
          translations: tr(locale),
          category: { include: { translations: tr(locale) } },
        },
      },
    },
  });
});

/** Sitemap: en az bir yayınlı yazısı olan etiketler. */
export function getBlogTagsForSitemap() {
  return prisma.blogTag.findMany({
    where: { posts: { some: { status: "PUBLISHED" } } },
    select: { slug: true, posts: { where: { status: "PUBLISHED" }, select: { updatedAt: true } } },
  });
}

/** CMS `Page` kayıtlarından hizmet sayfaları (pageType = "service"). */
export function getServicePages(locale: Locale = CANONICAL_LOCALE) {
  return prisma.page.findMany({
    where: { status: "PUBLISHED", pageType: "service", ...avail(locale) },
    include: { translations: tr(locale) },
    orderBy: { createdAt: "asc" },
  });
}

export const getServicePageBySlug = cache((slug: string, locale: Locale = CANONICAL_LOCALE) => {
  return prisma.page.findFirst({
    where: { ...bySlug(slug, locale), status: "PUBLISHED", pageType: "service" },
    include: { translations: tr(locale) },
  });
});

type SluggedKind = "product" | "category" | "blog" | "project" | "page";

/** Bir varlığın dillere göre slug'ları (hreflang için): Türkçe = ana kayıt slug'ı, diğerleri çeviri tablosundan (yalnızca slug'ı olanlar). */
export async function getLocaleSlugs(kind: SluggedKind, id: string, trSlug: string): Promise<Partial<Record<Locale, string>>> {
  const select = { locale: true, slug: true } as const;
  const rows =
    kind === "product"
      ? await prisma.productTranslation.findMany({ where: { productId: id, slug: { not: null } }, select })
      : kind === "category"
        ? await prisma.productCategoryTranslation.findMany({ where: { categoryId: id, slug: { not: null } }, select })
        : kind === "blog"
          ? await prisma.blogPostTranslation.findMany({ where: { blogPostId: id, slug: { not: null } }, select })
          : kind === "project"
            ? await prisma.projectTranslation.findMany({ where: { projectId: id, slug: { not: null } }, select })
            : await prisma.pageTranslation.findMany({ where: { pageId: id, slug: { not: null } }, select });
  const out: Partial<Record<Locale, string>> = { [CANONICAL_LOCALE]: trSlug };
  for (const r of rows) if (r.slug && r.locale !== CANONICAL_LOCALE) out[r.locale as Locale] = r.slug;
  return out;
}
