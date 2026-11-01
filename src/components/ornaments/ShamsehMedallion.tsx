"use client";

import { motion, useAnimationFrame, useInView, useMotionValue, useReducedMotion } from "framer-motion";
import { useId, useRef, type ReactNode } from "react";
import { useScrollVelocity } from "@/components/kinetic/hooks";
import { cn } from "@/lib/utils";
import { ORNAMENT, polygonPoints, ringPositions, starPoints } from "./geometry";

interface ShamsehMedallionProps {
  className?: string;
  /** light: terracotta/saffron/turquoise hairlines · gold: glowing copper-gold watermark for dark grounds */
  tone?: "light" | "gold";
  /** Seconds per full revolution of the outer ring. */
  period?: number;
  /** Stroke width in viewBox units (viewBox is 400). */
  strokeWidth?: number;
}

/**
 * Shamseh (شمسه) — 16-point outer star, 12-point inner rosette, counter-rotating rings,
 * a slow breathing scale (1 → 1.04 → 1). Paused off-screen and for prefers-reduced-motion.
 * Fast scrolling temporarily accelerates the spin.
 */
export function ShamsehMedallion({ className, tone = "light", period = 90, strokeWidth = 1.1 }: ShamsehMedallionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "120px" });
  const reduced = useReducedMotion();
  const { boost } = useScrollVelocity();
  const outer = useMotionValue(0);
  const inner = useMotionValue(0);
  const breath = useMotionValue(1);
  const angle = useRef(0);
  const glowId = `shamseh-glow-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  useAnimationFrame((time, delta) => {
    if (reduced || !inView) return;
    const dt = Math.min(delta, 64);
    angle.current += dt * (360 / (period * 1000)) * (1 + boost.get() * 9);
    outer.set(angle.current);
    inner.set(-angle.current * 1.25);
    breath.set(1 + 0.02 * (1 - Math.cos((time / 9000) * Math.PI * 2)));
  });

  const gold = tone === "gold";
  const c1 = gold ? ORNAMENT.copper : ORNAMENT.terracotta;
  const c2 = gold ? ORNAMENT.gold : ORNAMENT.saffron;
  const c3 = gold ? ORNAMENT.gold : ORNAMENT.firuzeh;
  const sw = strokeWidth;

  /* Each ring is its own SVG on its own HTML layer: rotating an HTML layer is a pure
     compositor transform (rasterised once), whereas rotating an SVG <g> repaints the
     whole medallion every frame. */
  const layer = (id: string, body: ReactNode) => (
    <svg viewBox="0 0 400 400" className="absolute inset-0 h-full w-full overflow-visible">
      {gold && (
        <defs>
          <filter id={`${glowId}-${id}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="2.4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
      )}
      <g filter={gold ? `url(#${glowId}-${id})` : undefined} fill="none">
        {body}
      </g>
    </svg>
  );

  return (
    <div ref={ref} aria-hidden data-ornament="shamseh" className={cn("pointer-events-none select-none", className)}>
      <motion.div className="relative h-full w-full will-change-transform" style={{ scale: breath }}>
        {/* outer ring — clockwise */}
        <motion.div data-spin="outer" className="absolute inset-0 will-change-transform" style={{ rotate: outer }}>
          {layer(
            "o",
            <>
              <circle cx={200} cy={200} r={196} stroke={c1} strokeWidth={sw} />
              <circle cx={200} cy={200} r={188} stroke={c2} strokeWidth={sw * 0.7} strokeDasharray="1 7" strokeLinecap="round" />
              <polygon points={starPoints(200, 200, 182, 16, 0.84)} stroke={c1} strokeWidth={sw} />
              <polygon points={starPoints(200, 200, 168, 16, 0.86, -90 + 11.25)} stroke={c2} strokeWidth={sw * 0.8} />
              {ringPositions(200, 200, 176, 16).map((pt, i) => (
                <circle key={i} cx={pt.x} cy={pt.y} r={2.6} fill={c3} stroke="none" opacity={0.85} />
              ))}
              {ringPositions(200, 200, 150, 32).map((pt, i) => (
                <line
                  key={`r${i}`}
                  x1={200 + (pt.x - 200) * 0.93}
                  y1={200 + (pt.y - 200) * 0.93}
                  x2={pt.x}
                  y2={pt.y}
                  stroke={c1}
                  strokeWidth={sw * 0.6}
                />
              ))}
            </>,
          )}
        </motion.div>

        {/* middle band — static */}
        {layer(
          "m",
          <>
            <circle cx={200} cy={200} r={140} stroke={c2} strokeWidth={sw} />
            <polygon points={polygonPoints(200, 200, 136, 12)} stroke={c1} strokeWidth={sw * 0.7} />
          </>,
        )}

        {/* inner rosette — counter-clockwise */}
        <motion.div data-spin="inner" className="absolute inset-0 will-change-transform" style={{ rotate: inner }}>
          {layer(
            "i",
            <>
              <polygon points={starPoints(200, 200, 128, 12, 0.7)} stroke={c1} strokeWidth={sw} />
              <polygon points={starPoints(200, 200, 98, 12, 0.66, -90 + 15)} stroke={c3} strokeWidth={sw * 0.9} />
              <rect x={137} y={137} width={126} height={126} stroke={c2} strokeWidth={sw * 0.8} />
              <rect x={137} y={137} width={126} height={126} stroke={c2} strokeWidth={sw * 0.8} transform="rotate(45 200 200)" />
              <circle cx={200} cy={200} r={52} stroke={c1} strokeWidth={sw} />
              {ringPositions(200, 200, 34, 8).map((pt, i) => (
                <ellipse
                  key={i}
                  cx={pt.x}
                  cy={pt.y}
                  rx={13}
                  ry={5.5}
                  transform={`rotate(${pt.angle} ${pt.x} ${pt.y})`}
                  stroke={c2}
                  strokeWidth={sw * 0.8}
                />
              ))}
              <polygon points={starPoints(200, 200, 16, 8, 0.55)} fill={c3} stroke="none" opacity={0.8} />
            </>,
          )}
        </motion.div>
      </motion.div>
    </div>
  );
}
