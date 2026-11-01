"use client";

import { motion, type Variants } from "framer-motion";
import { Fragment } from "react";
import { SPRING } from "@/lib/motion";
import { cn } from "@/lib/utils";

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.085, delayChildren: 0.05 } },
};

const word: Variants = {
  hidden: { y: "105%", opacity: 0 },
  show: { y: "0%", opacity: 1, transition: SPRING },
};

const underline: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  show: { pathLength: 1, opacity: 1, transition: { ...SPRING, delay: 0.55 } },
};

/**
 * Staggered word reveal for the hero title. Words are kept whole (Persian letters
 * must stay joined), and "شیرینی‌های اصیل" gets a hand-drawn saffron underline.
 */
export function KineticTitle({
  text,
  highlight = [2, 3],
  className,
}: {
  text: string;
  highlight?: number[];
  className?: string;
}) {
  const words = text.split(" ");
  const first = Math.min(...highlight);
  const last = Math.max(...highlight);

  const renderWord = (w: string) => (
    <span className="inline-block overflow-hidden pb-[0.14em] align-bottom">
      <motion.span variants={word} className="inline-block">
        {w}
      </motion.span>
    </span>
  );

  return (
    <motion.h1
      variants={container}
      className={cn("text-[clamp(1.75rem,5.5vw,3.75rem)] leading-[1.3] font-black text-ink text-balance-fa", className)}
    >
      {words.map((w, i) => {
        if (i > first && i <= last) return null;
        if (i === first) {
          const group = words.slice(first, last + 1);
          return (
            <Fragment key={i}>
              <span className="relative inline-block text-terracotta">
                {group.map((g, j) => (
                  <Fragment key={g}>
                    {renderWord(g)}
                    {j < group.length - 1 && " "}
                  </Fragment>
                ))}
                <svg
                  aria-hidden
                  viewBox="0 0 300 20"
                  preserveAspectRatio="none"
                  className="pointer-events-none absolute inset-x-0 -bottom-[0.04em] h-[0.32em] w-full text-saffron"
                >
                  <motion.path
                    variants={underline}
                    d="M4 13 C 60 4, 120 18, 180 9 S 270 6, 296 11"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </svg>
              </span>
              {last < words.length - 1 && " "}
            </Fragment>
          );
        }
        return (
          <Fragment key={i}>
            {renderWord(w)}
            {i < words.length - 1 && " "}
          </Fragment>
        );
      })}
    </motion.h1>
  );
}
