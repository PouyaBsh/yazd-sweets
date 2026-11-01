"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { useReactive } from "@/components/kinetic/ScrollReactiveCard";
import { SPRING, SPRING_FADE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ORNAMENT, starPoints } from "./geometry";

type Tone = "light" | "sand" | "dark";

const SURFACE: Record<Tone, string> = { light: "#FFFDF9", sand: "#F2EAE0", dark: "#211A17" };

/** Corner spandrel (لچکی) — drawn for the top-left corner, rotated for the others. */
function LachakiCorner({ tone }: { tone: Tone }) {
  const gold = tone === "dark" ? ORNAMENT.gold : ORNAMENT.saffron;
  return (
    <svg viewBox="0 0 40 40" className="h-full w-full overflow-visible" fill="none">
      {/* spandrel fill */}
      <path d="M3 22 A19 19 0 0 1 22 3 H3 Z" fill={ORNAMENT.firuzeh} fillOpacity={tone === "dark" ? 0.32 : 0.14} />
      {/* double bracket */}
      <path d="M3 30 V9 Q3 3 9 3 H30" stroke={ORNAMENT.firuzeh} strokeWidth={1.1} strokeLinecap="round" />
      <path d="M8 26 V13 Q8 8 13 8 H26" stroke={gold} strokeWidth={0.9} strokeLinecap="round" />
      <path d="M3 22 A19 19 0 0 1 22 3" stroke={gold} strokeWidth={0.8} />
      {/* girih knot */}
      <polygon points={starPoints(11, 11, 4.6, 8, 0.55)} fill={gold} />
      {/* end lozenges */}
      <path d="M30 3 33 0.5 36 3 33 5.5Z M3 30 5.5 33 3 36 0.5 33Z" fill={ORNAMENT.firuzeh} />
    </svg>
  );
}

/** Small mihrab / muqarnas arch straddling the top border — a badge holder. */
function MihrabArch({ tone, children }: { tone: Tone; children?: ReactNode }) {
  const surface = SURFACE[tone];
  return (
    <div className="absolute top-0 left-1/2 h-[26px] w-[78px] -translate-x-1/2 -translate-y-[13px]">
      <svg viewBox="0 0 78 26" className="absolute inset-0 h-full w-full overflow-visible" fill="none">
        <path d="M2 26 V17 C2 11 14 7 24 6 C31 5 36 2 39 0.5 C42 2 47 5 54 6 C64 7 76 11 76 17 V26" fill={surface} />
        <path
          d="M2 26 V17 C2 11 14 7 24 6 C31 5 36 2 39 0.5 C42 2 47 5 54 6 C64 7 76 11 76 17 V26"
          stroke={ORNAMENT.terracotta}
          strokeOpacity={0.45}
          strokeWidth={1}
        />
        <path d="M9 26 V19 C9 15 18 12 26 11.5 C32 11 36 8.5 39 6.5 C42 8.5 46 11 52 11.5 C60 12 69 15 69 19 V26" stroke={ORNAMENT.saffron} strokeOpacity={0.5} strokeWidth={0.8} />
      </svg>
      <span
        className={cn(
          "absolute inset-x-0 bottom-[3px] text-center text-[10px] leading-none font-black",
          tone === "dark" ? "text-heritage-ink" : "text-ink",
        )}
      >
        {children}
      </span>
    </div>
  );
}

const CORNERS = [
  { pos: "top-[5px] left-[5px]", rotate: 0 },
  { pos: "top-[5px] right-[5px]", rotate: 90 },
  { pos: "bottom-[5px] right-[5px]", rotate: 180 },
  { pos: "bottom-[5px] left-[5px]", rotate: 270 },
];

interface LachakiCardFrameProps {
  children: ReactNode;
  className?: string;
  tone?: Tone;
  /** Outer radius class — must match the framed card. */
  radius?: string;
  /** Inner (inset-1.5) radius class. */
  innerRadius?: string;
  /** Override the reactive state (otherwise read from ScrollReactiveCard). */
  active?: boolean;
  /** Show the top-centre mihrab arch; pass content to use it as a badge holder. */
  arch?: ReactNode | true;
  /** "sm" for small cards (smaller corner spandrels). */
  size?: "md" | "sm";
}

/**
 * Traditional double-hairline frame with four lachaki corner spandrels and an optional
 * mihrab arch. Corners expand and glow when the card is active (hover / viewport-centre).
 */
export function LachakiCardFrame({
  children,
  className,
  tone = "light",
  radius = "rounded-[1.75rem]",
  innerRadius = "rounded-[1.4rem]",
  active: activeProp,
  arch,
  size = "md",
}: LachakiCardFrameProps) {
  const reactive = useReactive();
  const active = activeProp ?? reactive;
  const dark = tone === "dark";

  return (
    <div className={cn("relative", className)}>
      {children}
      <div aria-hidden data-ornament="lachaki" className="pointer-events-none absolute inset-0 z-[6]">
        {/* saffron glow: static shadow, opacity springs (shadow strings don't interpolate reliably) */}
        <motion.div
          className={cn("absolute inset-0", radius)}
          style={{ boxShadow: "0 0 0 1px rgba(212,140,41,0.12), 0 18px 40px -26px rgba(212,140,41,0.55)" }}
          initial={false}
          animate={{ opacity: active ? 1 : 0 }}
          transition={active ? SPRING : SPRING_FADE_OUT}
        />
        <motion.div
          className={cn("absolute inset-0 border", radius)}
          initial={false}
          animate={{
            borderColor: active ? "rgba(212, 140, 41, 0.62)" : dark ? "rgba(226, 180, 103, 0.22)" : "rgba(184, 93, 59, 0.2)",
          }}
          transition={active ? SPRING : SPRING_FADE_OUT}
        />
        <motion.div
          className={cn("absolute inset-1.5 border", innerRadius)}
          initial={false}
          animate={{ borderColor: active ? "rgba(212, 140, 41, 0.38)" : "rgba(212, 140, 41, 0.15)" }}
          transition={SPRING}
        />
        {CORNERS.map((c) => (
          <motion.span
            key={c.rotate}
            className={cn("absolute", size === "sm" ? "h-[18px] w-[18px]" : "h-6 w-6", c.pos)}
            style={{ rotate: c.rotate }}
            initial={false}
            animate={{ scale: active ? 1.22 : 1, opacity: active ? 1 : 0.72 }}
            transition={SPRING}
          >
            <LachakiCorner tone={tone} />
          </motion.span>
        ))}
        {arch && <MihrabArch tone={tone}>{arch === true ? null : arch}</MihrabArch>}
      </div>
    </div>
  );
}
