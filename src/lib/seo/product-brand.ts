/**
 * Product JSON-LD `brand` yalnızca ürün bazında doğrulanmış (üretici/marka) ürünler için yayımlanır.
 * Liste şimdilik BOŞTUR: hiçbir ürün sayfası `brand` yayımlamaz. Doğrulama gelince ürünün kayıt slug'ı
 * (`Product.slug`) buraya eklenir.
 */
export const VERIFIED_OWN_BRAND_PRODUCT_SLUGS: ReadonlySet<string> = new Set<string>();

export const isVerifiedOwnBrand = (productSlug: string): boolean => VERIFIED_OWN_BRAND_PRODUCT_SLUGS.has(productSlug);
