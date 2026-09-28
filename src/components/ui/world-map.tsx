"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Image from "next/image";

/**
 * 21st.dev "Map" (shailendrakumar19999) bileşeni — kaynak, bileşenin herkese açık önizleme paketinden
 * okunup aynen taşındı: projeksiyon, eğri yay yolu, pathLength animasyonu, yay boyunca giden nokta,
 * glow filtresi, nabız atan pinler, hover büyümesi, mobil etiket, zaman çizelgesi (0.3 sn kademe, 2 sn döngü arası).
 *
 * Bilinçli farklar:
 *  - Nokta haritası çalışma anında `dotted-map` ile üretilmez (≈500 KB'lık satır içi veri olurdu); aynı ayarlarla
 *    (height 100, diagonal, radius 0.22) önceden üretilmiş statik SVG kullanılır: `mapSrc`
 *    (bkz. prisma/migration/generate-world-map.ts).
 *  - next-themes yok (sitede karanlık mod anahtarı yok): açık tema renkleri sabit.
 *  - prefers-reduced-motion: animasyonlar durur, yaylar ve pinler statik görünür.
 */
export type MapLocation = { lat: number; lng: number; label?: string };

interface MapProps {
  dots?: Array<{ start: MapLocation; end: MapLocation }>;
  lineColor?: string;
  showLabels?: boolean;
  labelClassName?: string;
  animationDuration?: number;
  loop?: boolean;
  /** Önceden üretilmiş noktalı dünya haritası (SVG). */
  mapSrc: string;
  /** Ekran okuyucular için harita açıklaması. */
  ariaLabel?: string;
}

export function WorldMap({
  dots = [],
  lineColor = "#0ea5e9",
  showLabels = true,
  labelClassName = "text-sm",
  animationDuration = 2,
  loop = true,
  mapSrc,
  ariaLabel = "Dünya haritası",
}: MapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const reduceMotion = useReducedMotion();
  const shouldLoop = loop && !reduceMotion;

  const projectPoint = (lat: number, lng: number) => {
    const x = (lng + 180) * (800 / 360);
    const y = (90 - lat) * (400 / 180);
    return { x, y };
  };

  const createCurvedPath = (start: { x: number; y: number }, end: { x: number; y: number }) => {
    const midX = (start.x + end.x) / 2;
    const midY = Math.min(start.y, end.y) - 50;
    return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
  };

  const staggerDelay = 0.3;
  const totalAnimationTime = dots.length * staggerDelay + animationDuration;
  const pauseTime = 2;
  const fullCycleDuration = totalAnimationTime + pauseTime;

  return (
    <div
      role="img"
      aria-label={ariaLabel}
      className="relative aspect-[2/1] w-full overflow-hidden rounded-lg bg-transparent font-sans md:aspect-[2.5/1] lg:aspect-[2/1]"
    >
      <Image
        src={mapSrc}
        className="pointer-events-none h-full w-full select-none object-cover [mask-image:linear-gradient(to_bottom,transparent,white_10%,white_90%,transparent)]"
        alt=""
        height={495}
        width={1056}
        draggable={false}
        unoptimized
        priority
      />
      <svg
        ref={svgRef}
        viewBox="0 0 800 400"
        className="pointer-events-auto absolute inset-0 h-full w-full select-none"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="5%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="95%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <filter id="glow">
            <feMorphology operator="dilate" radius="0.5" />
            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Yaylar + yay boyunca giden nokta */}
        {dots.map((dot, i) => {
          const startPoint = projectPoint(dot.start.lat, dot.start.lng);
          const endPoint = projectPoint(dot.end.lat, dot.end.lng);
          const startTime = (i * staggerDelay) / fullCycleDuration;
          const endTime = (i * staggerDelay + animationDuration) / fullCycleDuration;
          const resetTime = totalAnimationTime / fullCycleDuration;
          const d = createCurvedPath(startPoint, endPoint);

          return (
            <g key={`path-group-${i}`}>
              <motion.path
                d={d}
                fill="none"
                stroke="url(#path-gradient)"
                strokeWidth="1"
                initial={{ pathLength: 0 }}
                animate={shouldLoop ? { pathLength: [0, 0, 1, 1, 0] } : { pathLength: 1 }}
                transition={
                  shouldLoop
                    ? {
                        duration: fullCycleDuration,
                        times: [0, startTime, endTime, resetTime, 1],
                        ease: "easeInOut",
                        repeat: Infinity,
                        repeatDelay: 0,
                      }
                    : reduceMotion
                      ? { duration: 0 }
                      : { duration: animationDuration, delay: i * staggerDelay, ease: "easeInOut" }
                }
              />
              {shouldLoop && (
                <motion.circle
                  r="4"
                  fill={lineColor}
                  initial={{ offsetDistance: "0%", opacity: 0 }}
                  animate={{
                    offsetDistance: [null, "0%", "100%", "100%", "100%"],
                    opacity: [0, 0, 1, 0, 0],
                  }}
                  transition={{
                    duration: fullCycleDuration,
                    times: [0, startTime, endTime, resetTime, 1],
                    ease: "easeInOut",
                    repeat: Infinity,
                    repeatDelay: 0,
                  }}
                  style={{ offsetPath: `path('${d}')` }}
                />
              )}
            </g>
          );
        })}

        {/* Pinler (başlangıç + varış), nabız, hover ve etiketler */}
        {dots.map((dot, i) => {
          const startPoint = projectPoint(dot.start.lat, dot.start.lng);
          const endPoint = projectPoint(dot.end.lat, dot.end.lng);

          return (
            <g key={`points-group-${i}`}>
              <g key={`start-${i}`}>
                <motion.g
                  onHoverStart={() => setHoveredLocation(dot.start.label || `Konum ${i}`)}
                  onHoverEnd={() => setHoveredLocation(null)}
                  className="cursor-pointer"
                  whileHover={{ scale: 1.2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  {dot.start.label && <title>{dot.start.label}</title>}
                  <circle cx={startPoint.x} cy={startPoint.y} r="3" fill={lineColor} filter="url(#glow)" className="drop-shadow-lg" />
                  <circle cx={startPoint.x} cy={startPoint.y} r="3" fill={lineColor} opacity="0.5">
                    {!reduceMotion && (
                      <>
                        <animate attributeName="r" from="3" to="12" dur="2s" begin="0s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.6" to="0" dur="2s" begin="0s" repeatCount="indefinite" />
                      </>
                    )}
                  </circle>
                </motion.g>
                {showLabels && dot.start.label && (
                  <motion.g
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 * i + 0.3, duration: 0.5 }}
                    className="pointer-events-none"
                  >
                    <foreignObject x={startPoint.x - 50} y={startPoint.y - 35} width="100" height="30" className="block">
                      <div className="flex h-full items-center justify-center">
                        <span className={`${labelClassName} rounded-md border border-gray-200 bg-white/95 px-2 py-0.5 font-medium text-black shadow-sm`}>
                          {dot.start.label}
                        </span>
                      </div>
                    </foreignObject>
                  </motion.g>
                )}
              </g>

              <g key={`end-${i}`}>
                <motion.g
                  onHoverStart={() => setHoveredLocation(dot.end.label || `Varış ${i}`)}
                  onHoverEnd={() => setHoveredLocation(null)}
                  className="cursor-pointer"
                  whileHover={{ scale: 1.2 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  {dot.end.label && <title>{dot.end.label}</title>}
                  <circle cx={endPoint.x} cy={endPoint.y} r="3" fill={lineColor} filter="url(#glow)" className="drop-shadow-lg" />
                  <circle cx={endPoint.x} cy={endPoint.y} r="3" fill={lineColor} opacity="0.5">
                    {!reduceMotion && (
                      <>
                        <animate attributeName="r" from="3" to="12" dur="2s" begin="0.5s" repeatCount="indefinite" />
                        <animate attributeName="opacity" from="0.6" to="0" dur="2s" begin="0.5s" repeatCount="indefinite" />
                      </>
                    )}
                  </circle>
                </motion.g>
                {showLabels && dot.end.label && (
                  <motion.g
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 * i + 0.5, duration: 0.5 }}
                    className="pointer-events-none"
                  >
                    <foreignObject x={endPoint.x - 50} y={endPoint.y - 35} width="100" height="30" className="block">
                      <div className="flex h-full items-center justify-center">
                        <span className={`${labelClassName} rounded-md border border-gray-200 bg-white/95 px-2 py-0.5 font-medium text-black shadow-sm`}>
                          {dot.end.label}
                        </span>
                      </div>
                    </foreignObject>
                  </motion.g>
                )}
              </g>
            </g>
          );
        })}
      </svg>

      <AnimatePresence>
        {hoveredLocation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-4 start-4 rounded-lg border border-gray-200 bg-white/90 px-3 py-2 text-sm font-medium text-black backdrop-blur-sm sm:hidden"
          >
            {hoveredLocation}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
