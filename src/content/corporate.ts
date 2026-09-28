/**
 * "Kurumsal" özellik kartları — eski sitenin Kurumsal sayfasındaki gerçek cümleler (yazım/noktalama düzeltmeleri hariç).
 * İki kart başlığı sayfadaki başlıkların aynısıdır ("Müşteri Memnuniyeti için etkili çözümler", "Türkiye çapında liderlik").
 * `icon` anahtarı Hakkımızda sayfasında lucide ikonuna eşlenir.
 */
export type CorporateFeature = {
  icon: "ruler" | "users" | "cog" | "shield" | "key" | "trophy";
  title: string;
  description: string;
};

export const CORPORATE_FEATURES: CorporateFeature[] = [
  {
    icon: "ruler",
    title: "Müşteriye özel tasarım ve imalat",
    description:
      "Proje uzmanlarımız müşteriye özel mezbaha ve et işleme sistemleri tasarımı, imalatı ve geliştirilmesi konusunda çalışır.",
  },
  {
    icon: "users",
    title: "Uzman ekip",
    description:
      "Türkiye çapında uzman ekibimiz tarafından kurulmuş ve hizmete alınmış tesisler müşteri memnuniyetini göstermektedir.",
  },
  {
    icon: "cog",
    title: "Müşteri Memnuniyeti için etkili çözümler",
    description:
      "Mezbaha Teknolojileri en modern kesim ve et işleme sistemlerini, sığır ve koyun için soğuk oda sistemlerini otomasyon teknolojisiyle birleştirerek sunmaktadır.",
  },
  {
    icon: "shield",
    title: "Yüksek standartlar",
    description:
      "Yüksek standartları karşılayan firmamız hayvan refahı, kalite, güvenlik, hijyen ve ergonomi için son derece önem vermektedir.",
  },
  {
    icon: "trophy",
    title: "Türkiye çapında liderlik",
    description: "Mezbaha Teknolojileri mezbaha otomasyon sistemleri konusunda liderdir.",
  },
];
