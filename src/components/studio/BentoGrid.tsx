"use client";

import { motion } from "framer-motion";
import { Ellipsis } from "lucide-react";
import { AdaptiveImage } from "@/components/AdaptiveImage";
import { useExperience } from "@/components/experience/ExperienceContext";
import { ScrollReactiveCard, useReactive } from "@/components/kinetic/ScrollReactiveCard";
import { LachakiCardFrame } from "@/components/ornaments";
import { SWEETS_DATA, type SweetItem } from "@/data/yazd-content";
import { fadeUp, SPRING, staggerParent } from "@/lib/motion";
import { cn, hexToRgba } from "@/lib/utils";
import { SweetnessGauge } from "./SweetnessGauge";

/** 4-column architectural rhythm on desktop: [2][1][1] / [1][1][2] — 6 cards in 2 rows. */
const SPANS = ["lg:col-span-2", "", "", "", "", "lg:col-span-2"];

function BentoCard({ sweet, wide, selected, onOpen }: { sweet: SweetItem; wide: boolean; selected: boolean; onOpen: (id: string) => void }) {
  // hover on desktop · viewport-centre on touch — both drive the same "hover" state
  const active = useReactive();
  return (
    <LachakiCardFrame className="h-full" active={active || selected ? true : undefined}>
      <motion.button
        type="button"
        onClick={() => onOpen(sweet.id)}
        initial="rest"
        animate={active ? "hover" : "rest"}
        whileTap={{ scale: 0.985 }}
        transition={SPRING}
        aria-label={`نمایش کامل ویژگی‌های ${sweet.name}`}
        className={cn("group relative flex h-full w-full flex-col overflow-hidden rounded-[1.75rem] bg-card text-start shadow-ambient", wide && "lg:flex-row")}
      >
        <div className={cn("relative h-48 w-full shrink-0 overflow-hidden sm:h-56 lg:h-auto lg:min-h-0 lg:flex-1", wide && "lg:w-[56%] lg:flex-none")}>
          <AdaptiveImage src={sweet.image} alt={sweet.imageAlt} aspectRatio="h-full" hoverZoom="parent" sizes="(max-width: 1024px) 50vw, 33vw" />
          <span className="absolute top-3 right-3 rounded-full bg-canvas/95 px-2.5 py-0.5 text-xs font-black text-ink">{sweet.order}</span>
        </div>

        <div className={cn("flex flex-col gap-3 p-4 sm:p-5", wide && "lg:flex-1 lg:justify-between lg:p-6")}>
          <div>
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-lg font-extrabold text-ink">{sweet.name}</h3>
                <p className="mt-0.5 text-[13px] text-umber">{sweet.shortTag}</p>
              </div>
              {/* «…» more-details affordance: an SVG ellipsis is optically centred (a typed "..." sits on the baseline) */}
              <motion.span
                aria-hidden
                data-more
                variants={{
                  rest: { scale: 1, backgroundColor: "rgba(242,234,224,0.9)" },
                  hover: { scale: 1.08, backgroundColor: hexToRgba(sweet.accentColor, 0.2) },
                }}
                transition={SPRING}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-ink/10 text-ink"
              >
                <Ellipsis className="block h-5 w-5" strokeWidth={2.4} />
              </motion.span>
            </div>
            {wide && <p className="copy-fa mt-4 hidden lg:line-clamp-5 lg:text-sm lg:leading-7">{sweet.description}</p>}
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold text-umber">
              <span>میزان شیرینی</span>
              <span>{sweet.specs.sweetnessLabel}</span>
            </div>
            <SweetnessGauge level={sweet.specs.sweetnessLevel} accent={sweet.accentColor} compact />
          </div>
        </div>
      </motion.button>
    </LachakiCardFrame>
  );
}

export function BentoGrid({ onOpen }: { onOpen: (id: string) => void }) {
  const { selectedSweetId } = useExperience();

  return (
    <motion.div layout className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5" variants={staggerParent(0.06)} initial="hidden" animate="show">
      {SWEETS_DATA.map((sweet, i) => (
        <motion.article key={sweet.id} layout variants={fadeUp} transition={SPRING} className={cn("lg:h-[23rem]", SPANS[i])}>
          <ScrollReactiveCard className="h-full">
            <BentoCard sweet={sweet} wide={SPANS[i] !== ""} selected={sweet.id === selectedSweetId} onOpen={onOpen} />
          </ScrollReactiveCard>
        </motion.article>
      ))}
    </motion.div>
  );
}
