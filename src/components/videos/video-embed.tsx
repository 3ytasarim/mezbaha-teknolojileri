"use client";

import Image from "next/image";
import { useState } from "react";
import { format } from "@/lib/i18n/dictionaries";
import { useDict } from "@/components/i18n/locale-provider";

type Props = {
  id: string;
  title: string;
  thumbnail: string;
  watchUrl: string;
  /** Sayfa üstündeki ilk video(lar) için görsel eager yüklenir. */
  priority?: boolean;
};

/**
 * Hafif YouTube "facade": ilk yüklemede yalnızca yerel küçük resim gelir (YouTube'a istek yok);
 * tıklanınca youtube-nocookie iframe'i yüklenir. JS yoksa bağlantı YouTube'da açılır.
 */
export function VideoEmbed({ id, title, thumbnail, watchUrl, priority = false }: Props) {
  const v = useDict().videos;
  const [active, setActive] = useState(false);

  return (
    <div className="relative aspect-video overflow-hidden bg-neutral-900">
      {active ? (
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(event) => {
            event.preventDefault();
            setActive(true);
          }}
          className="group absolute inset-0 block focus-visible:outline-2 focus-visible:outline-offset-[-4px] focus-visible:outline-white"
          aria-label={format(v.play, { title })}
        >
          <Image
            src={thumbnail}
            alt=""
            fill
            sizes="(min-width: 1024px) 45vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            {...(priority ? { loading: "eager" as const, fetchPriority: "high" as const } : {})}
          />
          <span
            aria-hidden="true"
            className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-black/70 text-white transition-colors group-hover:bg-accent"
          >
            <svg viewBox="0 0 24 24" className="ms-1 h-7 w-7 fill-current">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </a>
      )}
    </div>
  );
}
