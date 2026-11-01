"use client";

import { motion } from "framer-motion";
import type { CSSProperties } from "react";
import { Droplet, Flower2, Leaf, Nut, type LucideIcon } from "lucide-react";
import { SPRING } from "@/lib/motion";
import { cn, hexToRgba } from "@/lib/utils";

interface Spice {
  label: string;
  color: string;
  icon: LucideIcon;
  position: string;
  floatDuration: number;
  floatDistance: number;
}

const SPICES: Spice[] = [
  {
    label: "هل سبز",
    color: "#5C7A45",
    icon: Leaf,
    position: "top-[9%] -right-5 sm:-right-6",
    floatDuration: 5.2,
    floatDistance: 9,
  },
  {
    label: "زعفران قائنات",
    color: "#D48C29",
    icon: Flower2,
    position: "top-[30%] -left-5 sm:-left-10",
    floatDuration: 6.3,
    floatDistance: 11,
  },
  {
    label: "گلاب ناب",
    color: "#B85D3B",
    icon: Droplet,
    position: "top-[45%] -right-5 sm:-right-10",
    floatDuration: 5.7,
    floatDistance: 8,
  },
  {
    label: "مغز پسته و بادام",
    color: "#9E6240",
    icon: Nut,
    position: "top-[60%] -left-5 sm:-left-12",
    floatDuration: 6.8,
    floatDistance: 10,
  },
];

/**
 * Floating spice badges orbiting the hero arch. They drift on their own,
 * spring on hover, and can be playfully dragged — they always snap home.
 */
export function SpiceBadges() {
  return (
    <>
      {SPICES.map((spice, i) => {
        const Icon = spice.icon;
        return (
          <motion.div
            key={spice.label}
            className={cn("absolute z-20", spice.position)}
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ ...SPRING, delay: 0.6 + i * 0.12 }}
          >
            {/* compositor-thread float: never stutters, whatever the main thread is doing */}
            <div
              className="float-y"
              style={
                {
                  "--float-d": `${spice.floatDistance}px`,
                  "--float-dur": `${spice.floatDuration}s`,
                  "--float-delay": `${-i * 1.3}s`,
                } as CSSProperties
              }
            >
              <motion.div
                drag
                dragSnapToOrigin
                dragElastic={0.35}
                whileHover={{ scale: 1.07, rotate: i % 2 === 0 ? -3 : 3 }}
                whileTap={{ scale: 0.96 }}
                tabIndex={-1}
                aria-hidden
                whileDrag={{ scale: 1.12, cursor: "grabbing" }}
                transition={SPRING}
                className="flex cursor-grab touch-none select-none items-center gap-2 rounded-full border border-ink/10 bg-card/95 py-1.5 ps-1.5 pe-3.5 text-[13px] font-semibold text-ink shadow-ambient"
              >
                <span
                  className="grid h-7 w-7 place-items-center rounded-full"
                  style={{ backgroundColor: hexToRgba(spice.color, 0.14), color: spice.color }}
                >
                  <Icon className="h-3.5 w-3.5" strokeWidth={2} />
                </span>
                {spice.label}
              </motion.div>
            </div>
          </motion.div>
        );
      })}
    </>
  );
}
