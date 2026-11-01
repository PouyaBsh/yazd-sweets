"use client";

import { AnimatePresence } from "framer-motion";
import { useExperience } from "@/components/experience/ExperienceContext";
import { ScrollReactiveCard } from "@/components/kinetic/ScrollReactiveCard";
import { LachakiCardFrame } from "@/components/ornaments";
import { SWEETS_DATA } from "@/data/yazd-content";
import { cn } from "@/lib/utils";
import { ShowcaseCard, ShowcaseGhost } from "./ShowcaseCard";

/**
 * The stage stacks two layers in one grid cell:
 *   1. an invisible "sizer" holding all six cards → its height is always the tallest card
 *   2. the live card, swapped with <AnimatePresence mode="wait"> (directional 3D transition)
 * so switching sweets never changes the page height. A lachaki frame wraps the whole stage.
 */
export function StudioStage({ className }: { className?: string }) {
  const { selectedSweetId, direction } = useExperience();
  const sweet = SWEETS_DATA.find((s) => s.id === selectedSweetId) ?? SWEETS_DATA[0];

  return (
    <ScrollReactiveCard className={cn("min-w-0", className)} lift={0}>
      <LachakiCardFrame radius="rounded-[2rem]" innerRadius="rounded-[1.65rem]" arch={`${sweet.order}/۰۶`}>
        <div className="relative grid grid-cols-1 [perspective:1600px]" data-stage-height>
          <div aria-hidden inert className="invisible col-start-1 row-start-1 grid min-w-0 grid-cols-1 select-none">
            {SWEETS_DATA.map((s) => (
              <div key={s.id} className="col-start-1 row-start-1 min-w-0">
                <ShowcaseGhost sweet={s} />
              </div>
            ))}
          </div>
          <div className="col-start-1 row-start-1 min-w-0">
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <ShowcaseCard key={sweet.id} sweet={sweet} direction={direction} />
            </AnimatePresence>
          </div>
        </div>
      </LachakiCardFrame>
    </ScrollReactiveCard>
  );
}
