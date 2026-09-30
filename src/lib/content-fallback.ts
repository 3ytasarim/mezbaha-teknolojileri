import "server-only";
import {
  getCategoryListing,
  getFeaturedProducts,
  getCapacitySolutions,
  getFeaturedProjects,
  getReferenceProjects,
  getFeaturedBlogPosts,
} from "@/lib/queries";
import {
  PRODUCT_CATEGORIES,
  FEATURED_PRODUCTS,
  CAPACITY_PACKAGES,
  FEATURED_PROJECTS,
  GLOBAL_PROJECTS,
  BLOG_PREVIEWS,
} from "@/content/home";
import { CANONICAL_LOCALE, type Locale } from "@/lib/i18n/config";
import { slugOf } from "@/lib/i18n/slug";
import { resolveCoverImage } from "@/lib/product-media";

/**
 * Veritabanı boşsa Türkçede statik yedek içerik (content/home.ts) gösterilir. Diğer dillerde YEDEK KULLANILMAZ (Türkçe metin
 * başka dilde görünmesin): boş liste döner.
 */
const fallback = <T,>(items: T[], locale: Locale): T[] => (locale === CANONICAL_LOCALE ? items : []);

export type DisplayCategory = {
  slug: string;
  name: string;
  shortDescription: string;
  href: string;
  image: string;
  imageAlt: string;
};

export async function getDisplayCategories(locale: Locale = CANONICAL_LOCALE): Promise<DisplayCategory[]> {
  const categories = await getCategoryListing(locale);

  if (categories.length === 0) return fallback(PRODUCT_CATEGORIES, locale);

  return categories.map((category) => {
    const translation = category.translations[0];
    return {
      slug: category.slug,
      name: translation?.name ?? category.slug,
      shortDescription: translation?.shortDescription ?? "",
      href: `/urunler/${slugOf(category, locale)}`,
      image: category.image ?? "",
      imageAlt: translation?.name ?? category.slug,
    };
  });
}

export type DisplayProduct = {
  name: string;
  categoryName: string;
  shortDescription: string;
  href: string;
  image: string;
  imageAlt: string;
};

export async function getDisplayFeaturedProducts(locale: Locale = CANONICAL_LOCALE): Promise<DisplayProduct[]> {
  const products = await getFeaturedProducts(12, locale);

  if (products.length === 0) return fallback(FEATURED_PRODUCTS, locale);

  return products.map((product) => {
    const translation = product.translations[0];
    const categoryTranslation = product.category.translations[0];
    return {
      name: translation?.name ?? product.slug,
      categoryName: categoryTranslation?.name ?? product.category.slug,
      shortDescription: translation?.shortDescription ?? "",
      href: `/urun/${slugOf(product, locale)}`,
      image: resolveCoverImage(product.coverImage, translation?.coverImage) ?? "",
      imageAlt: translation?.imageAlt || translation?.name || product.slug,
    };
  });
}

export type DisplayCapacityPackage = {
  code: string;
  area: string;
  capacity: string;
  detail: string;
};

export async function getDisplayCapacityPackages(locale: Locale = CANONICAL_LOCALE): Promise<DisplayCapacityPackage[]> {
  const packages = await getCapacitySolutions(locale);

  if (packages.length === 0) return fallback(CAPACITY_PACKAGES, locale);

  return packages.map((pkg) => {
    const translation = pkg.translations[0];
    return {
      code: translation?.name ?? pkg.slug,
      area: pkg.area ?? "",
      capacity: pkg.capacity ?? "",
      detail: translation?.shortDescription ?? "",
    };
  });
}

export type DisplayFeaturedProject = {
  country: string;
  city: string;
  type: string;
  capacity: string;
};

export async function getDisplayFeaturedProjects(locale: Locale = CANONICAL_LOCALE): Promise<DisplayFeaturedProject[]> {
  const projects = await getFeaturedProjects(4, locale);

  if (projects.length === 0) return fallback(FEATURED_PROJECTS, locale);

  return projects.map((project) => ({
    country: project.country,
    city: project.city ?? "",
    type: project.translations[0]?.name ?? "Proje",
    capacity: project.capacity ?? "",
  }));
}

export type DisplayGlobalProject = {
  country: string;
  city: string;
  type: string;
  capacity: string;
};

export async function getDisplayGlobalProjects(locale: Locale = CANONICAL_LOCALE): Promise<DisplayGlobalProject[]> {
  const projects = await getReferenceProjects(locale);

  if (projects.length === 0) return fallback(GLOBAL_PROJECTS, locale);

  return projects.map((project) => ({
    country: project.country,
    city: project.city ?? "",
    type: project.translations[0]?.name ?? "Proje",
    capacity: project.capacity ?? "",
  }));
}

export type DisplayBlogPreview = {
  title: string;
  excerpt: string;
  href: string;
  image?: string | null;
};

export async function getDisplayBlogPreviews(locale: Locale = CANONICAL_LOCALE): Promise<DisplayBlogPreview[]> {
  const posts = await getFeaturedBlogPosts(4, locale);

  if (posts.length === 0) return fallback(BLOG_PREVIEWS, locale);

  return posts.map((post) => {
    const translation = post.translations[0];
    return {
      title: translation?.title ?? post.slug,
      excerpt: translation?.excerpt ?? "",
      href: `/blog/${slugOf(post, locale)}`,
      image: post.coverImage,
    };
  });
}
