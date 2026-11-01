"use client";

import {
  AnimatePresence,
  animate,
  motion,
  motionValue,
  useAnimationFrame,
  useInView,
  useMotionValue,
  useReducedMotion,
} from "framer-motion";
import { ArrowUpLeft } from "lucide-react";
import { useRef, useState } from "react";
import { AdaptiveImage } from "@/components/AdaptiveImage";
import { useExperience } from "@/components/experience/ExperienceContext";
import { ArchOutline, GirihRosette } from "@/components/ui/Ornaments";
import { SWEETS_DATA } from "@/data/yazd-content";
import { SPRING, SPRING_DISSOLVE, SPRING_DRIFT } from "@/lib/motion";
import { SpiceBadges } from "./SpiceBadges";

/** Time each photo stays up — the story bar under it fills over exactly this long. */
const CYCLE_MS = 3000;

/** Arched hero frame that slowly cycles through the six sweets. Click → showcase in the studio. */
export function HeroArch() {
  const { focusSweet } = useExperience();
  // Slideshow model: every photo layer owns an opacity/scale motion value. The incoming photo
  // always starts from 0 on TOP of the outgoing one, which holds at full opacity underneath —
  // so the light frame behind the photos can never show through mid-transition (no flash).
  const [slide, setSlide] = useState({ index: 0, prev: -1 });
  const index = slide.index;
  const order = useRef({ index: 0, prev: -1 });
  const reduced = useReducedMotion();
  const [layers] = useState(() =>
    SWEETS_DATA.map((_, i) => ({ opacity: motionValue(i === 0 ? 1 : 0), scale: motionValue(1) })),
  );

  const goTo = (next: number) => {
    const { index: cur, prev } = order.current;
    if (next === cur) return;
    order.current = { index: next, prev: cur };
    setSlide({ index: next, prev: cur });
    const incoming = layers[next];
    if (reduced) {
      layers.forEach((l, i) => l.opacity.jump(i === next ? 1 : 0));
      return;
    }
    // hidden beneath the current photo → reset, then dissolve in from zero
    incoming.opacity.jump(0);
    incoming.scale.jump(1.06);
    animate(incoming.opacity, 1, SPRING_DISSOLVE);
    animate(incoming.scale, 1, SPRING_DRIFT);
    // the outgoing photo finishes to full opacity (matters only on rapid taps) and holds there
    animate(layers[cur].opacity, 1, SPRING_DISSOLVE);
    // the one before it is buried under two opaque layers; clear it once the dissolve has settled
    if (prev >= 0 && prev !== next) animate(layers[prev].opacity, 0, { duration: 0, delay: 1.4 });
  };
  const [paused, setPaused] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.3 });
  const elapsed = useRef(0);
  const progress = useMotionValue(0);

  // story-style timer: the active bar fills, then the next photo starts; pauses on hover/focus/off-screen
  useAnimationFrame((_, delta) => {
    if (paused || !inView) return;
    elapsed.current += Math.min(delta, 64);
    progress.set(Math.min(1, elapsed.current / CYCLE_MS));
    if (elapsed.current >= CYCLE_MS) {
      elapsed.current = 0;
      progress.set(0);
      goTo((order.current.index + 1) % SWEETS_DATA.length);
    }
  });

  const jumpTo = (i: number) => {
    elapsed.current = 0;
    progress.set(0);
    goTo(i);
  };

  const sweet = SWEETS_DATA[index];

  return (
    <div ref={rootRef} className="relative mx-auto w-full max-w-[300px] sm:max-w-[380px] lg:me-0 lg:ms-auto lg:max-w-[420px]">
      {/* offset arch echo + slowly turning girih rosette */}
      <ArchOutline className="pointer-events-none absolute inset-0 h-full w-full -translate-x-4 -translate-y-4 text-terracotta/40 sm:-translate-x-6 sm:-translate-y-6" />
      <div aria-hidden className="spin-slow pointer-events-none absolute -bottom-12 -left-10 h-44 w-44 text-saffron/30">
        <GirihRosette className="h-full w-full" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ ...SPRING, delay: 0.25 }}
      >
        <motion.button
          type="button"
          onClick={() => focusSweet(sweet.id)}
          onHoverStart={() => setPaused(true)}
          onHoverEnd={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          initial="rest"
          animate="rest"
          whileHover="hover"
          whileTap={{ scale: 0.985 }}
          transition={SPRING}
          className="relative isolate block aspect-[4/5] w-full overflow-hidden rounded-t-[999px] rounded-b-[2.25rem] border border-ink/10 bg-sand text-start shadow-ambient"
        >
          {/* clip-path (not just overflow + radius): Chrome lets a composited child whose scale is
              animating escape rounded overflow clipping for a few frames — the "black corners" glitch */}
          <div
            className="absolute inset-0 overflow-hidden rounded-t-[999px] rounded-b-[2.25rem]"
            style={{ clipPath: "inset(0 round 999px 999px 2.25rem 2.25rem)" }}
          >
            {/* All six photos stay mounted (loaded + decoded once), stacked:
                  active (top) dissolves in · prev (middle) holds at full opacity · the rest sit hidden.
                Re-mounting per slide used to flash the light loading skeleton for a frame, and a plain
                cross-fade let the frame colour bleed through at the half-way point. */}
            {SWEETS_DATA.map((s, i) => {
              const active = i === slide.index;
              const holding = i === slide.prev;
              return (
                <motion.div
                  key={s.id}
                  data-hero-slide={active ? "active" : holding ? "prev" : "idle"}
                  aria-hidden={!active}
                  className="absolute inset-0"
                  style={{ zIndex: active ? 2 : holding ? 1 : 0, opacity: layers[i].opacity, scale: layers[i].scale }}
                >
                  <AdaptiveImage
                    src={s.image}
                    alt={active ? s.imageAlt : ""}
                    aspectRatio="h-full"
                    hoverZoom="parent"
                    eager={i === 0}
                    sizes="(max-width: 1024px) 90vw, 420px"
                  />
                </motion.div>
              );
            })}
          </div>

          <div
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-linear-to-t from-ink/75 via-ink/25 to-transparent"
          />

          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-5 text-heritage-ink sm:p-6">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={sweet.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={SPRING}
              >
                <span className="text-xs font-semibold text-heritage-ink/75">{sweet.order} / ۰۶</span>
                <p className="mt-1 text-2xl font-black">{sweet.name}</p>
                <p className="mt-0.5 text-sm text-heritage-ink/80">{sweet.shortTag}</p>
                <span className="sr-only"> — نمایش در استودیو شیرینی‌ها</span>
              </motion.div>
            </AnimatePresence>
            <motion.span
              variants={{ rest: { x: 0, y: 0, scale: 1 }, hover: { x: -4, y: -4, scale: 1.08 } }}
              transition={SPRING}
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-canvas/90 text-ink"
            >
              <ArrowUpLeft className="h-5 w-5" strokeWidth={1.8} />
            </motion.span>
          </div>
        </motion.button>
      </motion.div>

      {/* story bars: each one fills while its photo is up; when all are full the cycle restarts */}
      <div className="mt-1 flex gap-1" role="tablist" aria-label="تصاویر شیرینی‌ها">
        {SWEETS_DATA.map((s, i) => (
          <button
            key={s.id}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={s.name}
            onClick={() => jumpTo(i)}
            className="grid h-12 min-w-0 flex-1 place-items-center"
          >
            <span className="relative block h-[3px] w-full overflow-hidden rounded-full bg-ink/15">
              <motion.span
                className="absolute inset-0 origin-right rounded-full bg-terracotta"
                style={{ scaleX: i === index ? progress : i < index ? 1 : 0 }}
              />
            </span>
          </button>
        ))}
      </div>

      <SpiceBadges />
    </div>
  );
}
