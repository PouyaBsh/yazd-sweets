"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import { useCallback, useEffect, useRef, useState, type MouseEvent, type PointerEvent } from "react";
import { useExperience } from "@/components/experience/ExperienceContext";
import { DesertSaffronAmbient, GirihPatternCanvas } from "@/components/ornaments";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { SPRING } from "@/lib/motion";
import { AutoTourToggle } from "./AutoTourToggle";
import { BentoGrid } from "./BentoGrid";
import { SelectorRail } from "./SelectorRail";
import { StudioStage } from "./StudioStage";
import { SweetDetailModal } from "./SweetDetailModal";
import { ViewModeSwitch } from "./ViewModeSwitch";

/** One auto-tour step: the ring fills over exactly this long, then the next sweet comes up. */
const TOUR_MS = 5200;

/** Section 2 — the interactive Sweet Studio (master-detail ⇄ bento) with an optional auto-tour. */
export function SweetStudio() {
  const { viewMode, setViewMode, selectSweet, stepSweet, selectedSweetId } = useExperience();
  const [detailId, setDetailId] = useState<string | null>(null);
  const [tourOn, setTourOn] = useState(false);
  const [pressed, setPressed] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  // "in view" = some part of the studio content sits in the middle half of the screen.
  // (The old `amount: 0.35` of the whole section could never be met on phones, where the
  //  section is ~3 screens tall — one reason the tour looked stuck.)
  const stageInView = useInView(stageRef, { margin: "-25% 0px -25% 0px" });
  // bumping this restarts the ring (and so the step) — e.g. a manual pick of the sweet already showing
  const [tourCycle, setTourCycle] = useState(0);

  const openDetail = useCallback(
    (id: string) => {
      selectSweet(id);
      setDetailId(id);
    },
    [selectSweet],
  );
  const closeDetail = useCallback(() => setDetailId(null), []);

  const resetTour = useCallback(() => setTourCycle((c) => c + 1), []);

  // The tour only pauses while a finger / mouse button is actually down inside the studio
  // (so a sweet never changes mid-drag) — no long "hold" after interactions any more.
  const onPointerDownCapture = (event: PointerEvent) => {
    if ((event.target as HTMLElement).closest("[data-tour-toggle]")) return;
    setPressed(true);
  };
  useEffect(() => {
    if (!pressed) return;
    const release = () => setPressed(false);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release); // touch-scroll takes over → resume at once
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, [pressed]);

  // a manual pick restarts the countdown — even when it is the sweet already showing
  const onClickCapture = (event: MouseEvent) => {
    if ((event.target as HTMLElement).closest("[data-tour-reset]")) resetTour();
  };

  const touring = tourOn && !pressed && stageInView && viewMode === "studio" && detailId === null;

  // The ring in the toggle is the clock (a compositor animation): it restarts whenever the selected
  // sweet changes for any reason (its cycleKey contains the id), pauses with `touring`, and when it
  // closes the next sweet comes up (wrapping 6 → 1).

  return (
    <section
      id="sweet-studio"
      data-anim-scope
      aria-labelledby="studio-title"
      onPointerDownCapture={onPointerDownCapture}
      onClickCapture={onClickCapture}
      className="cv-auto relative isolate mx-auto max-w-[1320px] scroll-mt-14 px-4 pt-10 pb-10 md:scroll-mt-24 md:px-8 md:pt-14 md:pb-12"
    >
      <DesertSaffronAmbient motifs={false} className="-inset-x-24" />
      <GirihPatternCanvas className="-z-10" />

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
        <SectionHeading
          index="۰۲"
          eyebrow="استودیو شیرینی‌ها"
          title="شش سفیر طعم یزد"
          id="studio-title"
          description="یکی از شیرینی‌ها را انتخاب کنید یا روی تصویر بکشید تا روایت، مواد، بافت و میزان شیرینی‌اش را ببینید."
        />
        <div className="flex flex-wrap items-center gap-2">
          <AutoTourToggle
            on={tourOn}
            running={touring}
            cycleKey={`${selectedSweetId}-${tourCycle}`}
            durationMs={TOUR_MS}
            onStep={() => stepSweet(1)}
            onToggle={() => {
              resetTour();
              setTourOn((v) => !v);
            }}
          />
          <ViewModeSwitch value={viewMode} onChange={setViewMode} />
        </div>
      </div>

      <div ref={stageRef} className="relative mt-6 md:mt-8">
        <AnimatePresence mode="popLayout" initial={false}>
          {viewMode === "studio" ? (
            <motion.div
              key="studio"
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={SPRING}
              className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-5"
            >
              <SelectorRail className="min-w-0 lg:col-span-4 xl:col-span-3" />
              <StudioStage className="lg:col-span-8 xl:col-span-9" />
            </motion.div>
          ) : (
            <motion.div key="bento" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={SPRING}>
              <BentoGrid onOpen={openDetail} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <SweetDetailModal sweetId={detailId} onClose={closeDetail} onNavigate={openDetail} />
    </section>
  );
}
