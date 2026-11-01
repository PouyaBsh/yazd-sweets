"use client";

import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import { ORNAMENT, starPoints } from "./geometry";

const MARGIN_MOTIFS = [
  { side: "left", top: "12%", size: 14, delay: 0, dur: 7 },
  { side: "left", top: "38%", size: 9, delay: 1.2, dur: 8.5 },
  { side: "left", top: "71%", size: 12, delay: 2.1, dur: 7.6 },
  { side: "right", top: "22%", size: 10, delay: 0.6, dur: 8 },
  { side: "right", top: "54%", size: 14, delay: 1.8, dur: 7.2 },
  { side: "right", top: "84%", size: 9, delay: 2.6, dur: 9 },
] as const;

interface DesertSaffronAmbientProps {
  className?: string;
  tone?: "light" | "dark";
  /** Floating micro-diamonds in the wide-screen margins. */
  motifs?: boolean;
}

/** soft round light pool: solid core fading out like a blurred disc */
const glow = (rgb: string, a: number) =>
  `radial-gradient(closest-side, rgba(${rgb},${a}) 0%, rgba(${rgb},${a}) 42%, rgba(${rgb},${(a * 0.45).toFixed(3)}) 66%, rgba(${rgb},0) 100%)`;

/** Warm desert light pools + floating micro-geometric diamonds in the page margins. */
export function DesertSaffronAmbient({ className, tone = "light", motifs = true }: DesertSaffronAmbientProps) {
  const dark = tone === "dark";
  return (
    <div aria-hidden data-ornament="ambient" className={cn("pointer-events-none absolute inset-0 -z-10 overflow-hidden", className)}>
      {/* warm light pools — radial gradients instead of blur(64px) filters: same soft look,
          but no huge filtered layers for a phone GPU to re-rasterise */}
      <div className="absolute -top-56 right-[calc(6%-4rem)] h-[36rem] w-[36rem]" style={{ background: glow("212,140,41", dark ? 0.1 : 0.11) }} />
      <div className="absolute top-[calc(38%-4rem)] -left-48 h-[32rem] w-[32rem]" style={{ background: glow("184,93,59", dark ? 0.14 : 0.07) }} />
      <div className="absolute -bottom-48 right-[calc(30%-4rem)] h-[28rem] w-[28rem]" style={{ background: glow("29,106,115", dark ? 0.12 : 0.04) }} />
      {motifs &&
        MARGIN_MOTIFS.map((m, i) => (
          <svg
            key={i}
            viewBox="0 0 20 20"
            className={cn("motif-float absolute hidden xl:block", m.side === "left" ? "left-[1.6%]" : "right-[1.6%]")}
            style={{ top: m.top, width: m.size, height: m.size, "--dur": `${m.dur}s`, "--delay": `${m.delay}s` } as CSSProperties}
          >
            <polygon points={starPoints(10, 10, 9.5, 4, 0.38)} fill={i % 2 ? ORNAMENT.saffron : ORNAMENT.terracotta} />
          </svg>
        ))}
    </div>
  );
}
