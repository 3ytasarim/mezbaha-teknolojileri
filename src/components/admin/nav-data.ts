export type AdminNavItem = {
  label: string;
  href: string;
};

export type AdminNavGroup = {
  label: string;
  items: AdminNavItem[];
};

export const ADMIN_NAV: AdminNavGroup[] = [
  {
    label: "",
    items: [{ label: "Dashboard", href: "/admin" }],
  },
  {
    label: "İçerik",
    items: [
      { label: "Slider Yönetimi", href: "/admin/slider" },
      { label: "Ürünler", href: "/admin/urunler" },
      { label: "Ürün Kategorileri", href: "/admin/urun-kategorileri" },
      { label: "Projeler", href: "/admin/projeler" },
      { label: "Blog", href: "/admin/blog" },
      { label: "Blog Kategorileri", href: "/admin/blog-kategorileri" },
      { label: "Hizmet Sayfaları", href: "/admin/sayfalar" },
      { label: "Çeviriler", href: "/admin/ceviriler" },
    ],
  },
  {
    label: "Medya",
    items: [{ label: "Medya Kütüphanesi", href: "/admin/medya" }],
  },
  {
    label: "Talepler",
    items: [
      { label: "Teklif Talepleri", href: "/admin/talepler/teklif" },
      { label: "İletişim Mesajları", href: "/admin/talepler/iletisim" },
    ],
  },
  {
    label: "SEO",
    items: [
      { label: "SEO Yönetimi", href: "/admin/seo" },
      { label: "Redirectler", href: "/admin/seo/redirectler" },
    ],
  },
  {
    label: "Sistem",
    items: [
      { label: "Menü Yönetimi", href: "/admin/menu" },
      { label: "Site Ayarları", href: "/admin/ayarlar" },
      { label: "Kullanıcılar", href: "/admin/kullanicilar" },
    ],
  },
];
