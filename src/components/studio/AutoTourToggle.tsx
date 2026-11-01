"use client";

import { motion, useTransform, type MotionValue } from "framer-motion";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface AutoTourToggleProps {
  on: boolean;
  /** false while paused (pointer down, studio off-screen, bento view, detail open). */
  running: boolean;
  /** 0 → 1 over one step; driven by the studio's frame clock, so ring and step never drift. */
  progress: MotionValue<number>;
  onToggle: () => void;
}

/** «گردش خودکار» — switch with a status ring that fills toward the next step. */
export function AutoTourToggle({ on, running, progress, onToggle }: AutoTourToggleProps) {
  const arcOpacity = useTransform(progress, (v) => (v > 0.004 ? 1 : 0));
  return (
    <motion.button
      type="button"
      role="switch"
      aria-checked={on}
      data-tour-toggle
      onClick={onToggle}
      whileTap={{ scale: 0.96 }}
      transition={SPRING}
      className={cn(
        "inline-flex min-h-12 items-center gap-2.5 rounded-full border py-1 ps-1.5 pe-4 text-[13px] font-bold",
        on ? "border-saffron/60 bg-card text-ink" : "border-ink/10 bg-sand/80 text-umber",
      )}
    >
      <span className="relative grid h-9 w-9 place-items-center">
        <svg viewBox="0 0 36 36" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
          <circle cx={18} cy={18} r={15} fill="none" stroke="rgba(28,22,19,0.12)" strokeWidth={2.5} />
          {on && (
            <motion.circle
              data-tour-ring
              data-running={running ? "" : undefined}
              cx={18}
              cy={18}
              r={15}
              fill="none"
              stroke="#D48C29"
              strokeWidth={2.5}
              strokeLinecap="round"
              style={{ pathLength: progress, opacity: arcOpacity }}
            />
          )}
        </svg>
        <motion.span
          className="relative h-2.5 w-2.5 rounded-full"
          animate={on ? { scale: [1, 1.35, 1], backgroundColor: "#D48C29" } : { scale: 1, backgroundColor: "#5E5249" }}
          transition={on ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" } : SPRING}
        />
      </span>
      گردش خودکار
      <span className={cn("relative h-5 w-9 rounded-full p-0.5", on ? "bg-saffron" : "bg-ink/15")}>
        <motion.span layout transition={SPRING} className={cn("block h-4 w-4 rounded-full bg-card", on ? "ms-auto" : "me-auto")} />
      </span>
    </motion.button>
  );
}
