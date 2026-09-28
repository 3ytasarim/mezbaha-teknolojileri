import "server-only";

const TR_MAP: Record<string, string> = {
  ç: "c",
  Ç: "c",
  ğ: "g",
  Ğ: "g",
  ı: "i",
  I: "i",
  İ: "i",
  ö: "o",
  Ö: "o",
  ş: "s",
  Ş: "s",
  ü: "u",
  Ü: "u",
};

export function slugify(input: string): string {
  const normalized = input
    .split("")
    .map((char) => TR_MAP[char] ?? char)
    .join("");

  return normalized
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "blog",
  "urunler",
  "urun",
  "projeler",
  "proje",
  "iletisim",
  "hakkimizda",
  "teklif-al",
  "sitemap.xml",
  "robots.txt",
  "llms.txt",
  "uploads",
  "images",
]);

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}
