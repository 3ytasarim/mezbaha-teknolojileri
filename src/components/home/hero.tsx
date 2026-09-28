import { getLocale } from "@/lib/i18n/server";
import { getHeroSlides } from "@/lib/hero-slides";
import { HeroSlider } from "./hero-slider";

/**
 * Hero slaytları (Norm-Yacht'taki gibi çok slaytlı). Slaytlar Admin > İçerik > Slider'dan yönetilir;
 * hiç aktif slayt yoksa varsayılan slaytlar (giriş içeriği + öne çıkan ürünler) gösterilir (bkz. lib/hero-slides.ts).
 */
export async function Hero() {
  const locale = await getLocale();
  const slides = await getHeroSlides(locale);
  return <HeroSlider slides={slides} />;
}
