/**
 * Satış ağı — eski sitenin /tr/satis-agi/ sayfasındaki 11 ülke ve bayrakları (bayraklar yerel kopya;
 * provenance: docs/sales-network-provenance.json). Pin konumu, her ülkenin başkentinin gerçek koordinatıdır.
 */
export type SalesCountry = {
  name: string;
  flag: string;
  capital: string;
  lat: number;
  lng: number;
};

const flag = (slug: string) => `/images/sales-network/flags/${slug}.jpg`;

export const SALES_COUNTRIES: SalesCountry[] = [
  { name: "Almanya", flag: flag("almanya"), capital: "Berlin", lat: 52.52, lng: 13.405 },
  { name: "Belçika", flag: flag("belcika"), capital: "Brüksel", lat: 50.8503, lng: 4.3517 },
  { name: "Rusya", flag: flag("rusya"), capital: "Moskova", lat: 55.7558, lng: 37.6173 },
  { name: "Türkmenistan", flag: flag("turkmenistan"), capital: "Aşkabat", lat: 37.9601, lng: 58.3261 },
  { name: "Kazakistan", flag: flag("kazakistan"), capital: "Astana", lat: 51.1694, lng: 71.4491 },
  { name: "Arabistan", flag: flag("arabistan"), capital: "Riyad", lat: 24.7136, lng: 46.6753 },
  { name: "Makedonya", flag: flag("makedonya"), capital: "Üsküp", lat: 41.9981, lng: 21.4254 },
  { name: "Azerbaycan", flag: flag("azerbaycan"), capital: "Bakü", lat: 40.4093, lng: 49.8671 },
  { name: "Gürcistan", flag: flag("gurcistan"), capital: "Tiflis", lat: 41.7151, lng: 44.8271 },
  { name: "Tunus", flag: flag("tunus"), capital: "Tunus", lat: 36.8065, lng: 10.1815 },
  { name: "Fas", flag: flag("fas"), capital: "Rabat", lat: 34.0209, lng: -6.8416 },
];
