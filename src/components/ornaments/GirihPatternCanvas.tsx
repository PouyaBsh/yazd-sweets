"use client";

import { motion, useInView, useTransform } from "framer-motion";
import { useId, useRef } from "react";
import { useScrollVelocity } from "@/components/kinetic/hooks";
import { cn } from "@/lib/utils";
import { ORNAMENT, starPoints } from "./geometry";

const T = 96; // tile size

interface GirihPatternCanvasProps {
  tone?: "light" | "dark";
  className?: string;
  /** Radial vignette so the lattice fades out near dense body copy. */
  vignette?: boolean;
  /** Scroll parallax factor (0 = static). */
  parallax?: number;
  /** Override the calibrated opacity (light 0.065 / dark 0.09). */
  opacity?: number;
}

/**
 * Repeating architectural lattice inspired by Yazd's Fakhr-o-Madin brickwork and girih-chini:
 * khatam stars joined by a turquoise lattice, saffron rosettes and corner lozenges,
 * terracotta brick accents. Hairline strokes, scroll parallax, velocity-reactive depth.
 */
export function GirihPatternCanvas({ tone = "light", className, vignette = true, parallax = 0.06, opacity }: GirihPatternCanvasProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const rootRef = useRef<HTMLDivElement>(null);
  const near = useInView(rootRef, { margin: "25% 0px 25% 0px" });
  const { scrollY, velocity } = useScrollVelocity();
  // seamless parallax (pattern repeats every T px) + a little extra depth shift while scrolling fast
  const y = useTransform([scrollY, velocity], ([s, v]: number[]) => -((s * parallax) % T) + Math.max(-18, Math.min(18, v * 0.008)));

  // an ellipse sized to the box (closest-side) reaches full transparency on every edge — the old
  // circle only did so at the corners, so the lattice ended in a faint straight seam top / bottom
  const mask = vignette ? "radial-gradient(closest-side at center, black 45%, transparent 100%)" : undefined;
  const sw = 0.75;

  return (
    <div
      ref={rootRef}
      aria-hidden
      data-ornament="girih"
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      style={{ opacity: opacity ?? (tone === "dark" ? 0.09 : 0.065), maskImage: mask, WebkitMaskImage: mask }}
    >
      <motion.svg style={{ y: near ? y : 0 }} className="absolute inset-x-0 -top-28 h-[calc(100%+14rem)] w-full" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id={`girih-${id}`} width={T} height={T} patternUnits="userSpaceOnUse">
            {/* khatam: two interlaced squares (terracotta) */}
            <g fill="none" stroke={ORNAMENT.terracotta} strokeWidth={sw}>
              <rect x={31} y={31} width={34} height={34} />
              <rect x={31} y={31} width={34} height={34} transform={`rotate(45 48 48)`} />
              <polygon points={starPoints(48, 48, 15, 8, 0.72, -90 + 22.5)} />
            </g>
            {/* turquoise lattice joining stars to their neighbours */}
            <g stroke={ORNAMENT.firuzeh} strokeWidth={sw} fill="none">
              <path d="M48 24V0M48 72v24M24 48H0M72 48h24" />
              <path d="M31 31 5 5M65 31 91 5M31 65 5 91M65 65 91 91" />
              <path d="M48 0 58 10 48 20 38 10ZM48 96l10-10-10-10-10 10Z" />
              <path d="M0 48l10-10 10 10-10 10ZM96 48l-10-10-10 10 10 10Z" />
            </g>
            {/* saffron rosette + corner lozenges (become full diamonds when tiled) */}
            <g stroke={ORNAMENT.saffron} strokeWidth={sw} fill="none">
              <circle cx={48} cy={48} r={7} />
              <path d="M0-10 10 0 0 10-10 0Z" transform="translate(0 0)" />
              <path d="M0-10 10 0 0 10-10 0Z" transform={`translate(${T} 0)`} />
              <path d="M0-10 10 0 0 10-10 0Z" transform={`translate(0 ${T})`} />
              <path d="M0-10 10 0 0 10-10 0Z" transform={`translate(${T} ${T})`} />
            </g>
            {/* terracotta brick (khesht) accents — Fakhr-o-Madin bond */}
            <g stroke={ORNAMENT.terracotta} strokeWidth={sw} fill="none">
              <path d="M18 70h10v6H18zM68 20h10v6H68zM18 20h10v6H18zM68 70h10v6H68z" />
            </g>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#girih-${id})`} />
      </motion.svg>
    </div>
  );
}
