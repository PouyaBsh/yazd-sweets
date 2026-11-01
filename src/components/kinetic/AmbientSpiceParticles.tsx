"use client";

import { useInView } from "framer-motion";
import { useEffect, useMemo, useRef } from "react";
import { prefersReducedMotion } from "@/lib/compositor";
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
 * sinusoidal sway. Three nested layers per particle — rise (full-height column, translateY in % of
 * the section) · sway (alternate X + tilt) · fade (opacity envelope) — each a Web Animation with
 * concrete keyframe values, so all of it runs on the compositor thread. (The earlier CSS version
 * built its keyframes from custom properties; Chrome ticked those on the main thread — a style
 * recalc on every frame.) Paused off-screen; still for prefers-reduced-motion.
 */
export function AmbientSpiceParticles({ className, count = 16, seed = 7, tone = "light" }: AmbientSpiceParticlesProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const riseRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const swayRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const fadeRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const anims = useRef<Animation[]>([]);
  const inView = useInView(rootRef, { margin: "60px" });
  const particles = useMemo(() => makeParticles(count, seed, tone), [count, seed, tone]);

  useEffect(() => {
    if (prefersReducedMotion()) return;
    const list: Animation[] = [];
    particles.forEach((p, i) => {
      const rise = riseRefs.current[i];
      const sway = swayRefs.current[i];
      const fade = fadeRefs.current[i];
      if (!rise || !sway || !fade) return;
      const dur = p.dur * 1000;
      const delay = -p.phase * dur; // spread the particles along their path from the start
      list.push(
        rise.animate([{ transform: "translate3d(0, 100%, 0)" }, { transform: "translate3d(0, -14%, 0)" }], { duration: dur, delay, iterations: Infinity }),
        sway.animate(
          [
            { transform: `translate3d(${(-p.sway).toFixed(1)}px, 0, 0) rotate(${(-p.spin).toFixed(1)}deg)` },
            { transform: `translate3d(${p.sway.toFixed(1)}px, 0, 0) rotate(${p.spin.toFixed(1)}deg)` },
          ],
          { duration: p.swayDur * 1000, iterations: Infinity, direction: "alternate", easing: "cubic-bezier(0.45, 0, 0.55, 1)" },
        ),
        fade.animate(
          [
            { opacity: 0, offset: 0 },
            { opacity: p.opacity, offset: 0.14 },
            { opacity: p.opacity, offset: 0.82 },
            { opacity: 0, offset: 1 },
          ],
          { duration: dur, delay, iterations: Infinity },
        ),
      );
    });
    anims.current = list;
    list.forEach((a) => a.pause());
    return () => list.forEach((a) => a.cancel());
  }, [particles]);

  useEffect(() => {
    anims.current.forEach((a) => (inView ? a.play() : a.pause()));
  }, [inView]);

  return (
    <div ref={rootRef} aria-hidden data-ornament="particles" className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      {particles.map((p, i) => (
        <span
          key={i}
          ref={(node) => {
            riseRefs.current[i] = node;
          }}
          className="absolute inset-y-0 w-4"
          style={{ left: `${p.x}%`, transform: "translate3d(0, 100%, 0)" }}
        >
          <span
            ref={(node) => {
              swayRefs.current[i] = node;
            }}
            className="absolute top-0 left-0 block"
          >
            <span
              ref={(node) => {
                fadeRefs.current[i] = node;
              }}
              className="block"
              style={{ opacity: 0 }}
            >
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
              {p.kind === "mote" && <span className="block rounded-full" style={{ width: p.size, height: p.size, backgroundColor: p.color }} />}
            </span>
          </span>
        </span>
      ))}
    </div>
  );
}
