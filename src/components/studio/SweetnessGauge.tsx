"use client";

import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { SPRING } from "@/lib/motion";
import { cn, toFa } from "@/lib/utils";

interface SweetnessGaugeProps {
  level: number;
  label?: string;
  accent: string;
  /** Static render (used by invisible height sizers). */
  ghost?: boolean;
  compact?: boolean;
  /** Periodic saffron shimmer wave across the filled segments. */
  shimmer?: boolean;
  className?: string;
}

/**
 * 5-segment sweetness meter. Segments fill right→left (RTL) with a staggered spring each time
 * a sweet becomes active, then a soft saffron shimmer wave keeps travelling across them.
 */
export function SweetnessGauge({ level, label, accent, ghost, compact, shimmer = true, className }: SweetnessGaugeProps) {
  const clamped = Math.max(1, Math.min(5, Math.round(level)));
  return (
    <div className={className}>
      {!compact && (
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs leading-relaxed font-bold text-ink sm:text-sm">{label}</span>
          <span className="shrink-0 text-xs text-umber">{toFa(clamped)} از ۵</span>
        </div>
      )}
      <div
        role="meter"
        aria-valuemin={1}
        aria-valuemax={5}
        aria-valuenow={clamped}
        aria-label={label ? `میزان شیرینی: ${label}` : `میزان شیرینی ${toFa(clamped)} از ۵`}
        className={cn("flex gap-1.5", compact ? "mt-0" : "mt-2.5")}
      >
        {Array.from({ length: 5 }, (_, i) => {
          const filled = i < clamped;
          return (
            <div key={i} className={cn("relative flex-1 overflow-hidden rounded-full bg-ink/[0.08]", compact ? "h-1.5" : "h-2.5")}>
              {ghost ? null : (
                <>
                  <motion.span
                    className="absolute inset-0 origin-right rounded-full"
                    style={{ backgroundColor: accent }}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: filled ? 1 : 0 }}
                    transition={{ ...SPRING, delay: 0.18 + i * 0.075 }}
                  />
                  {filled && shimmer && (
                    <span
                      aria-hidden
                      data-shimmer
                      className="gauge-shimmer absolute inset-y-0 right-0 w-2/3 rounded-full"
                      style={
                        {
                          background: "linear-gradient(90deg, transparent, rgba(255, 236, 196, 0.85), transparent)",
                          "--delay": `${(1.1 + i * 0.12).toFixed(2)}s`,
                        } as CSSProperties
                      }
                    />
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
