export const COMPANY = {
  name: "Mezbaha Teknolojileri",
  positioning: "Mezbaha ve et işleme sistemleri tasarımı ve imalatı",
  aboutParagraph:
    "Proje uzmanlarımız müşteriye özel mezbaha ve et işleme sistemleri tasarımı, imalatı ve geliştirilmesi konusunda çalışır. Büyük ve küçük ölçekli et işleme tesislerinin ulusal, bölgesel ve yerel gereksinimlerini karşılamak için makine ve ekipman sağlıyor, otomasyon düzeyinde anahtar teslim çözümler sunuyoruz.",
} as const;

export const CONTACT = {
  address: {
    line1: "S.S İstanbul Mermerciler Sanayi Sitesi, 22. Sokak No: 15",
    line2: "Köseler Mahallesi, Dilovası / Kocaeli",
    locality: "Dilovası / Kocaeli",
    country: "TR",
  },
  phones: [
    { label: "Genel", value: "+90 262 502 18 94" },
    { label: "Proje Satış", value: "+90 541 785 17 25" },
    { label: "Proje", value: "+90 530 242 86 84" },
    { label: "Muhasebe", value: "+90 539 552 81 66" },
    { label: "WhatsApp", value: "+90 505 500 24 96" },
  ],
  emails: [
    { label: "Genel", value: "bilgi@mezbahateknolojileri.com" },
    { label: "Muhasebe", value: "muhasebe@mezbahateknolojileri.com" },
  ],
} as const;

export const PRIMARY_NAV = [
  { label: "Ürünler", href: "/urunler" },
  { label: "Projeler", href: "/projeler" },
  { label: "Kataloglar", href: "/kataloglar" },
  { label: "Kurumsal", href: "/hakkimizda" },
  { label: "Blog", href: "/blog" },
  { label: "İletişim", href: "/iletisim" },
] as const;

/** Sosyal medya hesapları — eski sitenin (mezbahateknolojileri.com/tr) üst/alt bilgisindeki gerçek adresler. */
export const SOCIAL = [
  { key: "facebook", label: "Facebook", href: "https://www.facebook.com/mezbahaekipmanlar/" },
  { key: "x", label: "X (Twitter)", href: "https://x.com/mezbahatekno" },
  { key: "instagram", label: "Instagram", href: "https://www.instagram.com/mezbahateknolojileri/" },
  { key: "linkedin", label: "LinkedIn", href: "https://www.linkedin.com/company/mezbaha-teknolojileri" },
  { key: "youtube", label: "YouTube", href: "https://www.youtube.com/channel/UC4JvqrcuX-h3wkqsvcSgqBQ" },
] as const;
