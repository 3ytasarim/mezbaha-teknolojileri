"use client";

import { useState } from "react";
import { Play } from "lucide-react";

/**
 * YouTube videosu, tıklanana kadar YouTube'dan HİÇBİR şey yüklenmez (performans + gizlilik/KVKK): önce site renklerinde bir
 * kapak gösterilir; tıklayınca gizlilik dostu youtube-nocookie iframe'i açılır ve video oynar.
 */
export function LiteYouTube({ videoId, title, className = "" }: { videoId: string; title: string; className?: string }) {
  const [active, setActive] = useState(false);

  return (
    <div className={`relative aspect-video w-full overflow-hidden rounded-2xl bg-primary shadow-lg ${className}`}>
      {active ? (
        <iframe
          className="absolute inset-0 size-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          referrerPolicy="strict-origin-when-cross-origin"
        />
      ) : (
        <button
          type="button"
          onClick={() => setActive(true)}
          className="group absolute inset-0 flex size-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#16204a] via-primary to-[#2f3f7d] text-white outline-offset-[-4px]"
        >
          <span aria-hidden="true" className="pointer-events-none absolute -bottom-16 -end-10 size-56 rounded-full bg-accent/30 blur-[70px]" />
          <span className="relative flex size-16 items-center justify-center rounded-full bg-accent shadow-[0_10px_30px_rgba(176,74,32,0.5)] transition-transform duration-300 group-hover:scale-110">
            <Play className="ms-1 size-7 fill-white text-white" aria-hidden="true" />
          </span>
          <span className="relative px-4 text-center text-sm font-semibold">Tanıtım videosunu izle</span>
          <span className="sr-only">{title} (YouTube videosu)</span>
        </button>
      )}
    </div>
  );
}
