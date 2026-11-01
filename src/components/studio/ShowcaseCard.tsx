"use client";

import { motion, useIsPresent, type PanInfo, type Transition, type Variants } from "framer-motion";
import type { CSSProperties } from "react";
import { ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { AdaptiveImage } from "@/components/AdaptiveImage";
import { useExperience, type Direction } from "@/components/experience/ExperienceContext";
import { Kinetic3DShowcase } from "@/components/kinetic/Kinetic3DShowcase";
import { ShamsehMedallion } from "@/components/ornaments";
import { SWEETS_DATA, type SweetItem } from "@/data/yazd-content";
import { SPRING, SPRING_DRIFT } from "@/lib/motion";
import { cn, hexToRgba, toFa } from "@/lib/utils";
import { SpecMatrix } from "./SpecMatrix";

const CARD_CLASSES = "relative overflow-hidden rounded-[2rem] bg-card p-4 shadow-ambient sm:p-5 md:p-7";

/** RTL: the next sweet enters from the left and the current one leaves to the right, turning in 3D. */
const cardVariants: Variants = {
  enter: (d: Direction) => ({ opacity: 0, x: d * -64, rotateY: d * -24, scale: 0.98 }),
  center: { opacity: 1, x: 0, rotateY: 0, scale: 1, transition: SPRING },
  exit: (d: Direction) => ({ opacity: 0, x: d * 64, rotateY: d * 24, scale: 0.98, transition: SPRING }),
};

/**
 * Phones: hero-slider style dissolve. The new sweet fades in on an over-damped spring (no
 * overshoot, no blink) with a faint 1.02 → 1 drift, while the old one fades out a little
 * faster underneath — opacity + transform only, so the compositor runs it.
 */
const CONTENT_DISSOLVE: Transition = { type: "spring", stiffness: 80, damping: 21, restDelta: 0.0005 };
const CONTENT_OUT: Transition = { duration: 0.32, ease: [0.4, 0, 0.2, 1] };

const SWIPE_DISTANCE = 70;

function ImageStage({ sweet }: { sweet: SweetItem }) {
  const { stepSweet } = useExperience();

  function handleDragEnd(_: unknown, info: PanInfo) {
    // RTL: a rightward swipe reveals the next sweet (which lives to the left)
    if (info.offset.x > SWIPE_DISTANCE || info.velocity.x > 550) stepSweet(1);
    else if (info.offset.x < -SWIPE_DISTANCE || info.velocity.x < -550) stepSweet(-1);
  }

  return (
    <div className="relative">
      {/* Shamseh halo framing the sweet */}
      <ShamsehMedallion className="absolute top-1/2 left-1/2 z-0 aspect-square w-[118%] -translate-x-1/2 -translate-y-1/2 opacity-[0.28]" period={70} />

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.42}
        dragMomentum={false}
        whileDrag={{ cursor: "grabbing" }}
        onDragEnd={handleDragEnd}
        className="relative z-10 cursor-grab touch-pan-y"
      >
        <Kinetic3DShowcase kineticId="showcase" className="aspect-[4/3] w-full md:aspect-[4/5]" rounded="rounded-[1.6rem]">
          <AdaptiveImage src={sweet.image} alt={sweet.imageAlt} aspectRatio="h-full" hoverZoom="self" eager sizes="(max-width: 640px) 256px, 34vw" />
          <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[1.6rem] ring-1 ring-ink/10 ring-inset" />
          <motion.span
            className="absolute top-3 right-3 z-20 sm:top-4 sm:right-4"
            initial={{ opacity: 0, y: -8, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ ...SPRING, delay: 0.25 }}
          >
            {/* entrance = spring (above) · idle bob = compositor CSS loop (below) */}
            <span
              className="float-y inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-card/95 px-3 py-1.5 text-xs font-bold text-ink"
              style={{ "--float-d": "4px", "--float-dur": "4.5s", "--float-delay": "0.6s" } as CSSProperties}
            >
              <Sparkles className="h-3.5 w-3.5" style={{ color: sweet.accentColor }} />
              {sweet.shortTag}
            </span>
          </motion.span>
        </Kinetic3DShowcase>

        {/* explicit 48×48 previous / next controls on the frame */}
        <motion.button
          type="button"
          onClick={() => stepSweet(-1)}
          whileHover={{ x: 2 }}
          whileTap={{ scale: 0.9 }}
          transition={SPRING}
          aria-label="شیرینی قبلی"
          className="absolute top-1/2 right-2 z-30 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-ink/10 bg-card/95 text-ink sm:right-3"
        >
          <ChevronRight className="h-5 w-5" />
          <span className="sr-only">قبلی</span>
        </motion.button>
        <motion.button
          type="button"
          onClick={() => stepSweet(1)}
          whileHover={{ x: -2 }}
          whileTap={{ scale: 0.9 }}
          transition={SPRING}
          aria-label="شیرینی بعدی"
          className="absolute top-1/2 left-2 z-30 grid h-12 w-12 -translate-y-1/2 place-items-center rounded-full border border-ink/10 bg-card/95 text-ink sm:left-3"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="sr-only">بعدی</span>
        </motion.button>
      </motion.div>
    </div>
  );
}

function ShowcaseBody({ sweet, ghost, calm }: { sweet: SweetItem; ghost?: boolean; calm?: boolean }) {
  const total = toFa(String(SWEETS_DATA.length).padStart(2, "0"));
  return (
    <>
      <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] md:gap-8">
        {/* narrative — first in DOM so it sits on the right in RTL */}
        <div className="order-2 flex flex-col md:order-1">
          <div className="flex items-center gap-3 text-[13px] text-umber">
            <span className="inline-flex items-center gap-1.5 font-black text-ink">
              <span aria-hidden className="h-2 w-2 rounded-full" style={{ backgroundColor: sweet.accentColor }} />
              {sweet.order}
            </span>
            <span aria-hidden className="h-px w-10 bg-ink/15" />
            <span>
              شیرینی {sweet.order} از {total}
            </span>
          </div>
          <h3 className="mt-2.5 text-[1.45rem] leading-[1.4] font-black text-ink sm:text-[1.65rem] md:text-[2rem] text-balance-fa">{sweet.title}</h3>
          <p className="copy-fa mt-3.5 text-pretty-fa md:mt-5">{sweet.description}</p>
        </div>

        <div className="order-1 md:order-2">
          {ghost ? <div className="aspect-[4/3] w-full md:aspect-[4/5]" /> : <ImageStage sweet={sweet} />}
        </div>
      </div>

      <SpecMatrix sweet={sweet} ghost={ghost} calm={calm} className="mt-5 md:mt-8" />
    </>
  );
}

/** Dynamic showcase card for the selected sweet — directional 3D slide/flip via AnimatePresence. */
function AccentGlow({ color }: { color: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute -top-48 -left-48 h-[26rem] w-[26rem]"
      style={{
        background: `radial-gradient(closest-side, ${hexToRgba(color, 0.14)} 0%, ${hexToRgba(color, 0.14)} 40%, ${hexToRgba(color, 0.06)} 65%, transparent 100%)`,
      }}
    />
  );
}

export function ShowcaseCard({ sweet, direction }: { sweet: SweetItem; direction: Direction }) {
  return (
    <motion.article
      id="sweet-stage"
      role="tabpanel"
      aria-labelledby={`sweet-tab-${sweet.id}`}
      custom={direction}
      variants={cardVariants}
      initial="enter"
      animate="center"
      exit="exit"
      className={cn(CARD_CLASSES, "h-full [transform-style:preserve-3d]")}
    >
      <AccentGlow color={sweet.accentColor} />
      <div className="relative">
        <ShowcaseBody sweet={sweet} />
      </div>
    </motion.article>
  );
}

/** Phone card shell: stays put while only its content dissolves (see StudioStage). */
export const SHELL_CLASSES = "relative min-w-0 overflow-hidden rounded-[2rem] bg-card shadow-ambient";

/**
 * Phones: one sweet's content inside the persistent card shell. The outgoing copy is lifted
 * out of the flow (absolute, top-aligned) so the shell can glide straight to the new height
 * while both layers cross-fade on top of each other.
 */
export function ShowcaseDissolve({ sweet }: { sweet: SweetItem }) {
  const isPresent = useIsPresent();
  return (
    <motion.div
      data-dissolve-layer={sweet.id}
      className={cn("p-4 sm:p-5", isPresent ? "relative" : "pointer-events-none absolute inset-x-0 top-0")}
      style={{ transformOrigin: "50% 0%" }}
      initial={{ opacity: 0, transform: "scale(1.02)" }}
      animate={{ opacity: 1, transform: "scale(1)", transition: { opacity: CONTENT_DISSOLVE, transform: SPRING_DRIFT } }}
      exit={{ opacity: 0, transition: CONTENT_OUT }}
    >
      <AccentGlow color={sweet.accentColor} />
      <div className="relative">
        <ShowcaseBody sweet={sweet} calm />
      </div>
    </motion.div>
  );
}

/** Invisible copy used to reserve the tallest card's height (page height never jumps). */
export function ShowcaseGhost({ sweet }: { sweet: SweetItem }) {
  return (
    <div className={CARD_CLASSES}>
      <ShowcaseBody sweet={sweet} ghost />
    </div>
  );
}
