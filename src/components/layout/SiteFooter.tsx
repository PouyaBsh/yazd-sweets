"use client";

import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { KashikariRibbon } from "@/components/ornaments";
import { BadgirSkyline, KhatamStar } from "@/components/ui/Ornaments";
import { HERO_CONTENT } from "@/data/yazd-content";
import { SPRING } from "@/lib/motion";
import { scrollToSection } from "@/lib/utils";

const LINKS = [
  { id: "story", label: "روایت تاریخی" },
  { id: "sweet-studio", label: "استودیو شیرینی‌ها" },
  { id: "yazdi-coffee", label: "آیین قهوه یزدی" },
];

export function SiteFooter() {
  return (
    <footer className="mx-auto max-w-[1320px] px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] md:px-8 md:pb-10">
      <div className="relative">
        <BadgirSkyline className="h-12 w-full text-ink/[0.06] md:h-16" />
        <KashikariRibbon className="mt-1 opacity-80" />
      </div>
      <div className="flex flex-col gap-5 pt-6 md:flex-row md:items-center md:justify-between md:pt-8">
        <div className="flex items-center gap-3">
          <KhatamStar className="h-8 w-8 text-terracotta" />
          <div>
            <p className="font-extrabold text-ink">{HERO_CONTENT.title}</p>
            <p className="text-sm text-umber">{HERO_CONTENT.badge}</p>
          </div>
        </div>

        <nav aria-label="پیوندهای پایانی" className="flex flex-wrap items-center gap-x-2 text-sm text-umber">
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

        <motion.button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          initial="rest"
          animate="rest"
          whileHover="hover"
          whileTap={{ scale: 0.94 }}
          transition={SPRING}
          className="inline-flex min-h-12 items-center gap-2 self-start rounded-full border border-ink/10 bg-card px-5 text-sm font-bold text-ink md:self-auto"
        >
          بازگشت به بالا
          <motion.span variants={{ rest: { y: 0 }, hover: { y: -3 } }} transition={SPRING}>
            <ArrowUp className="h-4 w-4" />
          </motion.span>
        </motion.button>
      </div>
    </footer>
  );
}
