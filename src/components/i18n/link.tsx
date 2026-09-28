"use client";

import NextLink from "next/link";
import type { ComponentProps } from "react";
import { localizePath } from "@/lib/i18n/routes";
import { useLocale } from "./locale-provider";

/**
 * next/link sarmalayıcısı: iç bağlantıları (Türkçe iç yollar) geçerli dile çevirir.
 * Dokunulmayanlar: mutlak URL, tel:/mailto:, sadece #çapa, dosya uzantılı yollar (/blog/rss.xml, /uploads/x.pdf), /admin ve /api.
 */
export function shouldLocalize(href: string): boolean {
  if (!href.startsWith("/") || href.startsWith("//")) return false;
  if (/^\/(admin|api|uploads|images|_next)(\/|$)/.test(href)) return false;
  const pathOnly = href.split(/[?#]/)[0];
  return !/\.[a-z0-9]{2,5}$/i.test(pathOnly);
}

export default function Link({ href, ...props }: ComponentProps<typeof NextLink>) {
  const locale = useLocale();
  const target = typeof href === "string" && shouldLocalize(href) ? localizePath(locale, href) : href;
  return <NextLink href={target} {...props} />;
}
