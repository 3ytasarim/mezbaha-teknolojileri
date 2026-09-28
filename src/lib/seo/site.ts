const DEV_FALLBACK_ORIGIN = "http://localhost:3000";

const LOCAL_HOST = /^(localhost|127\.\d+\.\d+\.\d+|0\.0\.0\.0|\[::1\])$/i;

/**
 * Sitenin kanonik origin'i (canonical, sitemap, robots, OG/Twitter, JSON-LD, llms.txt ve tüm
 * uygulama-üretimi mutlak URL'lerin TEK kaynağı). Üretimde: https://www.mezbahateknolojileri.com
 *
 * - Sondaki "/" veya yol atılır (yalnızca origin döner) → `${siteUrl}/x` asla "//x" olmaz.
 * - Production'da değişken YOKSA, http:// ise ya da localhost'a işaret ediyorsa HATA fırlatılır:
 *   yanlış origin ile sessizce yayına çıkmaktansa build/istek başarısız olsun.
 * - Development'ta boşsa http://localhost:3000 kullanılır.
 *
 * NOT: NEXT_PUBLIC_SITE_URL statik sayfalara build sırasında gömülür; değişirse yeniden build gerekir.
 */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const isProduction = process.env.NODE_ENV === "production";

  if (!raw) {
    if (isProduction) {
      throw new Error("NEXT_PUBLIC_SITE_URL tanımlı değil (production'da zorunlu, ör. https://www.mezbahateknolojileri.com).");
    }
    return DEV_FALLBACK_ORIGIN;
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("NEXT_PUBLIC_SITE_URL geçerli bir URL değil.");
  }

  if (isProduction && (url.protocol !== "https:" || LOCAL_HOST.test(url.hostname))) {
    throw new Error("Production'da NEXT_PUBLIC_SITE_URL https:// ile başlamalı ve localhost olmamalı.");
  }

  return url.origin;
}

export const SITE_NAME = "Mezbaha Teknolojileri";
