"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import { Award, Hand, Images, MousePointerClick } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AdaptiveImage } from "@/components/AdaptiveImage";
import { useExperience } from "@/components/experience/ExperienceContext";
import { useCanHover } from "@/components/kinetic/hooks";
import { SWEETS_DATA, YAZDI_COFFEE_DATA } from "@/data/yazd-content";
import { fadeUp, SPRING, SPRING_FADE_OUT, staggerParent, SPRING_GLIDE } from "@/lib/motion";
import { scrollToSection } from "@/lib/utils";

interface DockItem {
  id: string;
  order: string;
  name: string;
  subtitle: string;
  image: string;
  alt: string;
  kind: "sweet" | "coffee";
}

const [coffeeName, coffeeSubtitle] = YAZDI_COFFEE_DATA.title.split("؛").map((s) => s.trim());

const DOCK_ITEMS: DockItem[] = [
  ...SWEETS_DATA.map((s) => ({
    id: s.id,
    order: s.order,
    name: s.name,
    subtitle: s.shortTag,
    image: s.image,
    alt: s.imageAlt,
    kind: "sweet" as const,
  })),
  {
    id: YAZDI_COFFEE_DATA.id,
    order: YAZDI_COFFEE_DATA.order,
    name: coffeeName,
    subtitle: coffeeSubtitle,
    image: YAZDI_COFFEE_DATA.images[0].src,
    alt: YAZDI_COFFEE_DATA.images[0].alt,
    kind: "coffee",
  },
];

/** How long the golden wave rests on each card before gliding to the next one. */
const WAVE_MS = 1500;

/**
 * Quick-jump gallery dock.
 *  Desktop: hover widens a thumbnail (spring flex-grow) and reveals its subtitle.
 *  Touch:   snap-to-centre carousel — the centred card scales up, reveals its subtitle and
 *           lights its ornamental frame; a one-time scroll nudge + «بکشید» hint teach the gesture.
 *  Both:    a golden wave travels across the cards until the visitor interacts.
 *  Click:   glides to the Sweet Studio and showcases that exact sweet (coffee → coffee section).
 */
export function GalleryDock() {
  const { focusSweet } = useExperience();
  const canHover = useCanHover();
  const [hovered, setHovered] = useState<string | null>(null);
  const [centerId, setCenterId] = useState<string>(DOCK_ITEMS[0].id);
  const [interacted, setInteracted] = useState(false);
  const [wave, setWave] = useState(0);
  const [visible, setVisible] = useState<number[]>(() => DOCK_ITEMS.map((_, i) => i));
  const listRef = useRef<HTMLUListElement>(null);
  const nudging = useRef(false);
  const nudged = useRef(false);
  const inView = useInView(listRef, { amount: 0.6 });

  // golden wave pulse until first interaction
  useEffect(() => {
    if (interacted || !inView) return;
    const t = window.setInterval(() => setWave((w) => (w + 1) % DOCK_ITEMS.length), WAVE_MS);
    return () => window.clearInterval(t);
  }, [interacted, inView]);

  // touch: find the card closest to the strip's centre
  const measureCenter = useCallback(() => {
    const list = listRef.current;
    if (!list) return;
    const box = list.getBoundingClientRect();
    const mid = box.left + box.width / 2;
    let best: string | null = null;
    let bestDist = Infinity;
    const seen: number[] = [];
    list.querySelectorAll<HTMLElement>("[data-dock-id]").forEach((el, i) => {
      const r = el.getBoundingClientRect();
      const d = Math.abs(r.left + r.width / 2 - mid);
      if (d < bestDist) {
        bestDist = d;
        best = el.dataset.dockId ?? null;
      }
      const overlap = Math.min(r.right, box.right) - Math.max(r.left, box.left);
      if (overlap > r.width * 0.35) seen.push(i);
    });
    if (best) setCenterId(best);
    if (seen.length) setVisible((prev) => (prev.join() === seen.join() ? prev : seen));
  }, []);

  useEffect(() => {
    const list = listRef.current;
    if (!list || canHover) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(measureCenter);
      if (!nudging.current) setInteracted(true);
    };
    list.addEventListener("scroll", onScroll, { passive: true });
    raf = requestAnimationFrame(measureCenter);
    return () => {
      list.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(raf);
    };
  }, [canHover, measureCenter]);

  // touch: one-time auto-scroll nudge to reveal that the strip scrolls sideways
  const nudgeTimers = useRef<number[]>([]);
  useEffect(() => {
    const list = listRef.current;
    if (!list || canHover || !inView || nudged.current) return;
    nudged.current = true;
    nudging.current = true;
    const start = list.scrollLeft;
    nudgeTimers.current = [
      window.setTimeout(() => list.scrollTo({ left: start - 96, behavior: "smooth" }), 500),
      window.setTimeout(() => list.scrollTo({ left: start, behavior: "smooth" }), 1300),
      window.setTimeout(() => {
        nudging.current = false;
        measureCenter();
      }, 2100),
    ];
    // timers are deliberately NOT cleared when the strip scrolls out of view mid-nudge
  }, [canHover, inView, measureCenter]);
  useEffect(() => () => nudgeTimers.current.forEach((t) => window.clearTimeout(t)), []);

  function handleSelect(item: DockItem) {
    setInteracted(true);
    if (item.kind === "coffee") scrollToSection("yazdi-coffee");
    else focusSweet(item.id);
  }

  return (
    <section aria-labelledby="dock-title" className="mx-auto max-w-[1320px] px-4 pb-4 md:px-8 md:pb-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h2 id="dock-title" className="flex items-center gap-2.5 text-base font-extrabold text-ink">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-sand text-terracotta-deep">
            <Images className="h-4 w-4" strokeWidth={1.8} />
          </span>
          گالری سوغات یزد
        </h2>
        <p className="hidden items-center gap-1.5 text-[13px] text-umber md:flex">
          <MousePointerClick className="h-4 w-4" strokeWidth={1.6} />
          روی هر تصویر بزنید تا در استودیو نمایش داده شود
        </p>
        <AnimatePresence>
          {!interacted && (
            <motion.p
              key="swipe-hint"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={SPRING}
              className="flex items-center gap-1.5 rounded-full border border-saffron/40 bg-card px-3 py-1 text-xs font-bold text-ink md:hidden"
            >
              <motion.span animate={{ x: [0, 7, 0] }} transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}>
                <Hand className="h-3.5 w-3.5 text-terracotta-deep" />
              </motion.span>
              بکشید
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      <motion.ul
        ref={listRef}
        className="-mx-4 mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pt-3 pb-3 scrollbar-none [mask-image:linear-gradient(to_left,transparent,black_6%,black_94%,transparent)] md:mx-0 md:snap-none md:px-0 md:[mask-image:none]"
        variants={staggerParent(0.05)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        onMouseLeave={() => setHovered(null)}
        onPointerDown={() => setInteracted(true)}
      >
        {/* centring spacers so the first & last cards can snap to the middle on touch */}
        <li aria-hidden className="w-[calc(22%-0.75rem)] shrink-0 md:hidden" />
        {DOCK_ITEMS.map((item, i) => {
          const isHovered = canHover && hovered === item.id;
          const isCenter = !canHover && centerId === item.id;
          const waving = !interacted && visible[wave % visible.length] === i;
          const lit = isHovered || isCenter;
          return (
            <motion.li
              key={item.id}
              data-dock-id={item.id}
              className="w-[56%] max-w-[15rem] shrink-0 snap-center md:w-auto md:max-w-none md:min-w-[8.75rem] md:shrink md:basis-0"
              initial={false}
              animate={{ flexGrow: isHovered ? 1.85 : 1 }}
              transition={SPRING}
            >
              <motion.div variants={fadeUp}>
                {/* the lift/scale lives on this wrapper so the gold ring (a sibling of the clipped button) moves with the card */}
                <motion.div
                  className="relative"
                  initial="rest"
                  animate={lit ? "hover" : waving ? "wave" : "rest"}
                  variants={{
                    rest: { scale: 1, y: 0, transition: SPRING_FADE_OUT },
                    wave: { scale: 1, y: -4, transition: SPRING_GLIDE },
                    hover: { scale: canHover ? 1 : 1.05, y: -2, transition: SPRING },
                  }}
                  transition={SPRING}
                >
                  {/* gold ring: a static shadow whose opacity springs in — and dissolves slowly on exit */}
                  <motion.span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 rounded-[1.5rem]"
                    style={{ boxShadow: "0 0 0 2px rgba(212,140,41,0.72), 0 18px 34px -18px rgba(212,140,41,0.75)" }}
                    variants={{
                      rest: { opacity: 0, transition: SPRING_FADE_OUT },
                      wave: { opacity: 0.75, transition: SPRING_GLIDE },
                      hover: { opacity: 1, transition: SPRING },
                    }}
                  />
                  <motion.button
                    type="button"
                    onClick={() => handleSelect(item)}
                    onHoverStart={() => {
                      setHovered(item.id);
                      setInteracted(true);
                    }}
                    onHoverEnd={() => setHovered((h) => (h === item.id ? null : h))}
                    onFocus={() => setHovered(item.id)}
                    onBlur={() => setHovered(null)}
                    whileTap={{ scale: 0.97 }}
                    transition={SPRING}
                    className="relative block h-52 w-full overflow-hidden rounded-[1.5rem] border border-ink/[0.08] bg-sand text-start md:h-56"
                  >
                    <AdaptiveImage
                      src={item.image}
                      alt={item.alt}
                      aspectRatio="h-full"
                      hoverZoom="parent"
                      eager
                      sizes="(max-width: 768px) 45vw, 18vw"
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-linear-to-t from-ink/85 via-ink/20 to-transparent"
                    />

                    {/* ornamental frame lights up on hover / centre */}
                    <motion.span
                      aria-hidden
                      className="pointer-events-none absolute inset-1.5 rounded-[1.15rem] border"
                      initial={false}
                      animate={{ borderColor: lit ? "rgba(226,180,103,0.85)" : "rgba(245,239,230,0.18)" }}
                      transition={lit ? SPRING : SPRING_FADE_OUT}
                    />

                    <span className="absolute top-3 right-3 rounded-full bg-canvas/95 px-2 py-0.5 text-[11px] font-bold text-ink">
                      {item.order}
                    </span>
                    {item.kind === "coffee" && (
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-firuzeh px-2 py-0.5 text-[11px] font-bold text-heritage-ink">
                        <Award className="h-3 w-3" />
                        ثبت ملی
                      </span>
                    )}

                    <div className="absolute inset-x-0 bottom-0 p-3.5 text-heritage-ink md:p-4">
                      <p className="truncate text-[15px] font-extrabold md:text-base">{item.name}</p>
                      <span className="sr-only">
                        {item.kind === "coffee" ? " — رفتن به بخش قهوه یزدی" : " — نمایش در استودیو شیرینی‌ها"}
                      </span>
                      <AnimatePresence initial={false}>
                        {lit && (
                          <motion.p
                            key="sub"
                            initial={{ opacity: 0, height: 0, y: 6 }}
                            animate={{ opacity: 1, height: "auto", y: 0 }}
                            exit={{ opacity: 0, height: 0, y: 4 }}
                            transition={SPRING}
                            className="overflow-hidden text-xs whitespace-nowrap text-heritage-ink/90"
                          >
                            {item.subtitle}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.button>
                </motion.div>
              </motion.div>
            </motion.li>
          );
        })}
        <li aria-hidden className="w-[calc(22%-0.75rem)] shrink-0 md:hidden" />
      </motion.ul>
    </section>
  );
}
