"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { rich } from "@/lib/i18n/rich";
import { useDict } from "@/components/i18n/locale-provider";
import { Building2, Globe2, MapPin, Search, Snowflake, Train, Factory, Landmark } from "lucide-react";

export type ReferenceItem = { name: string; place: string; foreign: boolean; type: string; image?: string; imageAlt?: string };

const tr = (s: string) => s.toLocaleLowerCase("tr");
const titleCase = (s: string) =>
  tr(s)
    .split(" ")
    .map((w) => (w ? w.charAt(0).toLocaleUpperCase("tr") + w.slice(1) : w))
    .join(" ");

const ICONS: Record<string, typeof Building2> = {
  "Belediye Mezbahası": Landmark,
  "Cezaevi Mezbahası": Landmark,
  "Monoray Hattı": Train,
  "Soğuk Oda": Snowflake,
  "Et Tesisi": Factory,
  "Kurban Kesim Tesisi": Factory,
  Mezbaha: Building2,
  Kesimhane: Building2,
  Tesis: Building2,
};

/**
 * Referans listesi: tür süzgeci + arama (istemci tarafı). Tüm referanslar sayfa yüklenince HTML'de vardır (sunucuda
 * üretilir); süzgeç yalnızca gizler. Yurt dışı referanslar rozetle işaretlenir.
 */
export function ReferenceList({ items }: { items: ReferenceItem[] }) {
  const r = useDict().references;
  const typeLabel = (t: string) => r.types[t] ?? t;
  const [type, setType] = useState<string>("all");
  const [query, setQuery] = useState("");

  const types = useMemo(() => {
    const counts = new Map<string, number>();
    for (const i of items) counts.set(i.type, (counts.get(i.type) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [items]);

  const q = tr(query.trim());
  const visible = (i: ReferenceItem) => (type === "all" || i.type === type) && (!q || tr(`${i.name} ${i.place}`).includes(q));
  const shown = items.filter(visible).length;

  const chip = (active: boolean) =>
    `inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-colors ${
      active ? "border-primary bg-primary text-white" : "border-border bg-white text-primary hover:border-primary"
    }`;

  return (
    <div>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div role="group" aria-label={r.typeGroup} className="flex flex-wrap gap-2">
          <button type="button" onClick={() => setType("all")} aria-pressed={type === "all"} className={chip(type === "all")}>
            {r.all} <span className="text-xs opacity-70">{items.length}</span>
          </button>
          {types.map(([t, n]) => (
            <button key={t} type="button" onClick={() => setType(t)} aria-pressed={type === t} className={chip(type === t)}>
              {typeLabel(t)} <span className="text-xs opacity-70">{n}</span>
            </button>
          ))}
        </div>

        <div className="relative w-full lg:w-80">
          <label htmlFor="ref-ara" className="sr-only">
            {r.searchLabel}
          </label>
          <Search className="pointer-events-none absolute start-4 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
          <input
            id="ref-ara"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={r.searchPlaceholder}
            className="h-11 w-full rounded-full border border-border bg-white ps-11 pe-4 text-sm outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
          />
        </div>
      </div>

      <p className="mt-6 text-sm text-muted-foreground" aria-live="polite">
        {rich(r.showing, { n: <span className="font-semibold text-foreground">{shown}</span> })}
      </p>

      <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const Icon = ICONS[item.type] ?? Building2;
          return (
            <li
              key={`${item.name}-${item.place}`}
              hidden={!visible(item)}
              className="group flex overflow-hidden rounded-2xl border border-border bg-white shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
            >
              {item.image ? (
                <div className="relative w-28 shrink-0 sm:w-32">
                  <Image src={item.image} alt={item.imageAlt ?? item.name} fill sizes="128px" className="object-cover" />
                </div>
              ) : (
                <div className="flex w-14 shrink-0 items-center justify-center bg-orange-50 text-accent sm:w-16">
                  <Icon className="size-6" aria-hidden="true" />
                </div>
              )}
              <div className="min-w-0 flex-1 p-4">
                <h3 className="font-heading text-[15px] font-bold leading-snug text-primary">{titleCase(item.name)}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs">
                  <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">{typeLabel(item.type)}</span>
                  {item.place && (
                    <span className="inline-flex items-center gap-1 text-muted-foreground">
                      {item.foreign ? <Globe2 className="size-3.5 text-accent" aria-hidden="true" /> : <MapPin className="size-3.5 text-accent" aria-hidden="true" />}
                      {r.places[item.place] ?? titleCase(item.place.replace(/TÜKMENİSTAN/i, "TÜRKMENİSTAN"))}
                    </span>
                  )}
                  {item.foreign && <span className="rounded-full bg-orange-50 px-2.5 py-1 font-semibold text-accent">{r.foreign}</span>}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {shown === 0 && <p className="py-12 text-center text-muted-foreground">{r.none}</p>}
    </div>
  );
}
