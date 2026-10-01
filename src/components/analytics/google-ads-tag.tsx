import Script from "next/script";
import { GOOGLE_ADS_ID } from "@/lib/analytics/google-ads";

/** Google Ads taban etiketi (gtag.js). Hesap ID'si env'den gelmeyen ortamlarda (ör. yerel geliştirme) hiçbir şey yüklemez. */
export function GoogleAdsTag() {
  if (!GOOGLE_ADS_ID) return null;

  return (
    <>
      <Script src={`https://www.googletagmanager.com/gtag/js?id=${GOOGLE_ADS_ID}`} strategy="afterInteractive" />
      <Script id="google-ads-gtag-init" strategy="afterInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GOOGLE_ADS_ID}');
        `}
      </Script>
    </>
  );
}
