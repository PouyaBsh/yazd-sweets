"use client";

import { motion } from "framer-motion";
import { fadeUp, staggerParent } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface SectionHeadingProps {
  index: string;
  eyebrow: string;
  title: string;
  id?: string;
  description?: string;
  tone?: "light" | "dark";
  className?: string;
}

export function SectionHeading({ index, eyebrow, title, id, description, tone = "light", className }: SectionHeadingProps) {
  const dark = tone === "dark";
  return (
    <motion.div
      variants={staggerParent(0.07)}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.6 }}
      className={className}
    >
      <motion.div variants={fadeUp} className="flex items-center gap-3 text-[13px] font-bold">
        <span className={dark ? "text-saffron" : "text-terracotta-deep"}>{index}</span>
        <span aria-hidden className={cn("h-px w-8", dark ? "bg-heritage-ink/25" : "bg-ink/20")} />
        <span className={dark ? "text-heritage-ink/70" : "text-umber"}>{eyebrow}</span>
      </motion.div>
      <motion.h2
        id={id}
        variants={fadeUp}
        className={cn(
          "mt-2.5 text-[clamp(1.4rem,4vw,2.5rem)] leading-[1.35] font-extrabold text-balance-fa md:mt-3",
          dark ? "text-heritage-ink" : "text-ink",
        )}
      >
        {title}
      </motion.h2>
      {description && (
        <motion.p
          variants={fadeUp}
          className={cn("mt-2.5 max-w-xl text-[0.95rem] leading-[1.85] sm:text-[15px]", dark ? "text-heritage-ink/75" : "text-umber")}
        >
          {description}
        </motion.p>
      )}
    </motion.div>
  );
}
