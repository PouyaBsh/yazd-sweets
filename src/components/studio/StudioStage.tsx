"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useExperience } from "@/components/experience/ExperienceContext";
import { useMediaQuery } from "@/components/kinetic/hooks";
import { ScrollReactiveCard } from "@/components/kinetic/ScrollReactiveCard";
import { LachakiCardFrame } from "@/components/ornaments";
import { SWEETS_DATA } from "@/data/yazd-content";
import { SPRING, SPRING_GLIDE } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { SHELL_CLASSES, ShowcaseCard, ShowcaseDissolve } from "./ShowcaseCard";

/**
 * Desktop: the live card is swapped with <AnimatePresence mode="wait"> (directional 3D turn).
 * Phones: one card shell stays in place and only its content dissolves, like the hero slider —
 * the new sweet fades in over the old one, no turning, no gap between the two.
 *
 * Either way the stage height follows the sweet that is showing — measured with a
 * ResizeObserver and eased with a spring — so a short sweet never sits on the empty space
 * reserved for the longest one. A lachaki frame wraps the whole stage.
 */
export function StudioStage({ className }: { className?: string }) {
  const { selectedSweetId, direction } = useExperience();
  const compact = useMediaQuery("(max-width: 767px)");
  const sweet = SWEETS_DATA.find((s) => s.id === selectedSweetId) ?? SWEETS_DATA[0];
  const contentRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">("auto");

  // re-attach when the layout switches between the phone and desktop stage
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const h = Math.round(entry.borderBoxSize?.[0]?.blockSize ?? el.offsetHeight);
      if (h > 80) setHeight(h); // ignore the instant between two cards
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [compact]);

  return (
    <ScrollReactiveCard className={cn("min-w-0", className)} lift={0}>
      <LachakiCardFrame radius="rounded-[2rem]" innerRadius="rounded-[1.65rem]" arch={`${sweet.order}/۰۶`}>
        {compact ? (
          <motion.div
            id="sweet-stage"
            role="tabpanel"
            aria-labelledby={`sweet-tab-${sweet.id}`}
            className={SHELL_CLASSES}
            // clip, not hidden: an overflow:hidden box is still a scroll container, so focus /
            // scrollIntoView could slide the content sideways under the accent glow (RTL overflow)
            style={{ overflow: "clip" }}
            data-stage-height
            initial={false}
            animate={{ height }}
            transition={SPRING_GLIDE}
          >
            <div ref={contentRef} className="relative min-w-0" data-stage-content>
              <AnimatePresence initial={false}>
                <ShowcaseDissolve key={sweet.id} sweet={sweet} />
              </AnimatePresence>
            </div>
          </motion.div>
        ) : (
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
        )}
      </LachakiCardFrame>
    </ScrollReactiveCard>
  );
}
