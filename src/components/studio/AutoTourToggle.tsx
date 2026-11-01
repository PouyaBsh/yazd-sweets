"use client";

import { motion } from "framer-motion";
import { SPRING } from "@/lib/motion";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { cn } from "@/lib/utils";

interface AutoTourToggleProps {
  on: boolean;
  /** false while paused (pointer down, studio off-screen, bento view, detail open). */
  running: boolean;
  /** new value → a fresh, empty ring (new step or manual pick) */
  cycleKey: string;
  durationMs: number;
  /** the ring closed → next sweet */
  onStep: () => void;
  onToggle: () => void;
}

/** «گردش خودکار» — switch with a status ring that fills toward the next step (the ring is the timer). */
export function AutoTourToggle({ on, running, cycleKey, durationMs, onStep, onToggle }: AutoTourToggleProps) {
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
        {on ? (
          <ProgressRing
            size={36}
            stroke={2.5}
            color="#D48C29"
            track="rgba(28,22,19,0.12)"
            duration={durationMs}
            cycleKey={cycleKey}
            running={running}
            onDone={onStep}
            className="absolute inset-0"
          />
        ) : (
          <span aria-hidden className="absolute inset-[1.5px] rounded-full border-[2.5px] border-ink/[0.12]" />
        )}
        {/* pulsing dot: CSS keyframes on transform (compositor) */}
        <span className={cn("relative h-2.5 w-2.5 rounded-full", on ? "pulse-dot bg-saffron" : "bg-umber")} />
      </span>
      گردش خودکار
      <span className={cn("relative h-5 w-9 rounded-full p-0.5", on ? "bg-saffron" : "bg-ink/15")}>
        <motion.span layout transition={SPRING} className={cn("block h-4 w-4 rounded-full bg-card", on ? "ms-auto" : "me-auto")} />
      </span>
    </motion.button>
  );
}
