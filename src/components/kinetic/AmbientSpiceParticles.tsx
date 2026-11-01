"use client";

import { useInView } from "framer-motion";
import { useMemo, useRef, type CSSProperties } from "react";
import { cn } from "@/lib/utils";

type Kind = "thread" | "diamond" | "mote";

interface Particle {
  kind: Kind;
  x: number; // % from left
  size: number;
  dur: number; // seconds per rise
  sway: number; // px
  swayDur: number; // seconds per half sway
  phase: number;
  spin: number; // deg, ± at sway extremes
  color: string;
  opacity: number;
}

/** Deterministic PRNG so server and client render identical particles. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const COLORS = { light: ["#D48C29", "#B85D3B", "#7D8B3F", "#D48C29"], dark: ["#E2B467", "#D48C29", "#C8893A", "#F5EFE6"] };

function makeParticles(count: number, seed: number, tone: "light" | "dark"): Particle[] {
  const rnd = mulberry32(seed);
  const kinds: Kind[] = ["thread", "diamond", "mote", "mote", "thread", "diamond"];
  return Array.from({ length: count }, (_, i) => {
    // keep most motes in the outer bands so they never sit on body copy
    const band = rnd();
    const x = band < 0.42 ? 2 + rnd() * 20 : band < 0.84 ? 78 + rnd() * 20 : 24 + rnd() * 52;
    const kind = kinds[i % kinds.length];
    return {
      kind,
      x,
      size: kind === "mote" ? 2.5 + rnd() * 3 : kind === "diamond" ? 6 + rnd() * 5 : 10 + rnd() * 6,
      dur: 21 + rnd() * 34,
      sway: 8 + rnd() * 22,
      swayDur: 2.2 + rnd() * 3.2,
      phase: rnd(),
      spin: (rnd() - 0.5) * 90,
      color: COLORS[tone][i % COLORS[tone].length],
      opacity: kind === "mote" ? 0.35 + rnd() * 0.3 : 0.45 + rnd() * 0.35,
    };
  });
}

interface AmbientSpiceParticlesProps {
  className?: string;
  count?: number;
  seed?: number;
  tone?: "light" | "dark";
}

/**
 * Saffron threads, cardamom-green diamonds and warm dust motes drifting upward with a
 * sinusoidal sway. Pure CSS keyframes on transform/opacity, so the drift runs on the
 * compositor thread and stays smooth even while React or framer-motion is busy.
 * Three nested layers: rise (full-height column, translateY in % of the section) ·
 * sway (alternate X + tilt) · fade (opacity envelope). Paused off-screen; disabled for
 * prefers-reduced-motion in globals.css.
 */
export function AmbientSpiceParticles({ className, count = 16, seed = 7, tone = "light" }: AmbientSpiceParticlesProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { margin: "60px" });
  const particles = useMemo(() => makeParticles(count, seed, tone), [count, seed, tone]);

  return (
    <div
      ref={rootRef}
      aria-hidden
      data-ornament="particles"
      data-paused={inView ? undefined : ""}
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {particles.map((p, i) => {
        const vars = {
          "--dur": `${p.dur.toFixed(1)}s`,
          "--delay": `${(-p.phase * p.dur).toFixed(2)}s`,
          "--sway": `${p.sway.toFixed(1)}px`,
          "--sway-dur": `${p.swayDur.toFixed(2)}s`,
          "--spin": `${p.spin.toFixed(1)}deg`,
          "--o": p.opacity.toFixed(2),
        } as CSSProperties;
        return (
          <span key={i} className="spice-rise absolute inset-y-0 w-0" style={{ left: `${p.x}%`, ...vars }}>
            <span className="spice-sway absolute top-0 left-0 block" style={vars}>
              <span className="spice-fade block" style={{ ...vars, opacity: p.opacity * 0.6 }}>
                {p.kind === "thread" && (
                  <svg width={p.size} height={p.size * 0.45} viewBox="0 0 20 9" fill="none" className="block">
                    <path d="M1 7 C 6 1, 12 9, 19 2" stroke={p.color} strokeWidth={1.6} strokeLinecap="round" />
                    <circle cx={19} cy={2} r={1.4} fill={p.color} />
                  </svg>
                )}
                {p.kind === "diamond" && (
                  <svg width={p.size} height={p.size} viewBox="0 0 10 10" className="block">
                    <path d="M5 0 6.2 3.8 10 5 6.2 6.2 5 10 3.8 6.2 0 5 3.8 3.8Z" fill={p.color} />
                  </svg>
                )}
                {p.kind === "mote" && (
                  <span className="block rounded-full" style={{ width: p.size, height: p.size, backgroundColor: p.color }} />
                )}
              </span>
            </span>
          </span>
        );
      })}
    </div>
  );
}
