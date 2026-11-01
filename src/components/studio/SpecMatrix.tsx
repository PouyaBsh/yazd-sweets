"use client";

import { AnimatePresence, motion, type Variants } from "framer-motion";
import { Feather, Gauge, Layers, Nut, Wheat, type LucideIcon } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { SweetItem } from "@/data/yazd-content";
import { SPRING } from "@/lib/motion";
import { cn, hexToRgba, splitIngredients } from "@/lib/utils";
import { SweetnessGauge } from "./SweetnessGauge";

const cascade: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.12 } },
};

const cellIn: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: SPRING },
};

function SpecCell({
  icon: Icon,
  label,
  className,
  ghost,
  children,
}: {
  icon: LucideIcon;
  label: string;
  className?: string;
  ghost?: boolean;
  children: ReactNode;
}) {
  return (
    <motion.div
      variants={ghost ? undefined : cellIn}
      whileTap={ghost ? undefined : { scale: 0.95 }}
      tabIndex={-1}
      transition={SPRING}
      className={cn("flex min-w-0 flex-col rounded-2xl border border-ink/[0.08] bg-canvas/75 p-3 sm:p-4", className)}
    >
      <div className="flex items-center gap-1.5 text-xs font-bold text-umber">
        <Icon className="h-4 w-4 shrink-0" strokeWidth={1.7} />
        {label}
      </div>
      <div className="mt-2.5 flex flex-1 flex-col">{children}</div>
    </motion.div>
  );
}

/** Tactile ingredient pill — stagger-pops in, lifts on hover, ripples on tap. */
function IngredientPill({ item, accent, ghost, index }: { item: string; accent: string; ghost?: boolean; index: number }) {
  const [ripples, setRipples] = useState<number[]>([]);
  const rippleColor = index % 2 === 0 ? "rgba(29, 106, 115, 0.32)" : hexToRgba(accent, 0.4);

  return (
    <motion.li
      variants={ghost ? undefined : { hidden: { opacity: 0, y: 6, scale: 0.85 }, show: { opacity: 1, y: 0, scale: 1, transition: SPRING } }}
      whileHover={ghost ? undefined : { y: -2, scale: 1.04, backgroundColor: hexToRgba(accent, 0.16) }}
      whileTap={ghost ? undefined : { scale: 0.92 }}
      onTap={ghost ? undefined : () => setRipples((r) => [...r, Date.now()])}
      tabIndex={-1}
      transition={SPRING}
      style={{ backgroundColor: "rgba(242, 234, 224, 0.95)" }}
      className="relative cursor-default overflow-hidden rounded-full border border-ink/[0.08] px-2.5 py-1 text-[11.5px] leading-relaxed font-medium text-ink sm:text-[12.5px]"
    >
      <span className="relative z-[1]">{item}</span>
      <AnimatePresence>
        {ripples.map((id) => (
          <motion.span
            key={id}
            aria-hidden
            className="absolute inset-0 m-auto aspect-square w-full rounded-full"
            style={{ backgroundColor: rippleColor }}
            initial={{ scale: 0, opacity: 0.9 }}
            animate={{ scale: 2.2, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            onAnimationComplete={() => setRipples((r) => r.filter((x) => x !== id))}
          />
        ))}
      </AnimatePresence>
    </motion.li>
  );
}

interface SpecMatrixProps {
  sweet: SweetItem;
  ghost?: boolean;
  /** "wide" → 2×2 on mobile, 4 columns on xl · "narrow" → 2×2 / 3 columns (detail modal). */
  layout?: "wide" | "narrow";
  /** Skip the cell / pill stagger (phones: the whole card already dissolves in as one piece). */
  calm?: boolean;
  className?: string;
}

/** «ویژگی‌های این شیرینی» — living 4-part metadata grid (compact 2×2 on phones). */
export function SpecMatrix({ sweet, ghost, calm, layout = "wide", className }: SpecMatrixProps) {
  const { specs, accentColor } = sweet;
  const ingredients = splitIngredients(specs.mainIngredients);

  return (
    <div className={className}>
      <div className="mb-2.5 flex items-center gap-3">
        <h4 className="text-sm font-extrabold text-ink">ویژگی‌های این شیرینی</h4>
        <span aria-hidden className="h-px flex-1 bg-ink/10" />
      </div>

      <motion.div
        variants={ghost ? undefined : cascade}
        initial={ghost || calm ? false : "hidden"}
        animate="show"
        className={cn("grid grid-cols-2 gap-2.5 sm:gap-3", layout === "wide" ? "xl:grid-cols-4" : "sm:grid-cols-3")}
      >
        <SpecCell icon={Wheat} label="مواد اصلی" ghost={ghost} className={layout === "narrow" ? "col-span-2 sm:col-span-3" : ""}>
          <motion.ul className="flex flex-wrap gap-1.5" aria-label={specs.mainIngredients} variants={ghost ? undefined : cascade}>
            {ingredients.map((item, i) => (
              <IngredientPill key={item} item={item} accent={accentColor} ghost={ghost} index={i} />
            ))}
          </motion.ul>
        </SpecCell>

        <SpecCell icon={Layers} label="بافت" ghost={ghost}>
          <div className="flex items-start gap-2 rounded-xl bg-sand/80 p-2 sm:gap-2.5 sm:p-2.5">
            <span
              className="grid h-7 w-7 shrink-0 place-items-center rounded-lg"
              style={{ backgroundColor: hexToRgba(accentColor, 0.16), color: accentColor }}
            >
              <Feather className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            <span className="text-xs leading-relaxed font-semibold text-ink sm:text-[13px]">{specs.texture}</span>
          </div>
        </SpecCell>

        <SpecCell icon={Gauge} label="میزان شیرینی" ghost={ghost}>
          <SweetnessGauge level={specs.sweetnessLevel} label={specs.sweetnessLabel} accent={accentColor} ghost={ghost} />
        </SpecCell>

        <SpecCell icon={Nut} label="نوع مغز" ghost={ghost} className={layout === "narrow" ? "col-span-2 sm:col-span-1" : ""}>
          <div
            className="flex items-start gap-2 rounded-xl border p-2 sm:gap-2.5 sm:p-2.5"
            style={{ backgroundColor: hexToRgba(accentColor, 0.1), borderColor: hexToRgba(accentColor, 0.3) }}
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg text-canvas" style={{ backgroundColor: accentColor }}>
              <Nut className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
            <span className="text-xs leading-relaxed font-semibold text-ink sm:text-[13px]">{specs.nutType}</span>
          </div>
        </SpecCell>
      </motion.div>
    </div>
  );
}
