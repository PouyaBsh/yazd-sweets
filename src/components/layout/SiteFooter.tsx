"use client";

import { motion } from "framer-motion";
import { Send } from "lucide-react";
import { KashikariRibbon } from "@/components/ornaments";
import { YazdSkylinePanorama } from "@/components/ornaments/YazdSkylinePanorama";
import { KhatamStar } from "@/components/ui/Ornaments";
import { HERO_CONTENT } from "@/data/yazd-content";
import { SPRING } from "@/lib/motion";
import { scrollToSection } from "@/lib/utils";

const LINKS = [
  { id: "story", label: "روایت تاریخی" },
  { id: "sweet-studio", label: "استودیو شیرینی‌ها" },
  { id: "yazdi-coffee", label: "آیین قهوه یزدی" },
];

const TELEGRAM_HANDLE = "sweet_yazd";

/** Telegram channel card: paper-plane badge + handle; the plane takes off on hover / press. */
function TelegramLink() {
  return (
    <motion.a
      href={`https://t.me/${TELEGRAM_HANDLE}`}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`کانال تلگرام: @${TELEGRAM_HANDLE}`}
      initial="rest"
      animate="rest"
      whileHover="hover"
      whileTap="press"
      variants={{ rest: { y: 0 }, hover: { y: -3 }, press: { scale: 0.97 } }}
      transition={SPRING}
      data-telegram
      className="group relative inline-flex min-h-14 items-center gap-3 rounded-full border border-firuzeh/20 bg-card py-1.5 ps-1.5 pe-5 text-start shadow-ambient"
    >
      <motion.span
        aria-hidden
        className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-firuzeh text-heritage-ink"
        variants={{ rest: { rotate: 0 }, hover: { rotate: -8 }, press: { rotate: -8 } }}
        transition={SPRING}
      >
        <motion.span
          className="grid place-items-center"
          variants={{ rest: { x: 0, y: 0 }, hover: { x: 2, y: -2 }, press: { x: 4, y: -4 } }}
          transition={SPRING}
        >
          <Send className="h-[18px] w-[18px] -translate-x-px translate-y-px" strokeWidth={2} />
        </motion.span>
      </motion.span>
      <span className="flex flex-col leading-tight">
        <span className="text-[11px] font-semibold text-umber">کانال تلگرام ما</span>
        <span dir="ltr" className="mt-0.5 text-[17px] font-black tracking-wide text-ink">
          <span className="text-firuzeh">@</span>
          {TELEGRAM_HANDLE}
        </span>
      </span>
    </motion.a>
  );
}

/** «ساخته شده با عشق» + a heart drawn in one pen stroke (it draws itself in — again each time it comes back into view — like ink from a pen). */
function MadeWithLove() {
  return (
    <p className="inline-flex items-center gap-2 text-[13px] font-semibold text-umber" data-made-with-love>
      ساخته شده با عشق
      <motion.svg
        viewBox="0 0 40 36"
        className="h-[22px] w-[24px] overflow-visible"
        fill="none"
        aria-hidden
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 1 }}
      >
        <motion.path
          d="M20.4 32.6C14.2 27.4 4.8 21.2 3.3 13.4C2.2 7.4 6.4 3.1 11.3 3.5C15.5 3.9 18.5 7.3 20 11C21.7 6.6 25.3 3.1 30.1 3.3C35.5 3.6 38.3 8.7 36.7 14.3C34.7 21.3 27 26.9 19.8 33.4C19 34.1 17.7 33.1 18.7 32.2"
          stroke="#B85D3B"
          strokeWidth={2.3}
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={{
            hidden: { pathLength: 0, opacity: 0, transition: { duration: 0 } },
            show: {
              pathLength: 1,
              opacity: 1,
              transition: { pathLength: { type: "spring", stiffness: 24, damping: 12, restDelta: 0.0005 }, opacity: { duration: 0.15 } },
            },
          }}
        />
        {/* the little ink blot where the pen lifted */}
        <motion.circle
          cx={18.7}
          cy={32.2}
          r={1.1}
          fill="#B85D3B"
          variants={{ hidden: { scale: 0, opacity: 0, transition: { duration: 0 } }, show: { scale: 1, opacity: 0.8, transition: { ...SPRING, delay: 1.5 } } }}
        />
      </motion.svg>
    </p>
  );
}

export function SiteFooter() {
  return (
    <footer data-anim-scope className="cv-auto mx-auto max-w-[1320px] px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-8 md:pb-10">
      <div className="relative">
        <YazdSkylinePanorama className="mx-auto h-auto max-h-40 w-full md:max-h-44" />
        <KashikariRibbon className="opacity-80" />
      </div>
      {/* phones: everything centred in one column · md+: brand | links | telegram in a row */}
      <div className="flex flex-col items-center gap-6 pt-7 text-center md:flex-row md:items-center md:justify-between md:pt-8 md:text-start">
        <div className="flex items-center justify-center gap-3">
          <KhatamStar className="h-8 w-8 shrink-0 text-terracotta" />
          <div className="text-start">
            <p className="font-extrabold text-ink">{HERO_CONTENT.title}</p>
            <p className="text-sm text-umber">{HERO_CONTENT.badge}</p>
          </div>
        </div>

        <nav aria-label="پیوندهای پایانی" className="flex flex-wrap items-center justify-center gap-x-2 text-sm text-umber md:justify-start">
          {LINKS.map((link) => (
            <motion.a
              key={link.id}
              href={`#${link.id}`}
              onClick={(e) => {
                e.preventDefault();
                scrollToSection(link.id);
              }}
              whileHover={{ y: -2, color: "#1C1613" }}
              transition={SPRING}
              className="inline-flex min-h-12 items-center px-2"
            >
              {link.label}
            </motion.a>
          ))}
        </nav>

        <div className="flex flex-col items-center gap-3 md:items-end">
          <TelegramLink />
          <MadeWithLove />
        </div>
      </div>
    </footer>
  );
}
