declare global {
  interface Window {
    dataLayer?: Record<string, unknown>[];
  }
}

function pushDataLayerEvent(event: string) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event });
}

/**
 * İletişim ve Teklif Al formları ayrı dataLayer olayları gönderir, GTM'de her biri için bağımsız bir
 * Custom Event tetikleyicisi kurulup istenen etiketler (GA4, Google Ads dönüşümü vb.) ayrı ayrı bağlanabilsin.
 */
export function reportContactFormSubmitted() {
  pushDataLayerEvent("iletisim_form_gonderildi");
}

export function reportQuoteFormSubmitted() {
  pushDataLayerEvent("teklif_form_gonderildi");
}
