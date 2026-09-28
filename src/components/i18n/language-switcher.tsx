"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { ChevronDown, Globe } from "lucide-react";
import { useLocale } from "./locale-provider";
import { localizePath } from "@/lib/i18n/routes";
import type { Locale } from "@/lib/i18n/config";

export type LanguageOption = { locale: Locale; label: string; name: string };

/**
 * Dil seçici. Karşı dildeki eşdeğer sayfa, sayfanın <head>'indeki hreflang bağlantılarından okunur (sayfalar kendi
 * karşılıklarını zaten yazıyor): karşılığı olmayan dile geçiş o dilin ana sayfasına gider. Düz <a> kullanılır — dil
 * değişince <html lang dir> de değiştiği için tam sayfa yüklemesi doğrudur. Tek dil etkinse hiçbir şey çizilmez.
 * variant="dropdown": masaüstü başlığında yer kazandırır; "inline": mobil menüde tüm diller yan yana.
 */
export function LanguageSwitcher({ options, className = "", label, variant = "inline" }: { options: LanguageOption[]; className?: string; label: string; variant?: "inline" | "dropdown" }) {
  const current = useLocale();
  const pathname = usePathname();
  const [targets, setTargets] = useState<Partial<Record<Locale, string>>>({});
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const read = () => {
      const found: Partial<Record<Locale, string>> = {};
      document.querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]').forEach((el) => {
        const l = el.getAttribute("hreflang") as Locale | "x-default" | null;
        if (l && l !== "x-default") {
          try {
            found[l] = new URL(el.href).pathname;
          } catch {}
        }
      });
      setTargets(found);
    };
    read();
    const id = window.setTimeout(read, 150); // istemci gezinmesinden sonra <head> güncellenir
    return () => window.clearTimeout(id);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (options.length < 2) return null;
  const hrefOf = (l: Locale) => targets[l] ?? localizePath(l, "/");

  if (variant === "dropdown") {
    const cur = options.find((o) => o.locale === current) ?? options[0];
    return (
      <div ref={box} className={`relative ${className}`}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-haspopup="true"
          aria-label={`${label}: ${cur.name}`}
          className="flex h-9 items-center gap-1 rounded-md px-1.5 text-xs font-bold text-gray-700 transition-colors hover:text-accent"
        >
          <Globe className="hidden size-4 xl:block" aria-hidden="true" />
          {cur.label}
          <ChevronDown className={`size-3.5 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
        </button>
        {open && (
          <ul className="absolute end-0 top-full z-50 mt-2 w-44 rounded-md border border-gray-100 bg-white py-1.5 shadow-xl">
            {options.map((o) => (
              <li key={o.locale}>
                <a
                  href={hrefOf(o.locale)}
                  lang={o.locale}
                  hrefLang={o.locale}
                  aria-current={o.locale === current ? "true" : undefined}
                  className={`flex items-center justify-between px-4 py-2 text-sm transition-colors hover:bg-orange-50 ${o.locale === current ? "font-semibold text-accent" : "text-gray-700"}`}
                >
                  <span>{o.name}</span>
                  <span className="text-xs text-gray-400">{o.label}</span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  return (
    <nav aria-label={label} className={`flex flex-wrap items-center justify-center gap-1 text-xs font-bold ${className}`}>
      {options.map((o, i) => {
        const active = o.locale === current;
        return (
          <span key={o.locale} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden="true" className="text-gray-300">/</span>}
            <a
              href={hrefOf(o.locale)}
              lang={o.locale}
              hrefLang={o.locale}
              aria-current={active ? "true" : undefined}
              title={o.name}
              className={`rounded px-1.5 py-1 transition-colors ${active ? "text-accent" : "text-gray-500 hover:text-accent"}`}
            >
              {o.label}
            </a>
          </span>
        );
      })}
    </nav>
  );
}
