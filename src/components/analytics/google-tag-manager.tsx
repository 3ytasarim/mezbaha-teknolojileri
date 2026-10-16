import Script from "next/script";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;

/** GTM'in <head> script bloğu. Hesap ID'si env'den gelmeyen ortamlarda (ör. yerel geliştirme) hiçbir şey yüklemez. */
export function GoogleTagManager() {
  if (!GTM_ID) return null;

  return (
    <Script id="google-tag-manager" strategy="afterInteractive">
      {`
        (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
        new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
        j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
        'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
        })(window,document,'script','dataLayer','${GTM_ID}');
      `}
    </Script>
  );
}

/** GTM'in <body> açılışının hemen ardına konması gereken noscript yedeği (JS kapalıyken de dataLayer olayı kaydedilsin diye). */
export function GoogleTagManagerNoscript() {
  if (!GTM_ID) return null;

  return (
    <noscript>
      <iframe
        src={`https://www.googletagmanager.com/ns.html?id=${GTM_ID}`}
        height="0"
        width="0"
        style={{ display: "none", visibility: "hidden" }}
        title="Google Tag Manager"
      />
    </noscript>
  );
}
