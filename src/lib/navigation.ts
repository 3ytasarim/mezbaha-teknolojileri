import "server-only";
import { cache } from "react";
import { prisma } from "@/lib/db";

/**
 * Site menüsü: Admin > Sistem > Menü Yönetimi'ndeki kayıtlar (NavigationItem). Bir konumda hiç aktif kayıt yoksa o konumun
 * varsayılan bağlantıları kullanılır — menü hiçbir zaman boş kalmaz. `/urunler` bağlantısı başlıkta kategori açılır menüsü olur.
 */
export const NAV_LOCATIONS = [
  { key: "header-left", label: "Üst menü — sol" },
  { key: "header-right", label: "Üst menü — sağ" },
  { key: "footer-kurumsal", label: "Alt bilgi — Kurumsal sütunu" },
] as const;

export type NavLocation = (typeof NAV_LOCATIONS)[number]["key"];
export type NavLink = { label: string; href: string; dropdown?: boolean };

export const DEFAULT_NAV: Record<NavLocation, { label: string; href: string }[]> = {
  "header-left": [
    { label: "Ürünler", href: "/urunler" },
    { label: "Projeler", href: "/projeler" },
    { label: "Referanslar", href: "/referanslar" },
    { label: "Kataloglar", href: "/kataloglar" },
  ],
  "header-right": [
    { label: "Kurumsal", href: "/hakkimizda" },
    { label: "Blog", href: "/blog" },
    { label: "İletişim", href: "/iletisim" },
  ],
  "footer-kurumsal": [
    { label: "Hakkımızda", href: "/hakkimizda" },
    { label: "Projeler", href: "/projeler" },
    { label: "Referanslar", href: "/referanslar" },
    { label: "Blog", href: "/blog" },
    { label: "Kataloglar", href: "/kataloglar" },
    { label: "Hizmetler", href: "/hizmetler" },
    { label: "İletişim", href: "/iletisim" },
  ],
};

const withDropdown = (items: { label: string; href: string }[]): NavLink[] =>
  items.map((item) => (item.href === "/urunler" ? { ...item, dropdown: true } : item));

/** İstek başına tek DB okuması. Üç konumun bağlantılarını döndürür. */
export const getNavigation = cache(async (): Promise<Record<NavLocation, NavLink[]>> => {
  let rows: { location: string; label: string; url: string }[] = [];
  try {
    rows = await prisma.navigationItem.findMany({
      where: { active: true, parentId: null },
      orderBy: [{ sortOrder: "asc" }, { label: "asc" }],
      select: { location: true, label: true, url: true },
    });
  } catch {
    rows = [];
  }

  const result = {} as Record<NavLocation, NavLink[]>;
  for (const { key } of NAV_LOCATIONS) {
    const mine = rows.filter((r) => r.location === key).map((r) => ({ label: r.label, href: r.url }));
    result[key] = withDropdown(mine.length > 0 ? mine : DEFAULT_NAV[key]);
  }
  return result;
});
