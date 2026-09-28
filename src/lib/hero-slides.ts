import "server-only";
import { HERO } from "@/content/home";
import { CANONICAL_LOCALE, isPageAvailable, type Locale } from "@/lib/i18n/config";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { prisma } from "@/lib/db";
import { getDisplayFeaturedProducts } from "@/lib/content-fallback";
import type { HeroSlide } from "@/components/home/hero-slider";

/**
 * Kaynaktaki bazı ürün adları BÜYÜK HARFLE kayıtlı (ör. "PROFESYONEL MEZBAHA SİSTEMLERİ"). Hero'da tüm başlıklar
 * aynı biçimde görünsün diye YALNIZCA GÖRÜNTÜDE Türkçe başlık biçimine çevrilir; veritabanı değişmez.
 */
function normalizeTitleCase(text: string): string {
  const isAllCaps = text === text.toLocaleUpperCase("tr") && text !== text.toLocaleLowerCase("tr");
  if (!isAllCaps) return text;
  return text
    .toLocaleLowerCase("tr")
    .split(" ")
    .map((w) => (w ? w[0].toLocaleUpperCase("tr") + w.slice(1) : w))
    .join(" ");
}

/**
 * Varsayılan slaytlar (yönetim panelinde hiç slayt yokken gösterilir; "Varsayılanları içe aktar" ile düzenlenebilir hale gelir):
 *  1) giriş içeriği (başlık + açıklama + tesis fotoğrafı),
 *  2..4) öne çıkan ürünler — ad, kısa açıklama ve ürünün kendi görseli GERÇEK verilerdir.
 */
export async function buildDefaultSlides(locale: Locale = CANONICAL_LOCALE): Promise<HeroSlide[]> {
  const products = await getDisplayFeaturedProducts(locale);
  const d = getDictionary(locale).home.hero;

  return [
    {
      id: "intro",
      title: d.headline,
      subtitle: d.body,
      // Ürün sayfaları bu dilde yoksa (ör. yalnızca ana sayfa olan diller) düğme teklif sayfasına gider.
      buttonText: isPageAvailable(locale, "/urunler") ? d.cta : getDictionary(locale).common.getQuote,
      buttonLink: isPageAvailable(locale, "/urunler") ? "/urunler" : "/teklif-al",
      image: HERO.image,
      imageAlt: d.imageAlt,
      fit: "cover",
    },
    ...products
      .filter((p) => p.image)
      .slice(0, 3)
      .map<HeroSlide>((p) => ({
        id: p.href,
        title: normalizeTitleCase(p.name),
        // Başlığı tekrarlayan çok kısa açıklamalar (ör. "Mezbaha Sistemleri") alt başlık olarak gösterilmez.
        subtitle: p.shortDescription.length >= 30 ? p.shortDescription : undefined,
        buttonText: d.inspect,
        buttonLink: p.href,
        image: p.image,
        imageAlt: p.imageAlt || p.name,
        fit: "contain",
      })),
  ];
}

/** Ana sayfa hero'su: veritabanındaki AKTİF slaytlar (sıraya göre); hiç yoksa varsayılan slaytlar. */
export async function getHeroSlides(locale: Locale = CANONICAL_LOCALE): Promise<HeroSlide[]> {
  // Yönetimdeki slaytlar Türkçedir; diğer dillerde giriş içeriği + o dilin öne çıkan ürünlerinden varsayılan slaytlar üretilir.
  if (locale !== CANONICAL_LOCALE) return buildDefaultSlides(locale);

  const rows = await prisma.heroSlide.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
  });

  if (rows.length === 0) return buildDefaultSlides();

  return rows.map<HeroSlide>((row) => ({
    id: row.id,
    title: row.title,
    subtitle: row.subtitle || undefined,
    buttonText: row.buttonText,
    buttonLink: row.buttonLink,
    image: row.image,
    imageAlt: row.imageAlt || row.title,
    fit: row.fit === "contain" ? "contain" : "cover",
  }));
}
