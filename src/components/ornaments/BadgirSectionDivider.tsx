"use client";

import { motion, useScroll, useSpring, useTransform, type MotionValue } from "framer-motion";
import { useId, useRef } from "react";
import { cn } from "@/lib/utils";
import { ORNAMENT } from "./geometry";

/* ───────────────────────── Kashikari ribbon ───────────────────────── */

interface KashikariRibbonProps {
  className?: string;
  /** 0 → 1 reveal; when omitted the ribbon is fully drawn. */
  progress?: MotionValue<number>;
  /** Side the reveal grows from. */
  origin?: "left" | "right" | "center";
}

/**
 * Moaraq (معرق) tile ribbon — turquoise lozenges, lajevard crosses and saffron studs between
 * terracotta hairlines. The hairlines draw in (pathLength) and the tiles unroll with scroll.
 */
export function KashikariRibbon({ className, progress, origin = "center" }: KashikariRibbonProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const fallback = useSpring(1);
  const p = progress ?? fallback;
  const originX = origin === "left" ? "0%" : origin === "right" ? "100%" : "50%";

  return (
    <svg aria-hidden className={cn("pointer-events-none h-[18px] w-full", className)} xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id={`kashi-${id}`} width={30} height={12} patternUnits="userSpaceOnUse">
          <path d="M15 0.5 21 6 15 11.5 9 6Z" fill={ORNAMENT.firuzeh} fillOpacity={0.62} />
          <path d="M15 3 18 6 15 9 12 6Z" fill="#FAF6F0" />
          <circle cx={15} cy={6} r={1.2} fill={ORNAMENT.saffron} />
          <path d="M0 3.5v5M-2.5 6h5M30 3.5v5M27.5 6h5" stroke={ORNAMENT.lajevard} strokeWidth={1.2} strokeOpacity={0.75} />
          <path d="M4 6h3M23 6h3" stroke={ORNAMENT.terracotta} strokeWidth={0.8} strokeOpacity={0.6} />
        </pattern>
      </defs>
      <motion.line x1="0" y1="1" x2="100%" y2="1" stroke={ORNAMENT.terracotta} strokeOpacity={0.45} strokeWidth={1} style={{ pathLength: p }} />
      <motion.rect
        x="0"
        y="3"
        width="100%"
        height="12"
        fill={`url(#kashi-${id})`}
        style={{ scaleX: p, transformOrigin: `${originX} 50%`, transformBox: "fill-box" }}
      />
      <motion.line x1="0" y1="17" x2="100%" y2="17" stroke={ORNAMENT.terracotta} strokeOpacity={0.45} strokeWidth={1} style={{ pathLength: p }} />
    </svg>
  );
}

/* ───────────────────────── Yazd skyline ───────────────────────── */

const SKYLINE_OUTLINE = [
  // ground
  "M0 95.5H360",
  // left windcatcher (Dowlat-Abad style, tall)
  "M30 95V34h3v-6h4v6h4v-6h4v6h4v-6h4v6h3V95",
  "M37 40v14M43 40v14M49 40v14",
  // house with arched door
  "M64 95V70h30v25M74 95v-9a5 5 0 0 1 10 0v9",
  // twin minarets + iwan (Jameh mosque silhouette)
  "M104 95V30l3-6 3 6v65M104 38h6M104 52h6",
  "M116 95V58h56v37M128 95V74c0-8 8-13 16-16 8 3 16 8 16 16v21",
  "M178 95V30l3-6 3 6v65M178 38h6M178 52h6",
  // pointed dome
  "M192 95V74c0-14 14-24 26-32 12 8 26 18 26 32v21M218 42V30",
  // small windcatcher (Amir-Chakhmaq style)
  "M258 95V50h3v-5h4v5h4v-5h4v5h3V95M264 55v12M270 55v12",
  // house
  "M284 95V74h26v21M292 95v-8a5 5 0 0 1 10 0v8",
  // right windcatcher
  "M318 95V34h3v-6h4v6h4v-6h4v6h4v-6h4v6h3V95M325 40v14M331 40v14M337 40v14",
];

function Skyline({ progress, className }: { progress: MotionValue<number>; className?: string }) {
  const fillOpacity = useTransform(progress, [0, 1], [0.45, 1]);
  return (
    <svg viewBox="0 0 360 96" className={cn("overflow-visible", className)} fill="none" aria-hidden>
      <motion.g style={{ opacity: fillOpacity }}>
        <path
          d="M30 95V34h26V95ZM104 95V30l3-6 3 6v65ZM116 95V58h56v37ZM178 95V30l3-6 3 6v65ZM192 95V74c0-14 14-24 26-32 12 8 26 18 26 32v21ZM258 95V50h18V95ZM318 95V34h26V95ZM64 95V70h30v25ZM284 95V74h26v21Z"
          fill={ORNAMENT.terracotta}
          fillOpacity={0.07}
        />
        <circle cx={218} cy={66} r={3} fill={ORNAMENT.saffron} fillOpacity={0.6} />
      </motion.g>
      {SKYLINE_OUTLINE.map((d, i) => (
        <motion.path
          key={i}
          d={d}
          stroke={i === 0 ? ORNAMENT.terracotta : i % 3 === 0 ? ORNAMENT.firuzeh : ORNAMENT.terracotta}
          strokeOpacity={0.62}
          strokeWidth={1.1}
          strokeLinecap="butt"
          strokeLinejoin="round"
          style={{ pathLength: progress }}
        />
      ))}
    </svg>
  );
}

/* ───────────────────────── Divider ───────────────────────── */

/**
 * Architectural frieze between sections: Yazd windcatchers, twin minarets and a dome,
 * flanked by kashikari tile ribbons. Everything draws in as it scrolls into view.
 */
export function BadgirSectionDivider({ className }: { className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  // completes only when the frieze has travelled up to ~30% from the top of the screen
  // (was 60%: it finished almost as soon as it appeared)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "center 30%"] });
  const raw = useSpring(scrollYProgress, { stiffness: 160, damping: 32 });
  // ribbons start partly unrolled so the frieze is never an empty gap
  const progress = useTransform(raw, (v) => 0.18 + v * 0.82);
  const opacity = useTransform(raw, [0, 0.15], [0.7, 1]);

  return (
    <motion.div
      ref={ref}
      style={{ opacity }}
      aria-hidden
      data-ornament="badgir"
      className={cn("pointer-events-none mx-auto flex h-16 w-full max-w-[1320px] items-end gap-3 px-4 md:h-24 md:gap-5 md:px-8", className)}
    >
      <KashikariRibbon className="mb-1 min-w-0 flex-1" progress={progress} origin="right" />
      <Skyline progress={progress} className="h-full w-[200px] shrink-0 md:w-[340px]" />
      <KashikariRibbon className="mb-1 min-w-0 flex-1" progress={progress} origin="left" />
    </motion.div>
  );
}
