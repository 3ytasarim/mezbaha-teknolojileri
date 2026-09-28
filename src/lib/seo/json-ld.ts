import { getSiteUrl, SITE_NAME } from "./site";
import { DEFAULT_LOCALE, ENABLED_LOCALES, type Locale } from "@/lib/i18n/config";
import { localizePath } from "@/lib/i18n/routes";

/** Organization/WebSite her sayfada TEK yerden (public layout) render edilir; diğer sayfa-seviyesi
 *  entity'ler (WebPage, BreadcrumbList, Product, ...) bu sabit @id'lere referans vererek bağlanır —
 *  aynı Organization/WebSite iki farklı @id ile asla yeniden oluşturulmaz. */
export function organizationId(siteUrl: string = getSiteUrl()): string {
  return `${siteUrl}/#organization`;
}

export function websiteId(siteUrl: string = getSiteUrl()): string {
  return `${siteUrl}/#website`;
}

export function organizationJsonLd(input: {
  logo?: { url: string; width: number; height: number };
  contactPhone?: string;
  contactEmail?: string;
  address?: {
    streetAddress: string;
    addressLocality: string;
    addressCountry: string;
  };
  /** Gerçekten var olan sosyal medya hesapları (src/content/site.ts → SOCIAL); uydurma URL asla verilmez. */
  sameAs?: string[];
}) {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": organizationId(siteUrl),
    name: SITE_NAME,
    url: siteUrl,
    ...(input.logo
      ? {
          logo: {
            "@type": "ImageObject",
            "@id": `${siteUrl}/#organization-logo`,
            url: new URL(input.logo.url, siteUrl).toString(),
            contentUrl: new URL(input.logo.url, siteUrl).toString(),
            width: input.logo.width,
            height: input.logo.height,
          },
        }
      : {}),
    ...(input.contactPhone || input.contactEmail
      ? {
          contactPoint: {
            "@type": "ContactPoint",
            ...(input.contactPhone ? { telephone: input.contactPhone } : {}),
            ...(input.contactEmail ? { email: input.contactEmail } : {}),
            contactType: "sales",
          },
        }
      : {}),
    ...(input.address
      ? {
          address: {
            "@type": "PostalAddress",
            ...input.address,
          },
        }
      : {}),
    ...(input.sameAs?.length ? { sameAs: input.sameAs } : {}),
  };
}

export function websiteJsonLd(locale: Locale = DEFAULT_LOCALE) {
  const siteUrl = getSiteUrl();
  const home = localizePath(locale, "/");
  // Gerçek, çalışan sunucu-taraflı arama: /urunler?q=... (Mecanova audit §8, canlı doğrulandı).
  const searchPath = localizePath(locale, "/urunler");

  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": websiteId(siteUrl),
    name: SITE_NAME,
    url: home === "/" ? siteUrl : `${siteUrl}${home}`,
    inLanguage: locale,
    publisher: { "@id": organizationId(siteUrl) },
    ...(ENABLED_LOCALES.length > 1 ? { availableLanguage: [...ENABLED_LOCALES] } : {}),
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${siteUrl}${searchPath}?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbId(path: string): string {
  const siteUrl = getSiteUrl();
  return `${new URL(path, siteUrl).toString()}#breadcrumb`;
}

export function breadcrumbListJsonLd(items: { name: string; path: string }[]) {
  const siteUrl = getSiteUrl();
  const lastPath = items[items.length - 1]?.path ?? "/";

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": breadcrumbId(lastPath),
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.path, siteUrl).toString(),
    })),
  };
}

export function productId(path: string): string {
  const siteUrl = getSiteUrl();
  return `${new URL(path, siteUrl).toString()}#product`;
}

export function productJsonLd(input: {
  name: string;
  description: string;
  path: string;
  images: string[];
  categoryName?: string;
  sku?: string;
  /** Gerçekten bu ürünlerin üreticisi/markası olduğumuz için Organization'a referans (uydurma brand değil). */
  brandRef?: boolean;
  locale?: Locale;
}) {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": productId(input.path),
    name: input.name,
    description: input.description,
    url: new URL(input.path, siteUrl).toString(),
    inLanguage: input.locale ?? DEFAULT_LOCALE,
    image: input.images.map((img) => new URL(img, siteUrl).toString()),
    ...(input.sku ? { sku: input.sku } : {}),
    ...(input.categoryName ? { category: input.categoryName } : {}),
    ...(input.brandRef ? { brand: { "@id": organizationId(siteUrl) } } : {}),
  };
}

export function blogPostingJsonLd(input: {
  title: string;
  description: string;
  path: string;
  image?: string;
  authorName: string;
  publishedAt: Date | null;
  updatedAt: Date;
  keywords?: string[];
  locale?: Locale;
}) {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: input.title,
    description: input.description,
    url: new URL(input.path, siteUrl).toString(),
    ...(input.image ? { image: new URL(input.image, siteUrl).toString() } : {}),
    mainEntityOfPage: { "@type": "WebPage", "@id": new URL(input.path, siteUrl).toString() },
    inLanguage: input.locale ?? DEFAULT_LOCALE,
    author: { "@type": "Organization", name: input.authorName },
    publisher: {
      "@type": "Organization",
      name: SITE_NAME,
      logo: { "@type": "ImageObject", url: new URL("/icon.png", siteUrl).toString(), width: 512, height: 512 },
    },
    // Gerçek yayın tarihi bilinmiyorsa (kaynak sitede yıl gösterilmiyorsa) datePublished
    // tamamen atlanır — migration/import zamanını sahte "yayın tarihi" gibi göstermemek için.
    ...(input.publishedAt ? { datePublished: input.publishedAt.toISOString() } : {}),
    dateModified: input.updatedAt.toISOString(),
    ...(input.keywords?.length ? { keywords: input.keywords.join(", ") } : {}),
  };
}

/** Blog listeleme sayfası (Blog + yazı bağlantıları). */
export function blogJsonLd(input: { name: string; description: string; path: string; posts: { title: string; path: string }[]; locale?: Locale }) {
  const siteUrl = getSiteUrl();
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: input.name,
    description: input.description,
    url: new URL(input.path, siteUrl).toString(),
    inLanguage: input.locale ?? DEFAULT_LOCALE,
    publisher: { "@id": organizationId(siteUrl) },
    blogPost: input.posts.map((p) => ({ "@type": "BlogPosting", headline: p.title, url: new URL(p.path, siteUrl).toString() })),
  };
}

export function serviceJsonLd(input: { name: string; description: string; path: string; locale?: Locale }) {
  const siteUrl = getSiteUrl();

  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    url: new URL(input.path, siteUrl).toString(),
    inLanguage: input.locale ?? DEFAULT_LOCALE,
    provider: { "@id": organizationId(siteUrl) },
  };
}

/**
 * Sayfaya özel WebPage (+ gerçek primary image varsa gömülü ImageObject) grafiği. Organization/WebSite'a
 * (global, public layout'ta render edilir) ve varsa aynı sayfadaki BreadcrumbList/Product/Service @id'lerine
 * referans verir — hiçbiri burada yeniden TANIMLANMAZ, sadece {"@id": ...} ile bağlanır (Mecanova audit §9).
 */
export function webPageGraphJsonLd(input: {
  path: string;
  name: string;
  description?: string;
  locale?: Locale;
  breadcrumbId?: string;
  mainEntityId?: string;
  /** Sayfanın gerçek birincil görseli (ürün kapak, blog kapak, kategori görseli, hero...). Yoksa hiç üretilmez. */
  primaryImage?: { url: string; name?: string; dimensions?: { width: number; height: number } };
}) {
  const siteUrl = getSiteUrl();
  const url = new URL(input.path, siteUrl).toString();
  const pageId = `${url}#webpage`;
  const imageId = `${url}#primaryimage`;
  const locale = input.locale ?? DEFAULT_LOCALE;

  const graph: Record<string, unknown>[] = [];

  if (input.primaryImage) {
    const absoluteUrl = new URL(input.primaryImage.url, siteUrl).toString();
    const dimensions = input.primaryImage.dimensions;
    graph.push({
      "@type": "ImageObject",
      "@id": imageId,
      url: absoluteUrl,
      contentUrl: absoluteUrl,
      ...(input.primaryImage.name ? { name: input.primaryImage.name } : {}),
      // Yalnızca width/height alınır — kaynak nesnede (LocalImageMeta) ekstra alan (ör. mime `type`) olsa bile
      // ImageObject'e schema.org'da karşılığı olmayan bir alan sızmaz.
      ...(dimensions ? { width: dimensions.width, height: dimensions.height } : {}),
      inLanguage: locale,
    });
  }

  graph.push({
    "@type": "WebPage",
    "@id": pageId,
    url,
    name: input.name,
    ...(input.description ? { description: input.description } : {}),
    isPartOf: { "@id": websiteId(siteUrl) },
    about: { "@id": organizationId(siteUrl) },
    inLanguage: locale,
    ...(input.primaryImage ? { primaryImageOfPage: { "@id": imageId }, image: { "@id": imageId } } : {}),
    ...(input.breadcrumbId ? { breadcrumb: { "@id": input.breadcrumbId } } : {}),
    ...(input.mainEntityId ? { mainEntity: { "@id": input.mainEntityId } } : {}),
  });

  return { "@context": "https://schema.org", "@graph": graph };
}

export function jsonLdScriptProps(data: unknown) {
  return {
    type: "application/ld+json" as const,
    dangerouslySetInnerHTML: { __html: JSON.stringify(data) },
  };
}
