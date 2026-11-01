"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Coffee } from "lucide-react";
import { useCanHover } from "@/components/kinetic/hooks";
import { ShamsehMedallion } from "@/components/ornaments";
import { HERO_CONTENT } from "@/data/yazd-content";
import { fadeUp, SPRING, staggerParent } from "@/lib/motion";
import { cn, scrollToSection } from "@/lib/utils";
import { KineticTitle } from "./KineticTitle";
import { HeroArch } from "./HeroArch";

/** Plain words (no icons) set in the same type as «۱۳۹۸»; only the date carries a caption. */
const STATS: { title: string; caption?: string }[] = [
  { title: "شیرینی‌های اصیل" },
  { title: "قهوه یزدی" },
  { title: "۱۳۹۸", caption: "ثبت ملی قهوه یزدی" },
];

// phones: may wrap onto two lines (balances the date + caption column) · sm+: one line each
const STAT_TYPE = "text-xl leading-snug font-black text-ink sm:text-2xl sm:whitespace-nowrap md:text-[1.7rem]";

export function HeroIntro() {
  const canHover = useCanHover();

  return (
    <div
      id="hero"
      className="relative mx-auto grid max-w-[1320px] items-center gap-10 px-4 pt-24 pb-6 md:px-8 md:pt-36 lg:grid-cols-12 lg:gap-10 lg:pb-14"
    >
      {/* Shamseh halo behind the title */}
      <ShamsehMedallion className="absolute top-10 -right-24 -z-10 h-[26rem] w-[26rem] opacity-[0.22] md:top-16 md:-right-16 md:h-[34rem] md:w-[34rem] lg:right-[18%]" />

      <motion.div className="relative lg:col-span-7" variants={staggerParent(0.09, 0.1)} initial="hidden" animate="show">
        <motion.span
          variants={fadeUp}
          className="inline-flex items-center gap-2.5 rounded-full border border-ink/10 bg-card/80 py-1.5 ps-2.5 pe-4 text-[13px] font-semibold text-umber"
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-firuzeh/50" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-firuzeh" />
          </span>
          {HERO_CONTENT.badge}
        </motion.span>

        <KineticTitle text={HERO_CONTENT.title} className="mt-5 md:mt-6" />

        <motion.p variants={fadeUp} className="copy-fa mt-5 max-w-xl text-pretty-fa md:mt-6 md:text-[1.2rem] md:leading-[1.95]">
          {HERO_CONTENT.tagline}
        </motion.p>

        <motion.div variants={fadeUp} className="mt-7 flex flex-wrap items-center gap-3 md:mt-9">
          <motion.button
            type="button"
            onClick={() => scrollToSection("sweet-studio")}
            initial="rest"
            animate="rest"
            whileHover="hover"
            whileTap={{ scale: 0.97 }}
            variants={{ rest: { y: 0 }, hover: { y: -2 } }}
            transition={SPRING}
            className="inline-flex min-h-12 items-center gap-3 rounded-full bg-ink py-2 ps-6 pe-2 text-[15px] font-bold text-canvas"
          >
            ورود به استودیو شیرینی‌ها
            {/* desktop: nudges on hover · touch: nudges on its own so the CTA still feels alive */}
            <motion.span
              variants={{ rest: { x: 0 }, hover: { x: -4 } }}
              animate={canHover ? undefined : { x: [0, -5, 0] }}
              transition={canHover ? SPRING : { duration: 1.6, repeat: Infinity, repeatDelay: 1.4, ease: "easeInOut" }}
              className="grid h-9 w-9 place-items-center rounded-full bg-canvas/15"
            >
              <ArrowLeft className="h-4 w-4" />
            </motion.span>
          </motion.button>
          <motion.button
            type="button"
            onClick={() => scrollToSection("yazdi-coffee")}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.97 }}
            transition={SPRING}
            className="inline-flex min-h-12 items-center gap-2.5 rounded-full border border-ink/15 bg-card/70 px-5 text-[15px] font-bold text-ink"
          >
            <Coffee className="h-4 w-4 text-terracotta-deep" strokeWidth={1.8} />
            آیین قهوه یزدی
          </motion.button>
        </motion.div>

        <motion.ul variants={fadeUp} className="mt-9 grid max-w-lg grid-cols-3 border-y border-ink/10 sm:grid-cols-[auto_auto_1fr] md:mt-12">
          {STATS.map((stat, i) => (
            <li key={stat.title} className={cn("min-w-0 py-3.5 md:py-4", i > 0 && "border-s border-ink/10 ps-3 sm:ps-5", i < 2 && "sm:pe-5")}>
              <p className={STAT_TYPE}>{stat.title}</p>
              {stat.caption && <p className="mt-0.5 text-xs leading-6 text-umber sm:text-[13px]">{stat.caption}</p>}
            </li>
          ))}
        </motion.ul>
      </motion.div>

      <div className="relative lg:col-span-5">
        <HeroArch />
      </div>
    </div>
  );
}
