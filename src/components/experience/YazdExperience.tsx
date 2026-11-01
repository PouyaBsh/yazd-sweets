"use client";

import { LayoutGroup, MotionConfig } from "framer-motion";
import { useCallback, useMemo, useState } from "react";
import { SWEETS_DATA } from "@/data/yazd-content";
import { SPRING } from "@/lib/motion";
import { scrollToSection } from "@/lib/utils";
import { ExperienceContext, type Direction, type ExperienceState, type ViewMode } from "./ExperienceContext";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { HeroSection } from "@/components/hero/HeroSection";
import { SweetStudio } from "@/components/studio/SweetStudio";
import { CoffeeSection } from "@/components/coffee/CoffeeSection";
import { BadgirSectionDivider } from "@/components/ornaments";

const indexOf = (id: string) => SWEETS_DATA.findIndex((s) => s.id === id);

/**
 * Client root of the single-page experience.
 * Holds the shared state that links the Hero gallery, the header toggle and the Sweet Studio.
 */
export function YazdExperience() {
  const [selection, setSelection] = useState<{ id: string; direction: Direction }>({ id: SWEETS_DATA[0].id, direction: 1 });
  const [viewMode, setViewMode] = useState<ViewMode>("studio");

  const selectSweet = useCallback((id: string, direction?: Direction) => {
    setSelection((prev) => {
      if (prev.id === id) return prev;
      return { id, direction: direction ?? (indexOf(id) >= indexOf(prev.id) ? 1 : -1) };
    });
  }, []);

  const stepSweet = useCallback((delta: Direction) => {
    setSelection((prev) => {
      const next = (indexOf(prev.id) + delta + SWEETS_DATA.length) % SWEETS_DATA.length;
      return { id: SWEETS_DATA[next].id, direction: delta };
    });
  }, []);

  const focusSweet = useCallback(
    (id: string) => {
      selectSweet(id);
      setViewMode("studio");
      // Let React commit the new selection, then glide down to the studio.
      requestAnimationFrame(() => scrollToSection("sweet-studio"));
    },
    [selectSweet],
  );

  const value = useMemo<ExperienceState>(
    () => ({
      selectedSweetId: selection.id,
      direction: selection.direction,
      selectSweet,
      stepSweet,
      viewMode,
      setViewMode,
      focusSweet,
    }),
    [selection, selectSweet, stepSweet, viewMode, focusSweet],
  );

  return (
    <MotionConfig reducedMotion="user" transition={SPRING}>
      <ExperienceContext.Provider value={value}>
        <LayoutGroup>
          <SiteHeader />
          <main id="top" className="relative min-h-[100dvh] overflow-x-clip">
            <HeroSection />
            <BadgirSectionDivider className="mt-2 md:mt-4" />
            <SweetStudio />
            <BadgirSectionDivider className="mt-2" />
            <CoffeeSection />
          </main>
          <SiteFooter />
        </LayoutGroup>
      </ExperienceContext.Provider>
    </MotionConfig>
  );
}
