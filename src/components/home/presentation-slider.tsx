"use client";

import Image from "next/image";
import Link from "@/components/i18n/link";
import { ArrowRight } from "lucide-react";
import { AutoMarquee } from "@/components/ui/auto-marquee";
import { useDict, useLocale } from "@/components/i18n/locale-provider";

export type PresentationItem = {
  id: string;
  country: string;
  title: string;
  city: string;
  type: string;
  capacity: string;
  image: string;
  projectSlug?: string;
};

/**
 * Kart tasarımı B2B-Voice "Industries" bölümündeki gibi (numara rozetli görselli kart, madde işaretli satırlar).
 * Akış/oklar/noktalar ortak AutoMarquee bileşenindedir.
 */
function Card({ item, index, total }: { item: PresentationItem; index: number; total: number }) {
  const d = useDict().home.presentation;
  const locale = useLocale();
  const bullets = [
    item.city && `City: ${item.city}`,
    item.type && `Type: ${item.type}`,
    item.capacity && `Capacity: ${item.capacity}`,
  ].filter(Boolean) as string[];

  return (
    <article
      aria-label={`${index + 1} / ${total}`}
      className="group flex w-[min(86vw,440px)] shrink-0 flex-col overflow-hidden border border-slate-200 bg-white shadow-sm transition-transform duration-300 hover:-translate-y-1.5"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-200">
        <Image
          src={item.image}
          alt={`${item.title}${item.city ? ` — ${item.city}` : ""}`}
          fill
          sizes="(min-width: 640px) 440px, 86vw"
          className="object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#03132f]/35 via-transparent to-transparent" />
        <span
          aria-hidden="true"
          className="absolute start-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-white/90 text-xs font-bold text-primary shadow-sm"
        >
          {String(index + 1).padStart(2, "0")}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-5 md:p-6">
        <h3 className="min-h-[2.5em] text-xl font-bold leading-tight text-slate-900 md:text-2xl">{item.title}</h3>
        <ul className="mt-4 flex-1 space-y-2.5">
          {bullets.map((line) => (
            <li key={line} className="flex items-start gap-2.5 text-sm text-slate-600">
              <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              <span className="uppercase">{line}</span>
            </li>
          ))}
        </ul>
        <Link
          href={item.projectSlug && locale === "tr" ? `/projeler/${item.projectSlug}` : "/projeler"}
          className="mt-5 inline-flex items-center gap-2 pt-1 text-sm font-semibold text-primary hover:underline"
        >
          {d.viewProject}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:-scale-x-100" aria-hidden="true" />
          <span className="sr-only"> — {item.title}</span>
        </Link>
      </div>
    </article>
  );
}

export function PresentationSlider({ items, label }: { items: PresentationItem[]; label: string }) {
  return (
    <AutoMarquee
      label={label}
      items={items.map((item, index) => (
        <Card key={item.id} item={item} index={index} total={items.length} />
      ))}
    />
  );
}
