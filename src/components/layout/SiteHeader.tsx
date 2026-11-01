"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { BookOpen, CakeSlice, Coffee, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { KashikariRibbon } from "@/components/ornaments";
import { KhatamStar } from "@/components/ui/Ornaments";
import { SPRING } from "@/lib/motion";
import { scrollToSection } from "@/lib/utils";

const NAV_ITEMS: { id: string; label: string; short: string; icon: LucideIcon }[] = [
  { id: "story", label: "روایت تاریخی", short: "روایت", icon: BookOpen },
  { id: "sweet-studio", label: "استودیو شیرینی‌ها", short: "استودیو", icon: CakeSlice },
  { id: "yazdi-coffee", label: "آیین قهوه یزدی", short: "قهوه", icon: Coffee },
];

const INK = "#1C1613";
const UMBER = "#5E5249";

/**
 * Mobile (<768px): full-width sticky top bar, h-14, emblem + three one-line section pills
 *                  (44px targets) and a hairline kashikari frieze along its bottom edge.
 * Desktop:         floating glass pill with the brand and section anchors.
 */
export function SiteHeader() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { scrollY } = useScroll();
  // build the shadow from a number so it interpolates smoothly in both directions
  const lift = useTransform(scrollY, [0, 140], [0, 1]);
  const elevation = useTransform(
    lift,
    (v) => `0 1px 2px rgba(28,22,19,${(0.04 * v).toFixed(3)}), 0 16px 36px -22px rgba(28,22,19,${(0.3 * v).toFixed(3)})`,
  );

  // Scroll-spy: which section is under the middle of the viewport.
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          setActiveSection(entry.target.id === "hero" ? null : entry.target.id);
        }
      },
      { rootMargin: "-45% 0px -50% 0px" },
    );
    ["hero", ...NAV_ITEMS.map((item) => item.id)].forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  return (
    <motion.header
      data-audit-overlay
      initial={{ y: -28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ ...SPRING, delay: 0.1 }}
      className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center md:top-5 md:px-3"
    >
      <motion.nav
        aria-label="ناوبری اصلی"
        style={{ boxShadow: elevation }}
        className="pointer-events-auto relative flex h-14 w-full items-center gap-1 border-b border-ink/10 bg-canvas/85 px-2 backdrop-blur-md sm:px-3 md:h-auto md:w-auto md:gap-0.5 md:rounded-full md:border md:p-1.5"
      >
        <motion.a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          whileHover={{ rotate: -8, scale: 1.04 }}
          whileTap={{ scale: 0.94 }}
          transition={SPRING}
          className="flex h-12 min-w-12 shrink-0 items-center justify-center gap-2 rounded-full px-2 md:h-10 md:min-w-10 lg:pe-3"
          aria-label="بازگشت به ابتدای صفحه"
        >
          <KhatamStar className="h-6 w-6 text-terracotta md:h-5 md:w-5" />
          <span className="hidden text-sm font-extrabold text-ink lg:inline">سوغات یزد</span>
        </motion.a>

        <span aria-hidden className="mx-0.5 hidden h-5 w-px bg-ink/10 md:block" />

        <ul className="flex flex-1 items-center justify-end gap-1 md:flex-none md:justify-start md:gap-0.5">
          {NAV_ITEMS.map(({ id, label, short, icon: Icon }) => {
            const active = activeSection === id;
            return (
              <li key={id}>
                <motion.a
                  href={`#${id}`}
                  onClick={(e) => {
                    e.preventDefault();
                    scrollToSection(id);
                  }}
                  aria-current={active ? "true" : undefined}
                  aria-label={label}
                  whileHover={{ y: -1 }}
                  whileTap={{ scale: 0.95 }}
                  transition={SPRING}
                  className="relative flex h-12 min-w-12 items-center justify-center rounded-full px-3 text-[13px] font-semibold whitespace-nowrap md:h-10 md:px-3.5"
                >
                  {active && (
                    <motion.span
                      layoutId="header-nav-pill"
                      transition={SPRING}
                      className="absolute inset-0 rounded-full border border-ink/5 bg-sand"
                    />
                  )}
                  <motion.span className="relative flex items-center gap-1.5" animate={{ color: active ? INK : UMBER }} transition={SPRING}>
                    <Icon className="h-4 w-4 md:hidden" strokeWidth={1.8} />
                    <span className="md:hidden">{short}</span>
                    <span className="hidden md:inline">{label}</span>
                  </motion.span>
                </motion.a>
              </li>
            );
          })}
        </ul>

        {/* compact ornamental frieze — mobile only */}
        <KashikariRibbon className="absolute inset-x-0 -bottom-[10px] h-[18px] scale-y-50 opacity-70 md:hidden" />
      </motion.nav>
    </motion.header>
  );
}
