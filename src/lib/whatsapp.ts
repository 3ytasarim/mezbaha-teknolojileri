/**
 * WhatsApp bağlantı yardımcıları. Numara artık sabit değildir: Site Ayarları'ndaki "WhatsApp" satırından gelir
 * (bkz. site-settings.ts → whatsappOf); bu dosya yalnızca saf biçimlendirme yapar.
 */

/** wa.me bağlantısı; ürün sayfalarında mesaj ürünün kanonik URL'sini içerir (eski sitedeki davranışla aynı). */
export function whatsappUrl(message: string, digits: string): string {
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

export function productWhatsappMessage(productUrl: string, template = "Merhaba, bu ürün hakkında bilgi almak istiyorum:\n{url}"): string {
  return template.replace("{url}", productUrl);
}
