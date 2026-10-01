export const GOOGLE_ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID;

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

/** Teklif/iletişim formu başarıyla gönderildiğinde Google Ads "Sayfa görüntüleme" dönüşümünü bildirir. */
export function reportLeadFormConversion() {
  if (typeof window === "undefined" || !window.gtag) return;
  window.gtag("event", "conversion", { send_to: "AW-946234179/fVOMCMGQlJUZEMPGmcMD" });
}
