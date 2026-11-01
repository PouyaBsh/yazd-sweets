"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, type PointerEvent, type ReactNode } from "react";
import { SPRING, SPRING_CONFIG } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface MagneticButtonProps {
  href: string;
  children: ReactNode;
  className?: string;
  /** How strongly the button follows the cursor (0–1). */
  strength?: number;
  external?: boolean;
  ariaLabel?: string;
  /** Slow, soft golden light sweep across the button (keeps it alive on touch screens too). */
  sheen?: boolean;
}

/** A link that is gently pulled toward the cursor and springs back on leave. */
export function MagneticButton({ href, children, className, strength = 0.32, external, ariaLabel, sheen }: MagneticButtonProps) {
  const ref = useRef<HTMLAnchorElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, SPRING_CONFIG);
  const sy = useSpring(y, SPRING_CONFIG);
  // Inner label travels a little further for a parallax feel.
  const innerX = useTransform(sx, (v) => v * 0.45);
  const innerY = useTransform(sy, (v) => v * 0.45);

  function handleMove(event: PointerEvent<HTMLAnchorElement>) {
    if (event.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
  }

  function reset() {
    x.set(0);
    y.set(0);
  }

  return (
    <motion.a
      ref={ref}
      href={href}
      aria-label={ariaLabel}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      style={{ x: sx, y: sy }}
      whileTap={{ scale: 0.96 }}
      transition={SPRING}
      className={cn("relative inline-flex select-none items-center justify-center", sheen && "isolate overflow-hidden", className)}
    >
      {sheen && (
        <span
          aria-hidden
          data-sheen
          className="sheen-sweep pointer-events-none absolute inset-y-0 right-0 w-[45%]"
          style={{ background: "linear-gradient(100deg, transparent 0%, rgba(255, 246, 222, 0.5) 50%, transparent 100%)" }}
        />
      )}
      <motion.span style={{ x: innerX, y: innerY }} className="relative z-[1] inline-flex items-center gap-3">
        {children}
      </motion.span>
    </motion.a>
  );
}
