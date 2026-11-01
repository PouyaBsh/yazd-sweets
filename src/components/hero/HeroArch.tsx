"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import { ArrowUpLeft } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdaptiveImage } from "@/components/AdaptiveImage";
import { useExperience } from "@/components/experience/ExperienceContext";
import { ArchOutline, GirihRosette } from "@/components/ui/Ornaments";
import { SWEETS_DATA } from "@/data/yazd-content";
import { prefersReducedMotion, settle, springEasing } from "@/lib/compositor";
import { SPRING } from "@/lib/motion";
import { useRevealed } from "@/lib/reveal";
import { SpiceBadges } from "./SpiceBadges";

/** Time each photo stays up — the story bar under it fills over exactly this long. */
const CYCLE_MS = 3000;

/**
 * Arched hero frame that slowly cycles through the six sweets. Click → showcase in the studio.
 *
 * Everything that moves on its own here is a Web Animation on transform / opacity, i.e. it runs on
 * the compositor thread with no per-frame JavaScript:
 *  · the story bar under the photo is the clock — when its scaleX animation finishes, the next
 *    photo comes up; pausing the bar pauses the slideshow
 *  · the dissolve + Ken-Burns drift use the same over-damped springs as before, sampled into a
 *    CSS linear() easing
 */
export function HeroArch() {
  const { focusSweet } = useExperience();
  // The incoming photo always starts from 0 on TOP of the outgoing one, which holds at full opacity
  // underneath — so the light frame behind the photos never shows through mid-transition (no flash).
  const [slide, setSlide] = useState({ index: 0, prev: -1 });
  const index = slide.index;
  const order = useRef({ index: 0, prev: -1 });
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const barAnim = useRef<Animation | null>(null);
  const revealed = useRevealed();

  const goTo = useCallback((next: number) => {
    const { index: cur, prev } = order.current;
    if (next === cur) return;
    order.current = { index: next, prev: cur };
    setSlide({ index: next, prev: cur });
    const inEl = layerRefs.current[next];
    const curEl = layerRefs.current[cur];
    const prevEl = prev >= 0 && prev !== next ? layerRefs.current[prev] : null;
    if (!inEl || !curEl) return;
    if (prefersReducedMotion()) {
      layerRefs.current.forEach((el, i) => el && (el.style.opacity = i === next ? "1" : "0"));
      return;
    }
    const dissolve = springEasing(55, 18);
    const drift = springEasing(30, 16);
    // hidden beneath the current photo → reset, then dissolve in from zero
    inEl.getAnimations().forEach((a) => a.cancel());
    settle(inEl.animate([{ opacity: 0 }, { opacity: 1 }], { duration: dissolve.duration, easing: dissolve.easing, fill: "forwards" }));
    settle(
      inEl.animate([{ transform: "scale(1.06)" }, { transform: "scale(1)" }], { duration: drift.duration, easing: drift.easing, fill: "forwards" }),
    );
    // the outgoing photo finishes to full opacity from wherever it is (matters only on rapid taps)
    const from = getComputedStyle(curEl).opacity;
    curEl.getAnimations().forEach((a) => a.cancel());
    settle(curEl.animate([{ opacity: from }, { opacity: 1 }], { duration: dissolve.duration, easing: dissolve.easing, fill: "forwards" }));
    // the one before it is buried under two opaque layers; clear it once the dissolve has settled
    if (prevEl) settle(prevEl.animate([{ opacity: 0 }, { opacity: 0 }], { duration: 1, delay: 1400, fill: "forwards" }));
  }, []);

  const [paused, setPaused] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.3 });

  // the active story bar: a compositor scaleX animation that IS the timer
  useEffect(() => {
    const el = barRefs.current[index];
    if (!el) return;
    const anim = el.animate([{ transform: "scaleX(0)" }, { transform: "scaleX(1)" }], { duration: CYCLE_MS, easing: "linear", fill: "forwards" });
    anim.pause();
    anim.onfinish = () => goTo((order.current.index + 1) % SWEETS_DATA.length);
    barAnim.current = anim;
    return () => {
      anim.onfinish = null;
      anim.cancel();
    };
  }, [index, goTo]);

  // pauses on hover / focus / off-screen, and until the boot loader has revealed the page
  useEffect(() => {
    const anim = barAnim.current;
    if (!anim) return;
    if (paused || !inView || !revealed) anim.pause();
    else anim.play();
  }, [paused, inView, revealed, index]);

  const jumpTo = (i: number) => goTo(i);

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
        animate={revealed ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 30, scale: 0.97 }}
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
                <div
                  key={s.id}
                  ref={(node) => {
                    layerRefs.current[i] = node;
                  }}
                  data-hero-slide={active ? "active" : holding ? "prev" : "idle"}
                  aria-hidden={!active}
                  className="absolute inset-0"
                  style={{ zIndex: active ? 2 : holding ? 1 : 0, opacity: i === 0 ? 1 : 0 }}
                >
                  <AdaptiveImage
                    src={s.image}
                    alt={active ? s.imageAlt : ""}
                    aspectRatio="h-full"
                    hoverZoom="parent"
                    eager={i === 0}
                    sizes="(max-width: 640px) 256px, (max-width: 1024px) 380px, 420px"
                  />
                </div>
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
              <span
                ref={(node) => {
                  barRefs.current[i] = node;
                }}
                className="absolute inset-0 origin-right rounded-full bg-terracotta"
                style={{ transform: i < index ? "scaleX(1)" : "scaleX(0)" }}
              />
            </span>
          </button>
        ))}
      </div>

      <SpiceBadges />
    </div>
  );
}
