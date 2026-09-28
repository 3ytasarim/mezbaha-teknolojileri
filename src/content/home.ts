export const HERO = {
  eyebrow: "Mezbaha Teknolojileri",
  headline: "Mezbaha ve Et İşleme Sistemlerinde Anahtar Teslim Mühendislik",
  body: "Kesim hücrelerinden soğuk oda sistemlerine, tesis tasarımından devreye almaya — büyükbaş ve küçükbaş üretim hatları için uçtan uca mühendislik ve imalat.",
  primaryCta: { label: "Ürünleri Keşfet", href: "/#urunler" },
  secondaryCta: { label: "Projeleri İncele", href: "/#projeler" },
  image: "/images/hero/mezbaha-tesisi-hero.png",
  imageAlt: "Mezbaha Teknolojileri paslanmaz çelik kesim hattı ve mezbaha tesisi genel görünümü",
} as const;

export type ProductCategory = {
  slug: string;
  name: string;
  shortDescription: string;
  href: string;
  image: string;
  imageAlt: string;
};

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  {
    slug: "buyukbas",
    name: "Büyükbaş Mezbaha Makinaları",
    shortDescription:
      "Kesim hücreleri, karkas taşıma ve deri yüzme hatlarından oluşan büyükbaş üretim hattı ekipmanları.",
    href: "/urunler",
    image: "/images/categories/buyukbas-mezbaha-makinalari.png",
    imageAlt: "Büyükbaş mezbaha makinaları kategori görseli",
  },
  {
    slug: "kucukbas",
    name: "Küçükbaş Mezbaha Makinaları",
    shortDescription:
      "Koyun işleme konveyörü, kanama elevatörü ve taşıma arabalarıyla küçükbaş işleme hattı ekipmanları.",
    href: "/urunler",
    image: "/images/categories/kucukbas-mezbaha-makinalari.png",
    imageAlt: "Küçükbaş mezbaha makinaları kategori görseli",
  },
  {
    slug: "kurban-kesim",
    name: "Kurban Kesim Makinaları",
    shortDescription:
      "Kurban kesim yerleri için otomatik kesim kabinleri ve komple kesim-parçalama hatları.",
    href: "/urunler",
    image: "/images/categories/kurban-kesim-makinalari.png",
    imageAlt: "Kurban kesim makinaları ve sistemleri kategori görseli",
  },
  {
    slug: "mezbaha-sistemleri",
    name: "Mezbaha Sistemleri",
    shortDescription:
      "Profesyonel ve standart mezbaha sistemleri, soğuk oda ikizray hatları ve Kosher Line çözümleri.",
    href: "/urunler",
    image: "/images/categories/mezbaha-sistemleri.png",
    imageAlt: "Mezbaha sistemleri kategori görseli",
  },
];

export type FeaturedProduct = {
  name: string;
  categoryName: string;
  shortDescription: string;
  href: string;
  image: string;
  imageAlt: string;
};

export const FEATURED_PRODUCTS: FeaturedProduct[] = [
  {
    name: "Kosher Line",
    categoryName: "Mezbaha Sistemleri",
    shortDescription:
      "100 karkas/saat kapasiteli, 3 tuzlama havuzu ve 1 durulama havuzundan oluşan koşer et hattı.",
    href: "/urunler",
    image: "/images/products/kosher-line.jpg",
    imageAlt: "Kosher Line koşer et tuzlama hattı, tuzlama ve durulama havuzları",
  },
  {
    name: "Dairesel Kesim Hücresi",
    categoryName: "Büyükbaş Mezbaha Makinaları",
    shortDescription:
      "Büyükbaş kesim işlemi için dönel platformlu dairesel kesim hücresi.",
    href: "/urunler",
    image: "/images/products/dairesel-kesim-hucresi.png",
    imageAlt: "Dairesel kesim hücresi, büyükbaş kesim işlemi için dönel platform",
  },
  {
    name: "Hidrolik Deri Yüzme Makinası",
    categoryName: "Büyükbaş Mezbaha Makinaları",
    shortDescription:
      "Çift yönlü işlem ve bağımsız platform kontrolüne sahip paslanmaz çelik deri yüzme makinası.",
    href: "/urunler",
    image: "/images/products/hidrolik-deri-yuzme-makinasi.png",
    imageAlt: "Hidrolik deri yüzme makinası ön görünüm, paslanmaz çelik gövde",
  },
  {
    name: "Karkas Bölme Testeresi",
    categoryName: "Büyükbaş Mezbaha Makinaları",
    shortDescription: "Slim Line karkas bölme testeresi ile hızlı ve hijyenik karkas ayırma.",
    href: "/urunler",
    image: "/images/products/karkas-bolme-testeresi.png",
    imageAlt: "Karkas bölme testeresi (Slim Line) üretim hattında kullanım görünümü",
  },
  {
    name: "Ayak Kesme Makası",
    categoryName: "Büyükbaş Mezbaha Makinaları",
    shortDescription: "Manuel kesim hatalarını azaltan hidrolik ayak kesme makası.",
    href: "/urunler",
    image: "/images/products/ayak-kesme-makasi.png",
    imageAlt: "Hidrolik ayak ve boynuz kesme makası, paslanmaz çelik ekipman",
  },
];

export type CapacityPackage = {
  code: string;
  area: string;
  capacity: string;
  detail: string;
};

export const CAPACITY_PACKAGES: CapacityPackage[] = [
  { code: "C-50", area: "~350 m²", capacity: "50 büyükbaş + 100 koyun", detail: "Kompakt ölçekli kesimhane tesisi." },
  { code: "C-50 Plus", area: "400 m²", capacity: "70 büyükbaş + 200 küçükbaş", detail: "Genişletilmiş kapasiteli kompakt tesis." },
  { code: "C-100", area: "550 m²", capacity: "100 büyükbaş + 300 küçükbaş", detail: "2 soğuk odalı orta ölçekli tesis." },
  { code: "C-100 Plus", area: "680 m²", capacity: "100 büyükbaş + 300 küçükbaş", detail: "Et parçalama odası dahil orta ölçekli tesis." },
  { code: "C-100 XL", area: "980 m²", capacity: "150 büyükbaş + 500 küçükbaş", detail: "Genişletilmiş orta-büyük ölçekli tesis." },
  { code: "C-200", area: "1.200 m²", capacity: "200 büyükbaş + 700 küçükbaş", detail: "Büyük ölçekli entegre tesis." },
  { code: "C-300", area: "2.700 m²", capacity: "300 büyükbaş + 2.000 küçükbaş", detail: "4 soğuk odalı endüstriyel ölçekli tesis." },
];

export type GlobalProject = {
  country: string;
  city: string;
  type: string;
  capacity: string;
};

export const GLOBAL_PROJECTS: GlobalProject[] = [
  { country: "Hollanda", city: "Harderwijk", type: "Kesimhane", capacity: "180 koyun/saat" },
  { country: "Azerbaycan", city: "Gobustan", type: "Kesimhane", capacity: "150 büyükbaş, 1.500 koyun" },
  { country: "Katar", city: "Al Khoor", type: "Kesimhane", capacity: "100 büyükbaş/vardiya" },
  { country: "Fas", city: "Kenitra", type: "Modern Kesimhane", capacity: "500 büyükbaş, 3.000 koyun" },
  { country: "Kırgızistan", city: "Karakol", type: "Kesimhane", capacity: "200 büyükbaş, 1.500 koyun" },
  { country: "Gürcistan", city: "Khashuri", type: "Kesimhane", capacity: "25 büyükbaş, 25 domuz" },
  { country: "Türkmenistan", city: "Aşkabat", type: "Kesimhane", capacity: "100 büyükbaş, 300 koyun" },
  { country: "Arjantin", city: "Buenos Aires", type: "Deri Yüzme Tesisi", capacity: "100 büyükbaş/saat" },
  { country: "Türkiye", city: "Çorum", type: "Kesimhane", capacity: "700 büyükbaş, 3.000 koyun" },
  { country: "Bosna Hersek", city: "Prijedor", type: "Döner Sığır Kutusu", capacity: "60 büyükbaş/saat" },
  { country: "Arnavutluk", city: "Pogradec", type: "Mikro Kesimhane", capacity: "50 büyükbaş" },
  { country: "Tacikistan", city: "Duşanbe", type: "Et Fabrikası", capacity: "2.000 kg/saat" },
];

export type FeaturedProject = {
  country: string;
  city: string;
  type: string;
  capacity: string;
};

// Not: proje galerisindeki fotoğraflar (bkz. PROJECT_GALLERY_IMAGES) hangi ülkeye ait
// olduğu doğrulanamayan genel galeri görselleridir — belirli bir ülke/projeyle
// eşleştirilmemiştir (bkz. docs/image-inventory.md). Bu yüzden bu liste yalnızca
// doğrulanmış metin verisini taşır, görsel eşlemesi yapılmaz.
export const FEATURED_PROJECTS: FeaturedProject[] = [
  { country: "Fas", city: "Kenitra", type: "Modern Kesimhane", capacity: "500 büyükbaş, 3.000 koyun" },
  { country: "Türkiye", city: "Çorum", type: "Kesimhane", capacity: "700 büyükbaş, 3.000 koyun" },
  { country: "Azerbaycan", city: "Gobustan", type: "Kesimhane", capacity: "150 büyükbaş, 1.500 koyun" },
  { country: "Katar", city: "Al Khoor", type: "Kesimhane", capacity: "100 büyükbaş/vardiya" },
];

export type ProjectGalleryImage = {
  image: string;
  imageAlt: string;
};

// Mevcut sitenin /tr/proje-resimleri/ galerisinden alınan, belirli bir ülkeye
// atfedilmeyen genel proje görselleri (bkz. docs/image-inventory.md).
export const PROJECT_GALLERY_IMAGES: ProjectGalleryImage[] = [
  {
    image: "/images/projects/mezbaha-proje-ornegi.jpg",
    imageAlt: "Tamamlanmış mezbaha projesi örneği",
  },
  {
    image: "/images/projects/mezbaha-ekipman-fotografi.jpg",
    imageAlt: "Mezbaha sistemleri ekipman kurulum fotoğrafı",
  },
  {
    image: "/images/projects/kucuk-olcekli-mezbaha-projesi.jpg",
    imageAlt: "Küçük ölçekli mezbaha projesi — yaklaşık 30 büyükbaş ve 50 koyun kapasiteli tesis",
  },
  {
    image: "/images/projects/mezbaha-proje-3d-tasarim.jpg",
    imageAlt: "Mezbaha sistemleri 3D proje tasarım görseli",
  },
];

export type Capability = {
  title: string;
  description: string;
};

export const CAPABILITIES: Capability[] = [
  { title: "Tesis Mühendisliği ve Tasarımı", description: "Kapasiteye özel mezbaha bina ve hat tasarımı." },
  { title: "Ekipman İmalatı", description: "Paslanmaz çelik kesim, taşıma ve hijyen ekipmanları imalatı." },
  { title: "Anahtar Teslim Kurulum", description: "Tesisin projelendirilmesinden devreye alınmasına kadar uçtan uca kurulum." },
  { title: "Otomasyon Entegrasyonu", description: "Otomatik kesim kabinleri ve hat otomasyonu entegrasyonu." },
  { title: "Satış Sonrası Destek", description: "Proje, muhasebe ve servis için ayrı iletişim hatları üzerinden destek." },
];

export type BlogPreview = {
  title: string;
  excerpt: string;
  href: string;
};

export const BLOG_PREVIEWS: BlogPreview[] = [
  {
    title: "Raylı Taşıma Sistemleri (İkizray) Nedir ve Neden Kullanılır?",
    excerpt:
      "Karkas taşıma hatlarında ikizray sistemlerinin işleyişi ve mezbaha verimliliğine katkısı.",
    href: "/blog/rayli-tasima-sistemleri-ikizray-nedir-ve-neden-kullanilir",
  },
  {
    title: "Mezbaha Kurulum Maliyeti",
    excerpt: "Mezbaha kurulumunda maliyeti etkileyen kapasite, ekipman ve tesis faktörleri.",
    href: "/blog/mezbaha-kurulum-maliyeti",
  },
  {
    title: "Mezbaha Hijyeni Nasıl Sağlanır?",
    excerpt: "Kesim hatlarında hijyen standartlarını korumak için uygulanan yöntemler.",
    href: "/blog/mezbaha-hijyeni-nasil-saglanir",
  },
];
