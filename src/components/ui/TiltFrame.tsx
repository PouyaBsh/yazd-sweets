"use client";

import { motion, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, type PointerEvent, type ReactNode } from "react";
import { SPRING_CONFIG } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface TiltFrameProps {
  children: ReactNode;
  className?: string;
  /** Rounded class applied to the tilting surface so the glare follows the same corners. */
  rounded?: string;
  /** Max rotation in degrees (spec: -6deg … 6deg). */
  max?: number;
  disabled?: boolean;
  glare?: boolean;
}

/**
 * 3D perspective tilt that follows the cursor, with a soft specular glare.
 * Mouse only — touch and pen keep the frame flat so scrolling stays natural.
 */
export function TiltFrame({
  children,
  className,
  rounded = "rounded-[1.75rem]",
  max = 6,
  disabled,
  glare = true,
}: TiltFrameProps) {
  const surfaceRef = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, SPRING_CONFIG);
  const sy = useSpring(py, SPRING_CONFIG);
  const rotateY = useTransform(sx, [0, 1], [-max, max]);
  const rotateX = useTransform(sy, [0, 1], [max, -max]);
  const glareX = useTransform(sx, (v) => `${(v * 100).toFixed(1)}%`);
  const glareY = useTransform(sy, (v) => `${(v * 100).toFixed(1)}%`);
  const glareOpacity = useSpring(0, SPRING_CONFIG);
  const glareBackground = useMotionTemplate`radial-gradient(120% 90% at ${glareX} ${glareY}, rgba(255, 248, 236, 0.42), rgba(255, 248, 236, 0) 52%)`;

  function handleMove(event: PointerEvent<HTMLDivElement>) {
    if (disabled || event.pointerType !== "mouse" || !surfaceRef.current) return;
    const rect = surfaceRef.current.getBoundingClientRect();
    px.set(Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)));
    py.set(Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)));
    glareOpacity.set(1);
  }

  function handleLeave() {
    px.set(0.5);
    py.set(0.5);
    glareOpacity.set(0);
  }

  return (
    <div className={cn("relative [perspective:1100px]", className)} onPointerMove={handleMove} onPointerLeave={handleLeave}>
      <motion.div
        ref={surfaceRef}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
        className={cn("relative h-full w-full overflow-hidden will-change-transform", rounded)}
      >
        {children}
        {glare && (
          <motion.div
            aria-hidden
            className={cn("pointer-events-none absolute inset-0 z-10 mix-blend-soft-light", rounded)}
            style={{ backgroundImage: glareBackground, opacity: glareOpacity }}
          />
        )}
      </motion.div>
    </div>
  );
}
