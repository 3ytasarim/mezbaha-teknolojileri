"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

export type OrbitItem = { title: string; text: string };

// meridius.ch "Lifestyle" bölümündeki halka bileşeninin sabitleri (aynı değerler)
const RING_R = 34; // nokta çemberi yarıçapı (viewBox birimi)
const LABEL_R = 51; // etiketlerin oturduğu elips yarıçapı (kapsayıcı genişliği/yüksekliğinin %'si)
const START_DEG = 37; // başlangıç açısı
const REVOLUTION_S = 40; // bir tam tur (sn)
const COMET_DEG = 48; // kuyruklu yayın uzunluğu (derece)

const polar = (deg: number, r: number): [number, number] => {
  const rad = (deg * Math.PI) / 180;
  return [50 + r * Math.sin(rad), 50 - r * Math.cos(rad)];
};

/** t (0..1 tur ilerlemesi) için tüm konumlar: noktalar, etiketler, aktif nokta ve yay. */
function frame(count: number, t: number) {
  const step = 360 / count;
  const base = START_DEG + 360 * t;
  const sweep = 360 * t;
  const head = base + sweep; // yay başı noktalardan iki kat hızlı ilerler (kaynaktaki gibi)
  const active = Math.floor(sweep / step) % count;
  const nodes = Array.from({ length: count }, (_, i) => {
    const deg = base + step * i;
    return { dot: polar(deg, RING_R), label: polar(deg, LABEL_R), active: i === active };
  });
  const [x0, y0] = polar(head - COMET_DEG, RING_R);
  const [x1, y1] = polar(head, RING_R);
  return { nodes, comet: `M${x0} ${y0}A${RING_R} ${RING_R} 0 0 1 ${x1} ${y1}` };
}

/**
 * "Kurumsal" bölümünün sağ tarafı — meridius.ch'deki halka bileşeninin (routes chunk, `pe`) aynı algoritmasıyla:
 * noktalar çemberde 40 sn'de bir tur döner, etiketler noktalarla birlikte daha geniş bir elips üzerinde döner
 * (bu yüzden birbirinin içine girmez), lacivert kuyruklu yay noktaların üstünden geçer, aktif nokta halkalanır.
 * Konumlar requestAnimationFrame ile doğrudan DOM'a yazılır (React yeniden çizimi yok); ekran dışındayken durur,
 * "hareketi azalt" tercihinde sabit kalır. Dar ekranda etiketler çemberin altında liste olur.
 */
export function IntroOrbit({ items }: { items: OrbitItem[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const count = items.length;
  const initial = frame(count, 0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const draw = (t: number) => {
      const { nodes, comet } = frame(count, t);
      nodes.forEach((node, i) => {
        const [cx, cy] = node.dot;
        for (const name of ["dot", "core", "halo"]) {
          const el = root.querySelector(`[data-${name}="${i}"]`);
          el?.setAttribute("cx", String(cx));
          el?.setAttribute("cy", String(cy));
        }
        root.querySelector(`[data-halo="${i}"]`)?.setAttribute("opacity", node.active ? "0.1" : "0");
        root.querySelector(`[data-core="${i}"]`)?.setAttribute("opacity", node.active ? "1" : "0");
        const label = root.querySelector<HTMLElement>(`[data-label="${i}"]`);
        if (label) {
          label.style.left = `${node.label[0]}%`;
          label.style.top = `${node.label[1]}%`;
        }
      });
      root.querySelector("[data-comet]")?.setAttribute("d", comet);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let visible = true;
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
    });
    observer.observe(root);

    const start = performance.now();
    const period = REVOLUTION_S * 1000;
    let raf = requestAnimationFrame(function loop(now) {
      raf = requestAnimationFrame(loop);
      if (visible) draw(((now - start) % period) / period);
    });

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [count]);

  return (
    <div>
      <div className="mx-auto w-full max-w-[820px] py-[4%] lg:w-[78%]">
        <div ref={rootRef} className="relative aspect-[4/3] w-full" style={{ containerType: "inline-size" }}>
          <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            <circle cx="50" cy="50" r={RING_R} fill="none" stroke="#a3b3cf" strokeWidth="0.22" />
            <path data-comet="" d={initial.comet} fill="none" className="stroke-primary" strokeWidth="0.62" strokeLinecap="round" />
            {initial.nodes.map((node, i) => (
              <g key={i}>
                <circle data-halo={i} cx={node.dot[0]} cy={node.dot[1]} r="5.6" className="fill-accent" opacity={node.active ? 0.1 : 0} />
                <circle data-dot={i} cx={node.dot[0]} cy={node.dot[1]} r="2.6" className="fill-accent" />
                <circle data-core={i} cx={node.dot[0]} cy={node.dot[1]} r="0.95" fill="#fff" opacity={node.active ? 1 : 0} />
              </g>
            ))}
          </svg>

          {items.map((item, i) => (
            <div
              key={item.title}
              data-label={i}
              className="absolute hidden -translate-x-1/2 -translate-y-1/2 flex-col gap-[0.6cqw] text-center md:flex"
              style={{ left: `${initial.nodes[i].label[0]}%`, top: `${initial.nodes[i].label[1]}%`, width: "22cqw" }}
            >
              <div className="font-black uppercase leading-[1.1] tracking-[0.03em] text-accent" style={{ fontSize: "clamp(11px,2.2cqw,20px)" }}>
                {item.title}
              </div>
              <div className="font-bold leading-[1.3] text-[#7d8ca8] [text-wrap:pretty]" style={{ fontSize: "clamp(10px,1.8cqw,17px)" }}>
                {item.text}
              </div>
            </div>
          ))}

          <div className="absolute left-1/2 top-1/2 aspect-square w-[27cqw] -translate-x-1/2 -translate-y-1/2">
            <Image
              src="/images/about/mezbaha-favicon.png"
              alt="Mezbaha Teknolojileri"
              width={512}
              height={512}
              className="size-full object-contain drop-shadow-[0_12px_24px_rgba(35,48,95,0.18)]"
              priority={false}
            />
          </div>
        </div>
      </div>

      <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 md:hidden">
        {items.map((item) => (
          <li key={item.title}>
            <p className="text-[13px] font-bold uppercase tracking-wide text-accent">{item.title}</p>
            <p className="mt-1 text-sm leading-snug text-slate-500">{item.text}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
