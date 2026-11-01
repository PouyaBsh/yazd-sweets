"use client";

import { motion } from "framer-motion";
import { Columns2, LayoutGrid } from "lucide-react";
import type { ViewMode } from "@/components/experience/ExperienceContext";
import { SPRING } from "@/lib/motion";

const OPTIONS = [
  { id: "studio" as const, label: "نمای استودیویی تعاملی", icon: Columns2 },
  { id: "bento" as const, label: "نمای شبکه‌ای", icon: LayoutGrid },
];

/** Segmented control with a gliding shared-layout pill. */
export function ViewModeSwitch({ value, onChange }: { value: ViewMode; onChange: (mode: ViewMode) => void }) {
  return (
    <div
      role="radiogroup"
      aria-label="حالت نمایش استودیو"
      className="inline-flex w-full items-center gap-1 rounded-full border border-ink/[0.08] bg-sand/80 p-1 sm:w-auto"
    >
      {OPTIONS.map(({ id, label, icon: Icon }) => {
        const active = value === id;
        return (
          <motion.button
            key={id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(id)}
            whileTap={{ scale: 0.97 }}
            transition={SPRING}
            className="relative flex min-h-12 flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-[12px] font-bold whitespace-nowrap sm:flex-none sm:px-4 sm:text-[13px]"
          >
            {active && (
              <motion.span
                layoutId="studio-mode-pill"
                transition={SPRING}
                className="absolute inset-0 rounded-full border border-ink/[0.08] bg-card shadow-ambient"
              />
            )}
            <motion.span
              className="relative flex items-center gap-2"
              animate={{ color: active ? "#1C1613" : "#5E5249" }}
              transition={SPRING}
            >
              <Icon className="hidden h-4 w-4 sm:block" strokeWidth={1.8} />
              {label}
            </motion.span>
          </motion.button>
        );
      })}
    </div>
  );
}
