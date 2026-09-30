"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "@/components/i18n/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronRight, Menu, Phone, X } from "lucide-react";
import { SITE_NAME } from "@/lib/seo/site";
import { resolvePublicPath } from "@/lib/i18n/routes";
import { format } from "@/lib/i18n/dictionaries";
import { useDict } from "@/components/i18n/locale-provider";
import { LanguageSwitcher, type LanguageOption } from "@/components/i18n/language-switcher";
import { FlowButton } from "@/components/ui/flow-button";
import { Button3D } from "@/components/ui/button-3d";
import type { DisplayCategory } from "@/lib/content-fallback";
import type { NavLink } from "@/lib/navigation";

/**
 * Header: Norm-Yacht (Navbar.tsx) yapısıyla birebir düzen —
 *  1) koyu bilgi şeridi (telefon/e-posta solda, sosyal/WhatsApp sağda; yalnızca md+),
 *  2) beyaz yapışkan ana menü: solda 3 link, ORTADA logo, sağda 3 link (+ CTA), h-20,
 *  3) mobilde hamburger + menünün altına açılan panel.
 * Yalnızca gerçek veriler kullanılır (iletişim bilgileri site.ts'den, YouTube kanalı eski sitedeki videolardan).
 */


// Tam masaüstü menü yalnızca 2xl'de (1536px) görünür — Rusça/Almanca gibi daha uzun çevirilerde bile
// logo ile linkler çakışmasın diye. Daha dar genişliklerde (tablet + küçük masaüstü dahil) hamburger kullanılır.
const linkBase = "nav-link whitespace-nowrap text-xs font-semibold uppercase tracking-wide transition-colors 2xl:text-sm";

export function SiteHeader({
  categories,
  leftLinks,
  rightLinks,
  phone,
  phoneDigits,
  whatsappHref,
  languages,
}: {
  categories: DisplayCategory[];
  leftLinks: NavLink[];
  rightLinks: NavLink[];
  phone: string;
  phoneDigits: string;
  whatsappHref: string;
  languages: LanguageOption[];
}) {
  const pathname = usePathname();
  const d = useDict().common;
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileProductsOpen, setMobileProductsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Sayfa değişince mobil menüyü kapat (render sırasında durum eşitleme; effect gerekmez).
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setMenuOpen(false);
    setMobileProductsOpen(false);
  }

  // Aktif bağlantı, önekli/yerelleştirilmiş yol iç (Türkçe) yola çevrilerek karşılaştırılır.
  const currentPath = resolvePublicPath(pathname).internalPath;
  const isActive = (href: string) => currentPath === href || currentPath.startsWith(href + "/");

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b border-gray-100 bg-white transition-shadow duration-300 ${
          scrolled ? "shadow-md" : "shadow-sm"
        }`}
      >
        <div className="mx-auto max-w-[1600px] px-4 lg:px-6 xl:px-10">
          {/* Logo, sol/sağ menülerin GENİŞLİĞİNDEN bağımsız olarak 2xl'de tam ortaya sabitlenir (relative+absolute) —
              aksi halde eşit flex-1 paylaşımı, sağ taraf (3 link + dil + CTA) sol taraftan doğal olarak daha geniş
              olduğu için (özellikle Rusça/Almanca gibi uzun çevirilerde) logoya taşardı. */}
          <div className="relative flex h-20 items-center justify-between">
            {/* Sol linkler */}
            <nav aria-label={d.mainMenu} className="hidden shrink-0 items-center gap-4 2xl:flex 2xl:gap-5">
              {leftLinks.map((link) =>
                link.dropdown ? (
                  <div key={link.href} className="group relative">
                    <Link
                      href={link.href}
                      aria-haspopup="true"
                      className={`${linkBase} flex items-center gap-1 ${
                        isActive(link.href) ? "active text-accent" : "text-gray-700 hover:text-accent"
                      }`}
                    >
                      {link.label}
                      <ChevronDown
                        className="h-3.5 w-3.5 transition-transform group-focus-within:rotate-180 group-hover:rotate-180"
                        aria-hidden="true"
                      />
                    </Link>
                    <div className="invisible absolute start-0 top-full z-50 w-72 rounded-md border border-gray-100 bg-white py-2 opacity-0 shadow-xl transition-opacity group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                      {categories.map((category) => (
                        <Link
                          key={category.slug}
                          href={category.href}
                          className="block px-4 py-2.5 text-sm text-gray-700 transition-colors hover:bg-orange-50 hover:text-accent"
                        >
                          {category.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`${linkBase} ${isActive(link.href) ? "active text-accent" : "text-gray-700 hover:text-accent"}`}
                  >
                    {link.label}
                  </Link>
                )
              )}
            </nav>

            {/* Ortada logo: <2xl'de normal akışta (tek başına, sol/sağ menü zaten gizli); 2xl+'de mutlak ortalanmış */}
            <div className="shrink-0 2xl:absolute 2xl:start-1/2 2xl:top-1/2 2xl:-translate-x-1/2 2xl:-translate-y-1/2 rtl:2xl:translate-x-1/2">
              <Link href="/" aria-label={format(d.homeAria, { name: SITE_NAME })}>
                <Image
                  src="/images/brand/logo.svg"
                  alt={SITE_NAME}
                  width={483}
                  height={117}
                  unoptimized
                  priority
                  className="h-11 w-auto object-contain sm:h-12 lg:h-12 xl:h-14"
                />
              </Link>
            </div>

            {/* Sağ linkler + CTA */}
            <div className="hidden shrink-0 items-center justify-end gap-3 2xl:flex 2xl:gap-3">
              {rightLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${linkBase} ${isActive(link.href) ? "active text-accent" : "text-gray-700 hover:text-accent"}`}
                >
                  {link.label}
                </Link>
              ))}
              <LanguageSwitcher options={languages} label={d.language} variant="dropdown" />
              <FlowButton
                href="/teklif-al"
                text={d.getQuote}
                className="whitespace-nowrap !px-4 !py-2.5 !text-xs 2xl:!px-5"
              />
            </div>

            {/* Mobil: dil seçici hamburger'ın hemen solunda (menü panelinin içinde değil) */}
            <div className="flex items-center gap-1 2xl:hidden">
              <LanguageSwitcher options={languages} label={d.language} variant="dropdown" />
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
                aria-expanded={menuOpen}
                aria-controls="mobile-menu"
                className="flex h-12 w-12 items-center justify-center p-1 text-gray-700"
              >
                <span className="sr-only">{menuOpen ? d.closeMenu : d.openMenu}</span>
                {menuOpen ? <X className="h-6 w-6" aria-hidden="true" /> : <Menu className="h-6 w-6" aria-hidden="true" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobil menü paneli: başlığın altında tüm ekranı kaplar */}
        {menuOpen && (
          <div id="mobile-menu" className="fixed inset-x-0 bottom-0 top-20 z-40 overflow-y-auto overscroll-contain bg-white 2xl:hidden">
            <nav aria-label={d.mobileMenu} className="mx-auto flex min-h-full max-w-xl flex-col px-5 pb-8 pt-3">
              <ul className="divide-y divide-gray-100">
                {[...leftLinks, ...rightLinks].map((link) => {
                  const active = isActive(link.href);
                  const row = `flex min-h-14 w-full items-center justify-between gap-3 py-3 text-lg font-semibold transition-colors ${
                    active ? "text-accent" : "text-primary hover:text-accent"
                  }`;
                  return (
                    <li key={link.href}>
                      {link.dropdown ? (
                        <>
                          <button type="button" onClick={() => setMobileProductsOpen((v) => !v)} aria-expanded={mobileProductsOpen} className={row}>
                            {link.label}
                            <ChevronDown className={`size-5 text-gray-400 transition-transform ${mobileProductsOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                          </button>
                          {mobileProductsOpen && (
                            <ul className="mb-3 space-y-1 rounded-xl bg-orange-50/60 p-2">
                              <li>
                                <Link href="/urunler" className="block min-h-12 rounded-lg px-3 py-3 text-[15px] font-semibold text-accent">
                                                  {d.allProducts}
                                </Link>
                              </li>
                              {categories.map((category) => (
                                <li key={category.slug}>
                                  <Link href={category.href} className="block min-h-12 rounded-lg px-3 py-3 text-[15px] text-gray-700 transition-colors hover:bg-white hover:text-accent">
                                    {category.name}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          )}
                        </>
                      ) : (
                        <Link href={link.href} aria-current={active ? "page" : undefined} className={row}>
                          {link.label}
                          <ChevronRight className="size-5 text-gray-300 rtl:-scale-x-100" aria-hidden="true" />
                        </Link>
                      )}
                    </li>
                  );
                })}
              </ul>

              <div className="mt-auto space-y-4 pt-8">
                <a
                  href={`tel:+${phoneDigits}`}
                  className="flex min-h-14 items-center gap-3 rounded-xl bg-slate-50 px-4 text-[15px] font-semibold text-primary transition-colors hover:bg-orange-50"
                >
                  <span className="flex size-9 items-center justify-center rounded-full bg-white text-accent shadow-sm">
                    <Phone className="size-4" aria-hidden="true" />
                  </span>
                  {phone}
                </a>
                <Button3D href="/teklif-al" tone="accent" size="lg" fullWidth>
                  {d.getQuote}
                </Button3D>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-h-14 items-center justify-center rounded-xl bg-[#0e7f3a] px-6 text-base font-semibold text-white transition-colors hover:bg-[#0b6a30]"
                >
                  {d.whatsappWrite}
                  <span className="sr-only"> {d.opensInNewTab}</span>
                </a>
              </div>
            </nav>
          </div>
        )}
      </header>
    </>
  );
}
