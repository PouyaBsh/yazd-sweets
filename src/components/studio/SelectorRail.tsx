"use client";

import { motion } from "framer-motion";
import { ChevronLeft } from "lucide-react";
import { useEffect, useRef, type KeyboardEvent } from "react";
import { AdaptiveImage } from "@/components/AdaptiveImage";
import { useExperience } from "@/components/experience/ExperienceContext";
import { SWEETS_DATA } from "@/data/yazd-content";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

/**
 * Phones/tablets: a sticky (top-14) horizontal pill bar — circular thumbnails, names,
 *                 a spring layoutId indicator, and the active pill auto-centres itself.
 * Desktop (lg):   the vertical selector rail beside the showcase.
 */
export function SelectorRail({ className }: { className?: string }) {
  const { selectedSweetId, selectSweet, stepSweet } = useExperience();
  const listRef = useRef<HTMLDivElement>(null);

  // keep the active pill centred in the horizontal bar (only scrolls the bar, never the page)
  useEffect(() => {
    const list = listRef.current;
    if (!list || list.scrollWidth <= list.clientWidth + 2) return;
    const active = list.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!active) return;
    const lr = list.getBoundingClientRect();
    const ar = active.getBoundingClientRect();
    const delta = ar.left + ar.width / 2 - (lr.left + lr.width / 2);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    list.scrollBy({ left: delta, behavior: reduce ? "auto" : "smooth" });
  }, [selectedSweetId]);

  function focusTab(id: string) {
    requestAnimationFrame(() => listRef.current?.querySelector<HTMLButtonElement>(`#sweet-tab-${id}`)?.focus());
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const index = SWEETS_DATA.findIndex((s) => s.id === selectedSweetId);
    // RTL: ArrowLeft moves forward, ArrowRight moves back.
    if (event.key === "ArrowDown" || event.key === "ArrowLeft") {
      event.preventDefault();
      stepSweet(1);
      focusTab(SWEETS_DATA[(index + 1) % SWEETS_DATA.length].id);
    } else if (event.key === "ArrowUp" || event.key === "ArrowRight") {
      event.preventDefault();
      stepSweet(-1);
      focusTab(SWEETS_DATA[(index - 1 + SWEETS_DATA.length) % SWEETS_DATA.length].id);
    } else if (event.key === "Home") {
      event.preventDefault();
      selectSweet(SWEETS_DATA[0].id);
      focusTab(SWEETS_DATA[0].id);
    } else if (event.key === "End") {
      event.preventDefault();
      const last = SWEETS_DATA[SWEETS_DATA.length - 1].id;
      selectSweet(last);
      focusTab(last);
    }
  }

  return (
    <div
      data-audit-overlay
      className={cn(
        "sticky top-14 z-30 -mx-4 border-b border-ink/[0.06] bg-canvas/90 px-4 py-2 backdrop-blur-md md:-mx-8 md:px-8",
        "lg:top-28 lg:mx-0 lg:self-start lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none",
        className,
      )}
    >
      <div
        ref={listRef}
        role="tablist"
        aria-label="انتخاب شیرینی"
        aria-orientation="horizontal"
        onKeyDown={handleKeyDown}
        className="flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-px-4 scrollbar-none lg:snap-none lg:flex-col lg:overflow-visible lg:rounded-[1.75rem] lg:border lg:border-ink/[0.08] lg:bg-sand/60 lg:p-2"
      >
        {SWEETS_DATA.map((sweet) => {
          const active = sweet.id === selectedSweetId;
          return (
            <motion.button
              key={sweet.id}
              type="button"
              role="tab"
              id={`sweet-tab-${sweet.id}`}
              aria-selected={active}
              aria-controls="sweet-stage"
              tabIndex={active ? 0 : -1}
              data-tour-reset
              onClick={() => selectSweet(sweet.id)}
              whileHover={{ x: active ? 0 : -3 }}
              whileTap={{ scale: 0.96 }}
              transition={SPRING}
              className="relative flex h-12 shrink-0 snap-center items-center gap-2 rounded-full border border-ink/[0.07] bg-card/60 ps-1.5 pe-3.5 text-start lg:h-auto lg:gap-3 lg:rounded-2xl lg:border-transparent lg:bg-transparent lg:p-2.5"
            >
              {active && (
                <motion.span
                  layoutId="rail-active-pill"
                  transition={SPRING}
                  className="absolute inset-0 rounded-full border border-saffron/50 bg-card shadow-ambient lg:rounded-2xl lg:border-ink/[0.08]"
                />
              )}
              <span className="relative hidden w-6 text-center text-xs font-black text-ink lg:block">{sweet.order}</span>
              <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full lg:h-14 lg:w-14 lg:rounded-xl">
                <AdaptiveImage src={sweet.image} alt="" aspectRatio="aspect-square" hoverZoom="self" sizes="56px" />
              </span>
              <span className="relative min-w-0 lg:flex-1 lg:pe-1">
                <span className="block text-sm font-extrabold whitespace-nowrap text-ink lg:text-[15px]">{sweet.name}</span>
                <span className="mt-0.5 hidden text-xs leading-5 text-umber lg:block">{sweet.shortTag}</span>
              </span>
              {active && (
                <motion.span
                  layoutId="rail-active-chevron"
                  transition={SPRING}
                  className="relative ms-auto hidden h-6 w-6 shrink-0 place-items-center rounded-full lg:grid"
                  style={{ backgroundColor: sweet.accentColor, color: "#FAF6F0" }}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
      <p className="mt-3 hidden items-center justify-center gap-2 text-xs text-umber lg:flex">
        <kbd className="rounded-md border border-ink/10 bg-card px-1.5 py-0.5 font-sans text-[11px]">↑</kbd>
        <kbd className="rounded-md border border-ink/10 bg-card px-1.5 py-0.5 font-sans text-[11px]">↓</kbd>
        برای جابه‌جایی میان شیرینی‌ها
      </p>
    </div>
  );
}
