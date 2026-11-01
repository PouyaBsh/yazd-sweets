"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useExperience } from "@/components/experience/ExperienceContext";
import { ScrollReactiveCard } from "@/components/kinetic/ScrollReactiveCard";
import { LachakiCardFrame } from "@/components/ornaments";
import { SWEETS_DATA } from "@/data/yazd-content";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { ShowcaseCard } from "./ShowcaseCard";

/**
 * The live card is swapped with <AnimatePresence mode="wait"> (directional 3D transition).
 * The stage height follows the card that is showing — measured with a ResizeObserver and eased
 * with the shared spring — so a short sweet no longer sits on the empty space reserved for the
 * longest one. A lachaki frame wraps the whole stage.
 */
export function StudioStage({ className }: { className?: string }) {
  const { selectedSweetId, direction } = useExperience();
  const sweet = SWEETS_DATA.find((s) => s.id === selectedSweetId) ?? SWEETS_DATA[0];
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">("auto");

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const h = Math.round(entry.borderBoxSize?.[0]?.blockSize ?? el.offsetHeight);
      if (h > 80) setHeight(h); // ignore the instant between two cards
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <ScrollReactiveCard className={cn("min-w-0", className)} lift={0}>
      <LachakiCardFrame radius="rounded-[2rem]" innerRadius="rounded-[1.65rem]" arch={`${sweet.order}/۰۶`}>
        <motion.div
          className="relative min-w-0 [perspective:1600px]"
          data-stage-height
          initial={false}
          animate={{ height }}
          transition={SPRING}
        >
          <div ref={contentRef} className="min-w-0" data-stage-content>
            <AnimatePresence mode="wait" initial={false} custom={direction}>
              <ShowcaseCard key={sweet.id} sweet={sweet} direction={direction} />
            </AnimatePresence>
          </div>
        </motion.div>
      </LachakiCardFrame>
    </ScrollReactiveCard>
  );
}
