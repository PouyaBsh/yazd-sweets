"use client";

import { AnimatePresence, motion, useInView, type PanInfo } from "framer-motion";
import { ArrowUpLeft, ChevronLeft, ChevronRight, Quote } from "lucide-react";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AdaptiveImage } from "@/components/AdaptiveImage";
import { useExperience } from "@/components/experience/ExperienceContext";
import { useCanHover } from "@/components/kinetic/hooks";
import { ScrollReactiveCard, useReactive } from "@/components/kinetic/ScrollReactiveCard";
import { useAutoCycle } from "@/components/kinetic/useAutoCycle";
import { LachakiCardFrame, ShamsehMedallion } from "@/components/ornaments";
import { KheshtPattern } from "@/components/ui/Ornaments";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { HERO_CONTENT, SWEETS_DATA } from "@/data/yazd-content";
import { fadeUp, SPRING, staggerParent } from "@/lib/motion";
import { cn, hexToRgba } from "@/lib/utils";

type Paragraph = (typeof HERO_CONTENT.paragraphs)[number];

/* ─────────────────────────── quote: «هویت این شهر است.» on its own line ─────────────────────────── */

const TAGLINE_TAIL = "هویت این شهر است.";

/** Render-time line break only — the copy in yazd-content.ts stays untouched. */
function TaglineLines({ text }: { text: string }) {
  const at = text.lastIndexOf(TAGLINE_TAIL);
  if (at <= 0) return <>{text}</>;
  return (
    <>
      <span className="block text-balance">{text.slice(0, at).trimEnd()}</span>
      <span className="block">{text.slice(at)}</span>
    </>
  );
}

/* ─────────────────────────── shared card shell (desktop bento) ─────────────────────────── */

function StoryCard({
  index,
  label,
  className,
  tone = "card",
  children,
}: {
  index: string;
  label: string;
  className?: string;
  tone?: "card" | "sand";
  children: ReactNode;
}) {
  return (
    <motion.div variants={fadeUp} className={cn("h-full", className)}>
      <ScrollReactiveCard className="h-full">
        <LachakiCardFrame tone={tone === "card" ? "light" : "sand"} arch={index} className="h-full">
          <article
            className={cn(
              "relative flex h-full flex-col overflow-hidden rounded-[1.75rem] p-6 shadow-ambient md:p-8",
              tone === "card" ? "bg-card" : "bg-sand",
            )}
          >
            <header className="relative flex items-center justify-between gap-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-ink/10 bg-canvas/80 px-3 py-1 text-[13px] font-bold text-ink">
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-terracotta" />
                {label}
              </span>
            </header>
            <div className="relative mt-5 flex flex-1 flex-col">{children}</div>
          </article>
        </LachakiCardFrame>
      </ScrollReactiveCard>
    </motion.div>
  );
}

/* ─────────────────────────── p2: interactive ingredients ─────────────────────────── */

const INGREDIENTS = [
  { word: "بادام", color: "#9E6240", ink: "#7E4A2E" },
  { word: "پسته", color: "#5C7A45", ink: "#4A6337" },
  { word: "هل", color: "#7D8B3F", ink: "#5E6B2B" },
  { word: "گلاب", color: "#B85D3B", ink: "#9A4A2C" },
  { word: "زعفران", color: "#D48C29", ink: "#8F5C0E" },
];
const INGREDIENT_PHRASE = "بادام، پسته، هل، گلاب و زعفران";

function IngredientWord({
  word,
  color,
  ink,
  active,
  onActivate,
}: {
  word: string;
  color: string;
  ink: string;
  active: boolean;
  onActivate: (w: string | null) => void;
}) {
  return (
    <motion.span
      onHoverStart={() => onActivate(word)}
      onHoverEnd={() => onActivate(null)}
      onTap={() => onActivate(word)}
      tabIndex={-1}
      animate={{ backgroundColor: active ? hexToRgba(color, 0.18) : hexToRgba(color, 0) }}
      transition={SPRING}
      className="relative inline-block cursor-default rounded-md px-0.5 font-bold"
      style={{ color: ink }}
    >
      {word}
      <motion.span
        aria-hidden
        className="absolute inset-x-0.5 -bottom-0.5 h-[2px] origin-center rounded-full"
        style={{ backgroundColor: color }}
        animate={{ scaleX: active ? 1 : 0.35, opacity: active ? 1 : 0.5 }}
        transition={SPRING}
      />
    </motion.span>
  );
}

function ClimateParagraph({ text, compact }: { text: string; compact?: boolean }) {
  const canHover = useCanHover();
  const reactive = useReactive();
  const [userActive, setUserActive] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  // touch parity: while the card is centred, the highlight wanders through the five spices
  const auto = useAutoCycle(INGREDIENTS.length, 1500, !canHover && reactive && !touched);
  const active = auto >= 0 ? INGREDIENTS[auto].word : userActive;
  const parts = text.split(INGREDIENT_PHRASE);

  const activate = useCallback((w: string | null) => {
    setUserActive(w);
    if (w) setTouched(true);
  }, []);

  if (parts.length !== 2) return <p className="copy-fa">{text}</p>;

  const word = (i: number) => <IngredientWord {...INGREDIENTS[i]} active={active === INGREDIENTS[i].word} onActivate={activate} />;

  return (
    <>
      <p className="copy-fa text-pretty-fa">
        {parts[0]}
        {word(0)}، {word(1)}، {word(2)}، {word(3)} و {word(4)}
        {parts[1]}
      </p>
      <div className={cn("flex flex-wrap gap-2", compact ? "pt-4" : "mt-auto pt-6")} aria-hidden>
        {INGREDIENTS.map((ing) => {
          const on = active === ing.word;
          return (
            <motion.span
              key={ing.word}
              onHoverStart={() => activate(ing.word)}
              onHoverEnd={() => activate(null)}
              onTap={() => activate(ing.word)}
              tabIndex={-1}
              animate={{
                y: on ? -3 : 0,
                backgroundColor: on ? hexToRgba(ing.color, 0.18) : "rgba(255, 253, 249, 0.75)",
                borderColor: on ? hexToRgba(ing.color, 0.5) : "rgba(28, 22, 19, 0.1)",
              }}
              transition={SPRING}
              className="inline-flex cursor-default items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold text-ink"
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: ing.color }} />
              {ing.word}
            </motion.span>
          );
        })}
      </div>
    </>
  );
}

/* ─────────────────────────── p3: interactive timeline ─────────────────────────── */

const MILESTONES = ["دوره قاجار", "قنادی‌های تخصصی", "تجارت و بسته‌بندی", "سوغات محبوب ایرانیان"];

function HistoryTimeline({ compact }: { compact?: boolean }) {
  const canHover = useCanHover();
  const reactive = useReactive();
  const [userActive, setUserActive] = useState(MILESTONES.length - 1);
  const [touched, setTouched] = useState(false);
  const auto = useAutoCycle(MILESTONES.length, 1600, !canHover && reactive && !touched);
  const active = auto >= 0 ? auto : userActive;
  const progress = active / (MILESTONES.length - 1);

  const pick = (i: number) => {
    setUserActive(i);
    setTouched(true);
  };

  return (
    <div className={compact ? "pt-4" : "mt-auto pt-6"}>
      <div className="relative">
        <div className="absolute top-[24px] right-[12.5%] left-[12.5%] h-px bg-ink/15" aria-hidden>
          <motion.div className="absolute inset-0 origin-right bg-terracotta" initial={false} animate={{ scaleX: progress }} transition={SPRING} />
        </div>
        <ol className="relative grid grid-cols-4">
          {MILESTONES.map((m, i) => {
            const reached = i <= active;
            return (
              <li key={m} className="flex flex-col items-center text-center">
                <motion.button
                  type="button"
                  onHoverStart={() => canHover && setUserActive(i)}
                  onFocus={() => setUserActive(i)}
                  onClick={() => pick(i)}
                  aria-label={m}
                  aria-pressed={i === active}
                  className="grid h-12 w-12 place-items-center"
                >
                  <motion.span
                    animate={{
                      scale: i === active ? 1.3 : 1,
                      backgroundColor: reached ? "#B85D3B" : "#FFFDF9",
                      borderColor: reached ? "#B85D3B" : "rgba(28,22,19,0.25)",
                    }}
                    transition={SPRING}
                    className="block h-[15px] w-[15px] rounded-full border-2"
                  />
                </motion.button>
                <span className={cn("px-1 text-[11px] leading-5 sm:text-xs", i === active ? "font-bold text-ink" : "text-umber")}>{m}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

/* ─────────────────────────── p4: ambassadors → studio ─────────────────────────── */

function AmbassadorChips() {
  const { focusSweet } = useExperience();
  const canHover = useCanHover();
  const reactive = useReactive();
  // touch parity: a gentle wave runs across the chips while the card is centred
  const wave = useAutoCycle(SWEETS_DATA.length, 900, !canHover && reactive);

  return (
    <div className="flex flex-wrap gap-2">
      {SWEETS_DATA.map((sweet, i) => (
        <motion.button
          key={sweet.id}
          type="button"
          onClick={() => focusSweet(sweet.id)}
          initial="rest"
          animate={wave === i ? "hover" : "rest"}
          whileHover="hover"
          whileTap={{ scale: 0.96 }}
          variants={{
            rest: { y: 0, borderColor: "rgba(28,22,19,0.12)" },
            hover: { y: -3, borderColor: hexToRgba(sweet.accentColor, 0.6) },
          }}
          transition={SPRING}
          className="inline-flex min-h-12 items-center gap-2.5 rounded-full border bg-canvas py-1 ps-1 pe-3.5"
          aria-label={`نمایش ${sweet.name} در استودیو`}
        >
          <span className="h-9 w-9 overflow-hidden rounded-full">
            <AdaptiveImage src={sweet.image} alt="" aspectRatio="aspect-square" hoverZoom="parent" sizes="36px" />
          </span>
          <span className="text-sm font-bold text-ink">{sweet.name}</span>
          <motion.span variants={{ rest: { opacity: 0.4, x: 0 }, hover: { opacity: 1, x: -2 } }} transition={SPRING} className="text-terracotta-deep">
            <ArrowUpLeft className="h-3.5 w-3.5" />
          </motion.span>
        </motion.button>
      ))}
    </div>
  );
}

/* ─────────────────────────── slide body (shared by mobile deck) ─────────────────────────── */

const ARCH_TRIO = [SWEETS_DATA[0], SWEETS_DATA[1], SWEETS_DATA[3]];

function SlideBody({ p, i }: { p: Paragraph; i: number }) {
  return (
    <div className="flex h-full flex-col">
      <span className="inline-flex w-fit items-center gap-2 rounded-full border border-ink/10 bg-canvas/80 px-3 py-1 text-[13px] font-bold text-ink">
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-terracotta" />
        {p.label}
      </span>
      <div className="mt-4 flex flex-1 flex-col">
        {i === 1 ? (
          <ClimateParagraph text={p.text} compact />
        ) : (
          <>
            <p className="copy-fa text-pretty-fa">{p.text}</p>
            {i === 0 && (
              <div aria-hidden className="mt-auto grid grid-cols-3 items-end gap-2.5 pt-4">
                {ARCH_TRIO.map((sweet, k) => (
                  <div key={sweet.id} className={cn("overflow-hidden rounded-t-[50%_40%] rounded-b-xl border border-ink/10 bg-sand", k === 1 ? "mb-3" : "")}>
                    <AdaptiveImage src={sweet.image} alt="" aspectRatio="aspect-[4/5]" hoverZoom="none" sizes="120px" />
                  </div>
                ))}
              </div>
            )}
            {i === 2 && <HistoryTimeline compact />}
            {i === 3 && (
              <div className="pt-4">
                <AmbassadorChips />
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────── mobile: auto-advancing swipeable story deck ─────────────────────────── */

const AUTO_MS = 6500;
const PAUSE_MS = 8000;
const toFaPad = (n: number) => `۰${"۰۱۲۳۴۵۶۷۸۹"[n]}`;

function MobileStoryDeck({ paragraphs }: { paragraphs: Paragraph[] }) {
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [paused, setPaused] = useState(false);
  const pauseTimer = useRef<number | undefined>(undefined);
  const rootRef = useRef<HTMLDivElement>(null);
  const inView = useInView(rootRef, { amount: 0.45 });
  const n = paragraphs.length;

  const go = useCallback(
    (delta: number) => {
      setDir(delta);
      setIndex((i) => (i + delta + n) % n);
    },
    [n],
  );

  const pause = useCallback(() => {
    setPaused(true);
    window.clearTimeout(pauseTimer.current);
    pauseTimer.current = window.setTimeout(() => setPaused(false), PAUSE_MS);
  }, []);

  useEffect(() => () => window.clearTimeout(pauseTimer.current), []);

  useEffect(() => {
    if (!inView || paused) return;
    const t = window.setTimeout(() => go(1), AUTO_MS);
    return () => window.clearTimeout(t);
  }, [index, inView, paused, go]);

  function handleDragEnd(_: unknown, info: PanInfo) {
    pause();
    // RTL: the next story lives to the left, so a rightward swipe reveals it
    if (info.offset.x > 60 || info.velocity.x > 500) go(1);
    else if (info.offset.x < -60 || info.velocity.x < -500) go(-1);
  }

  const autoplaying = inView && !paused;

  return (
    <div ref={rootRef} className="md:hidden">
      <ScrollReactiveCard>
        <LachakiCardFrame arch={`${toFaPad(index + 1)}/۰۴`} className="mt-4">
          <div className="relative grid overflow-hidden rounded-[1.75rem] bg-card shadow-ambient">
            {/* height sizer: tallest slide reserves the space */}
            <div aria-hidden inert className="invisible col-start-1 row-start-1 grid">
              {paragraphs.map((p, i) => (
                <div key={p.id} className="col-start-1 row-start-1 p-5 pt-7">
                  <SlideBody p={p} i={i} />
                </div>
              ))}
            </div>
            <motion.div
              className="col-start-1 row-start-1 touch-pan-y"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.45}
              onDragStart={pause}
              onDragEnd={handleDragEnd}
              onPointerDown={pause}
            >
              <AnimatePresence mode="popLayout" initial={false} custom={dir}>
                <motion.div
                  key={paragraphs[index].id}
                  custom={dir}
                  variants={{
                    enter: (d: number) => ({ opacity: 0, x: d * -56, rotateY: d * -18 }),
                    center: { opacity: 1, x: 0, rotateY: 0 },
                    exit: (d: number) => ({ opacity: 0, x: d * 56, rotateY: d * 18 }),
                  }}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={SPRING}
                  className="h-full p-5 pt-7 [transform-style:preserve-3d]"
                >
                  <SlideBody p={paragraphs[index]} i={index} />
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </LachakiCardFrame>
      </ScrollReactiveCard>

      <div className="mt-3 flex items-center justify-between">
        <motion.button
          type="button"
          onClick={() => {
            pause();
            go(-1);
          }}
          whileTap={{ scale: 0.9 }}
          transition={SPRING}
          aria-label="روایت قبلی"
          className="grid h-12 w-12 place-items-center rounded-full border border-ink/10 bg-card text-ink"
        >
          <ChevronRight className="h-5 w-5" />
        </motion.button>
        <div className="flex items-center" role="tablist" aria-label="روایت‌های تاریخی">
          {paragraphs.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={p.label}
              onClick={() => {
                pause();
                setDir(i > index ? 1 : -1);
                setIndex(i);
              }}
              className="grid h-12 w-12 place-items-center"
            >
              <span className={cn("relative block h-1.5 overflow-hidden rounded-full bg-ink/15", i === index ? "w-8" : "w-3")}>
                {i === index && (
                  <motion.span
                    key={`${index}-${autoplaying}`}
                    className="absolute inset-0 origin-right rounded-full bg-terracotta"
                    initial={{ scaleX: autoplaying ? 0 : 1 }}
                    animate={{ scaleX: 1 }}
                    transition={autoplaying ? { duration: AUTO_MS / 1000, ease: "linear" } : SPRING}
                  />
                )}
              </span>
            </button>
          ))}
        </div>
        <motion.button
          type="button"
          onClick={() => {
            pause();
            go(1);
          }}
          whileTap={{ scale: 0.9 }}
          transition={SPRING}
          aria-label="روایت بعدی"
          className="grid h-12 w-12 place-items-center rounded-full bg-ink text-canvas"
        >
          <ChevronLeft className="h-5 w-5" />
        </motion.button>
      </div>
    </div>
  );
}

/* ─────────────────────────── the deck ─────────────────────────── */

export function StoryDeck() {
  const [p1, p2, p3, p4] = HERO_CONTENT.paragraphs;

  return (
    <section id="story" aria-labelledby="story-title" className="relative mx-auto max-w-[1320px] scroll-mt-20 px-4 py-8 md:scroll-mt-28 md:px-8 md:py-14">
      {/* Shamseh behind the historical deck */}
      <ShamsehMedallion className="absolute top-24 -left-40 -z-10 hidden h-[30rem] w-[30rem] opacity-[0.16] md:block" period={110} />

      <SectionHeading index="۰۱" eyebrow="روایت تاریخی" title="روایت شیرینی‌پزی یزد" id="story-title" />

      {/* ── mobile: lead quote + swipeable deck ── */}
      <div className="md:hidden">
        <motion.figure
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={SPRING}
          className="relative mt-5 overflow-hidden rounded-[1.5rem] border border-saffron/30 bg-sand/70 p-5"
        >
          <Quote className="h-5 w-5 -scale-x-100 text-terracotta-deep" strokeWidth={1.8} />
          <blockquote className="mt-2 text-[1.05rem] leading-[1.9] font-extrabold text-ink">
            <TaglineLines text={HERO_CONTENT.tagline} />
          </blockquote>
        </motion.figure>
        <MobileStoryDeck paragraphs={HERO_CONTENT.paragraphs} />
      </div>

      {/* ── desktop: architectural bento ── */}
      <motion.div
        className="mt-10 hidden gap-5 md:grid lg:grid-cols-12"
        variants={staggerParent(0.08)}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.15 }}
      >
        <StoryCard index="۰۱" label={p1.label} className="lg:col-span-7 lg:row-span-2">
          <KheshtPattern id="khesht-story" className="absolute -inset-8 h-[calc(100%+4rem)] w-[calc(100%+4rem)] text-ink/[0.035]" />
          <p className="relative text-lg leading-[2.05] font-medium text-body md:text-[1.3rem] md:leading-[2.05] text-pretty-fa">{p1.text}</p>
          <div aria-hidden className="relative mt-8 mb-6 hidden grid-cols-3 items-end gap-4 lg:grid">
            {ARCH_TRIO.map((sweet, i) => (
              <motion.div
                key={sweet.id}
                whileHover={{ y: -6 }}
                transition={SPRING}
                className={cn("overflow-hidden rounded-t-[50%_40%] rounded-b-2xl border border-ink/10 bg-sand", i === 1 ? "mb-5" : "")}
              >
                <AdaptiveImage src={sweet.image} alt="" aspectRatio="aspect-[5/4]" hoverZoom="self" sizes="220px" />
              </motion.div>
            ))}
          </div>
          <figure className="relative mt-8 border-t border-ink/10 pt-6 lg:mt-auto">
            <Quote className="h-6 w-6 -scale-x-100 text-terracotta-deep" strokeWidth={1.6} />
            <blockquote className="mt-3 max-w-lg text-lg leading-9 font-extrabold text-ink md:text-xl md:leading-10">
              <TaglineLines text={HERO_CONTENT.tagline} />
            </blockquote>
          </figure>
        </StoryCard>

        <StoryCard index="۰۲" label={p2.label} className="lg:col-span-5">
          <ClimateParagraph text={p2.text} />
        </StoryCard>

        <StoryCard index="۰۳" label={p3.label} className="lg:col-span-5">
          <p className="copy-fa text-pretty-fa">{p3.text}</p>
          <HistoryTimeline />
        </StoryCard>

        <StoryCard index="۰۴" label={p4.label} className="lg:col-span-12">
          <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] lg:gap-10">
            <p className="copy-fa text-pretty-fa">{p4.text}</p>
            <AmbassadorChips />
          </div>
        </StoryCard>
      </motion.div>
    </section>
  );
}
