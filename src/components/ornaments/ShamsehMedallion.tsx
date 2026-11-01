"use client";

import { useInView } from "framer-motion";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { useScrollVelocity } from "@/components/kinetic/hooks";
import { prefersReducedMotion } from "@/lib/compositor";
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
 * a slow breathing scale (1 → 1.04 → 1). The rotation and breathing are Web Animations on
 * transform (compositor thread: no per-frame JavaScript); fast scrolling speeds the spin up by
 * nudging playbackRate. Paused off-screen and for prefers-reduced-motion.
 */
export function ShamsehMedallion({ className, tone = "light", period = 90, strokeWidth = 1.1 }: ShamsehMedallionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const breathRef = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "120px" });
  const { boost } = useScrollVelocity();
  const anims = useRef<Animation[]>([]);
  const glowId = `shamseh-glow-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  useEffect(() => {
    if (prefersReducedMotion() || !outerRef.current || !innerRef.current || !breathRef.current) return;
    const ms = period * 1000;
    const list = [
      outerRef.current.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(360deg)" }], { duration: ms, iterations: Infinity }),
      innerRef.current.animate([{ transform: "rotate(0deg)" }, { transform: "rotate(-360deg)" }], { duration: ms / 1.25, iterations: Infinity }),
      breathRef.current.animate([{ transform: "scale(1)" }, { transform: "scale(1.04)" }, { transform: "scale(1)" }], {
        duration: 9000,
        iterations: Infinity,
        easing: "ease-in-out",
      }),
    ];
    list.forEach((a) => a.pause());
    anims.current = list;
    return () => list.forEach((a) => a.cancel());
  }, [period]);

  useEffect(() => {
    anims.current.forEach((a) => (inView ? a.play() : a.pause()));
  }, [inView]);

  // scroll boost: only touch the animations when the (quantised) speed actually changes
  useEffect(() => {
    let last = 1;
    return boost.on("change", (b) => {
      const rate = Math.round((1 + b * 9) * 2) / 2;
      if (rate === last) return;
      last = rate;
      anims.current.slice(0, 2).forEach((a) => {
        if (typeof a.updatePlaybackRate === "function") a.updatePlaybackRate(rate);
        else a.playbackRate = rate;
      });
    });
  }, [boost]);

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
      <div ref={breathRef} className="relative h-full w-full">
        {/* outer ring — clockwise */}
        <div ref={outerRef} data-spin="outer" className="absolute inset-0">
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
        </div>

        {/* middle band — static */}
        {layer(
          "m",
          <>
            <circle cx={200} cy={200} r={140} stroke={c2} strokeWidth={sw} />
            <polygon points={polygonPoints(200, 200, 136, 12)} stroke={c1} strokeWidth={sw * 0.7} />
          </>,
        )}

        {/* inner rosette — counter-clockwise */}
        <div ref={innerRef} data-spin="inner" className="absolute inset-0">
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
        </div>
      </div>
    </div>
  );
}
