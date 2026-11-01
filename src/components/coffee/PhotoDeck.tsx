"use client";

import { AnimatePresence, motion, useAnimationFrame, useInView, useMotionValue, useTransform, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight, Hand, Pause, Play } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { AdaptiveImage } from "@/components/AdaptiveImage";
import { useMediaQuery } from "@/components/kinetic/hooks";
import { Kinetic3DShowcase } from "@/components/kinetic/Kinetic3DShowcase";
import { SPRING } from "@/lib/motion";
import { cn, toFa } from "@/lib/utils";

interface DeckImage {
  src: string;
  alt: string;
}

type Pose = { x: number; y: number; rotate: number; scale: number };

/** Resting pose for each depth in the stack (0 = front). Phones keep rotation within ±3°. */
const POSES: Record<"wide" | "compact", Pose[]> = {
  wide: [
    { x: 0, y: 0, rotate: 0, scale: 1 },
    { x: -46, y: 16, rotate: -7, scale: 0.92 },
    { x: 46, y: 30, rotate: 6, scale: 0.86 },
  ],
  compact: [
    { x: 0, y: 0, rotate: 0, scale: 1 },
    { x: -18, y: 14, rotate: -3, scale: 0.93 },
    { x: 18, y: 26, rotate: 3, scale: 0.87 },
  ],
};

/** One step of the auto-shuffle: the golden ring fills over exactly this long. */
const AUTO_MS = 3800;
const FLY_MS = 280;

const pad = (n: number) => toFa(String(n).padStart(2, "0"));

/**
 * Autonomous + touch-swipeable 3D stacked photo deck.
 *  • every 3.8s the front card arcs out in 3D and the next springs forward (golden ring = timer)
 *  • the timer only pauses while a finger / mouse button is down or a card is being dragged;
 *    any manual pick restarts a full step (no long "hold" that could leave it looking stuck)
 *  • fling the front card sideways, tap a background card, or use the 48px controls
 *  • the front card levitates (figure-8) and tilts toward cursor or finger
 */
export function PhotoDeck({ images }: { images: DeckImage[] }) {
  const compact = useMediaQuery("(max-width: 767px)");
  const poses = POSES[compact ? "compact" : "wide"];
  const [order, setOrder] = useState<number[]>(() => images.map((_, i) => i));
  const [flying, setFlying] = useState<{ index: number; dir: number } | null>(null);
  const [pressed, setPressed] = useState(false);
  const [manualPause, setManualPause] = useState(false);
  const [dragging, setDragging] = useState(false);
  const flyTimer = useRef<number | undefined>(undefined);
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.4 });
  const front = order[0];
  const running = inView && !pressed && !manualPause && !dragging;
  const progress = useMotionValue(0);
  const elapsed = useRef(0);
  const lastFront = useRef(front);

  const ringOpacity = useTransform(progress, (v) => (v > 0.004 ? 1 : 0));

  const restart = useCallback(() => {
    elapsed.current = 0;
    progress.set(0);
  }, [progress]);

  useEffect(() => () => window.clearTimeout(flyTimer.current), []);

  // released anywhere (or the browser takes the touch over for scrolling) → resume at once
  useEffect(() => {
    if (!pressed) return;
    const release = () => setPressed(false);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    return () => {
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, [pressed]);

  /** Arc the front card out, then send it to the back. */
  const advance = useCallback(
    (dir = -1) => {
      if (flying) return;
      setFlying({ index: order[0], dir });
      window.clearTimeout(flyTimer.current);
      flyTimer.current = window.setTimeout(() => {
        setOrder((o) => [...o.slice(1), o[0]]);
        setFlying(null);
      }, FLY_MS);
    },
    [flying, order],
  );

  const previous = () => {
    restart();
    setOrder((prev) => [prev[prev.length - 1], ...prev.slice(0, -1)]);
  };
  const bringToFront = (i: number) => {
    restart();
    setOrder((prev) => [i, ...prev.filter((x) => x !== i)]);
  };

  // Frame clock (same engine as the hero story bars and the studio tour): time only accumulates
  // while running, the ring is drawn from the same value, and reaching AUTO_MS always advances.
  useAnimationFrame((_, delta) => {
    if (lastFront.current !== front) {
      lastFront.current = front; // any change of the front card starts a fresh, full step
      restart();
    }
    if (!running || flying) return;
    elapsed.current += Math.min(delta, 64);
    progress.set(Math.min(1, elapsed.current / AUTO_MS));
    if (elapsed.current >= AUTO_MS) {
      restart();
      advance(-1);
    }
  });

  function handleDragEnd(_: unknown, info: PanInfo) {
    setDragging(false);
    restart();
    if (Math.abs(info.offset.x) > 80 || Math.abs(info.velocity.x) > 600) advance(info.offset.x >= 0 ? 1 : -1);
  }

  function handleCardKey(event: KeyboardEvent<HTMLDivElement>, i: number) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      bringToFront(i);
    }
  }

  const flyPose = (dir: number): Pose => ({
    x: dir * (compact ? 150 : 230),
    y: -26,
    rotate: dir * (compact ? 3 : 16),
    scale: 0.94,
  });

  return (
    <div ref={rootRef} className="relative" onPointerDownCapture={() => setPressed(true)}>
      <div className="relative mx-auto aspect-[4/5] w-[88%] sm:w-full sm:max-w-[400px]">
        {images.map((img, i) => {
          const depth = order.indexOf(i);
          const isFront = depth === 0;
          const isFlying = flying?.index === i;
          const pose = isFlying ? flyPose(flying.dir) : (poses[depth] ?? poses[poses.length - 1]);
          return (
            <motion.div
              key={img.src}
              data-deck-card={i}
              data-deck-front={isFront ? "true" : undefined}
              className={cn("absolute inset-0 touch-pan-y rounded-[1.75rem]", isFront ? "cursor-grab active:cursor-grabbing" : "cursor-pointer")}
              style={{ zIndex: isFlying ? 10 : images.length - depth }}
              initial={false}
              animate={pose}
              transition={SPRING}
              drag={isFront && !isFlying ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.8}
              onDragStart={() => setDragging(true)}
              onDragEnd={handleDragEnd}
              whileDrag={{ scale: 1.03 }}
              onClick={() => {
                if (!isFront) bringToFront(i);
              }}
              onKeyDown={(e) => handleCardKey(e, i)}
              role={isFront ? "img" : "button"}
              tabIndex={isFront ? -1 : 0}
              aria-label={isFront ? img.alt : `نمایش تصویر: ${img.alt}`}
            >
              <Kinetic3DShowcase
                kineticId={isFront ? "coffee" : undefined}
                amplitude={isFront && !isFlying ? 1 : 0}
                interactive={isFront && !dragging}
                className="h-full w-full"
                rounded="rounded-[1.75rem]"
              >
                <AdaptiveImage src={img.src} alt={img.alt} aspectRatio="h-full" hoverZoom="none" sizes="(max-width: 768px) 80vw, 400px" />
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 bg-[#1A1412]"
                  initial={false}
                  animate={{ opacity: isFront ? 0 : 0.5 }}
                  transition={SPRING}
                />
                <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[1.75rem] ring-1 ring-[#F5EFE6]/15 ring-inset" />
              </Kinetic3DShowcase>
            </motion.div>
          );
        })}
      </div>

      {/* caption */}
      <div className="mt-9 min-h-[3.25rem] text-center md:mt-12">
        <AnimatePresence mode="wait" initial={false}>
          <motion.p
            key={front}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={SPRING}
            className="text-sm leading-7 text-[#F5EFE6]/85"
            data-deck-caption={front}
          >
            <span className="font-black text-saffron">{pad(front + 1)}</span>
            <span className="mx-2 text-[#F5EFE6]/65">/</span>
            {(images[front] ?? images[0]).alt}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* controls — every target is 48×48 */}
      <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2" role="tablist" aria-label="تصاویر قهوه یزدی">
            {images.map((image, i) => {
              const active = front === i;
              return (
                <motion.button
                  key={image.src}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-label={image.alt}
                  onClick={() => bringToFront(i)}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.94 }}
                  transition={SPRING}
                  className="relative h-12 w-12 rounded-xl"
                >
                  {active && <motion.span layoutId="coffee-thumb-ring" transition={SPRING} className="absolute -inset-1 rounded-[14px] border-2 border-saffron" />}
                  <span className="absolute inset-0 overflow-hidden rounded-xl">
                    <AdaptiveImage src={image.src} alt="" aspectRatio="h-full" hoverZoom="self" sizes="48px" />
                  </span>
                </motion.button>
              );
            })}
          </div>

          {/* golden auto-cycle timer ring (tap to pause / resume) */}
          <motion.button
            type="button"
            onClick={() => setManualPause((p) => !p)}
            whileTap={{ scale: 0.92 }}
            transition={SPRING}
            aria-label={manualPause ? "ادامه‌ی نمایش خودکار" : "توقف نمایش خودکار"}
            aria-pressed={manualPause}
            className="relative grid h-12 w-12 place-items-center rounded-full text-[#F5EFE6]"
          >
            <svg viewBox="0 0 48 48" className="absolute inset-0 h-full w-full -rotate-90" aria-hidden>
              <circle cx={24} cy={24} r={21} fill="none" stroke="rgba(245,239,230,0.18)" strokeWidth={2.5} />
              <motion.circle
                data-deck-ring
                data-running={running ? "" : undefined}
                cx={24}
                cy={24}
                r={21}
                fill="none"
                stroke="#D48C29"
                strokeWidth={2.5}
                strokeLinecap="round"
                style={{ pathLength: progress, opacity: ringOpacity }}
              />
            </svg>
            {manualPause ? <Play className="relative h-4 w-4" /> : <Pause className="relative h-4 w-4" />}
          </motion.button>
        </div>

        <div className="flex items-center gap-2">
          <motion.button
            type="button"
            onClick={previous}
            whileHover={{ x: 2 }}
            whileTap={{ scale: 0.92 }}
            transition={SPRING}
            aria-label="تصویر قبلی"
            className="grid h-12 w-12 place-items-center rounded-full border border-[#F5EFE6]/20 text-[#F5EFE6]"
          >
            <ChevronRight className="h-5 w-5" />
          </motion.button>
          <motion.button
            type="button"
            onClick={() => {
              restart();
              advance(-1);
            }}
            initial="rest"
            animate="rest"
            whileHover="hover"
            whileTap={{ scale: 0.95 }}
            transition={SPRING}
            className="inline-flex h-12 items-center gap-1.5 rounded-full bg-[#F5EFE6] ps-5 pe-4 text-[13px] font-bold whitespace-nowrap text-[#1A1412]"
          >
            تصویر بعدی
            <motion.span variants={{ rest: { x: 0 }, hover: { x: -3 } }} transition={SPRING}>
              <ChevronLeft className="h-4 w-4" />
            </motion.span>
          </motion.button>
        </div>
      </div>

      <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-[#F5EFE6]/70">
        <Hand className="h-3.5 w-3.5" strokeWidth={1.6} />
        کارت جلویی را بکشید یا روی کارت‌های پشتی بزنید
      </p>
    </div>
  );
}
