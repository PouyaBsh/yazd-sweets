"use client";

import { motion } from "framer-motion";
import { Award, Coffee, Droplet, ExternalLink, Flame, Info, Landmark, Leaf, type LucideIcon } from "lucide-react";
import { AmbientSpiceParticles } from "@/components/kinetic/AmbientSpiceParticles";
import { ScrollReactiveCard } from "@/components/kinetic/ScrollReactiveCard";
import { DesertSaffronAmbient, GirihPatternCanvas, LachakiCardFrame, ShamsehMedallion } from "@/components/ornaments";
import { MagneticButton } from "@/components/ui/MagneticButton";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { YAZDI_COFFEE_DATA } from "@/data/yazd-content";
import { fadeUp, SPRING, staggerParent } from "@/lib/motion";
import { PhotoDeck } from "./PhotoDeck";

const SPEC_ICONS: Record<string, LucideIcon> = {
  "مواد اصلی": Leaf,
  طعم: Droplet,
  "روش تهیه": Flame,
  "نحوه سرو": Coffee,
  "کاربرد سنتی": Landmark,
};

/** Small labels for paragraphs 2–4 (the copy itself is untouched). */
const PARAGRAPH_LABELS = ["پیشینه", "پیوند با آیین‌ها", "ثبت ملی"];

function splitNote(note: string) {
  const i = note.indexOf(":");
  return i === -1 ? { label: "", body: note } : { label: note.slice(0, i + 1), body: note.slice(i + 1) };
}

/** Section 3 — «قهوه یزدی؛ عطر سنت و آیین‌های کهن» */
export function CoffeeSection() {
  const data = YAZDI_COFFEE_DATA;
  const [lead, ...rest] = data.paragraphs;
  const note = splitNote(data.historicalNote);

  return (
    <div className="mx-auto max-w-[1440px]">
      <section
        id="yazdi-coffee"
        data-anim-scope
        aria-labelledby="coffee-title"
        className="cv-auto relative isolate mx-4 my-8 scroll-mt-20 overflow-hidden rounded-[2rem] bg-[#1A1412] p-5 text-[#F5EFE6] sm:p-8 md:mx-8 md:my-12 md:scroll-mt-24 md:p-14"
      >
        {/* atmosphere: dark girih lattice, glowing copper-gold shamseh, desert light, drifting spice */}
        <DesertSaffronAmbient tone="dark" motifs={false} className="z-0" />
        <GirihPatternCanvas tone="dark" className="z-0" />
        <ShamsehMedallion tone="gold" className="absolute -top-36 -right-36 z-0 h-[26rem] w-[26rem] opacity-[0.22] md:h-[34rem] md:w-[34rem]" period={120} />
        <ShamsehMedallion tone="gold" className="absolute -bottom-40 -left-40 z-0 hidden h-[28rem] w-[28rem] opacity-[0.12] lg:block" period={150} />
        <AmbientSpiceParticles tone="dark" count={14} seed={23} className="z-0" />

        <div className="relative z-[1] grid gap-10 lg:grid-cols-12 lg:gap-14">
          {/* narrative */}
          <div className="lg:col-span-7">
            <SectionHeading index="۰۳" eyebrow="آیین قهوه یزدی" title={data.title} id="coffee-title" tone="dark" />

            <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={SPRING} className="mt-5 md:mt-6">
              <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-[#F5EFE6]/15 bg-firuzeh py-1.5 ps-1.5 pe-4 text-xs font-bold text-[#F5EFE6] sm:text-[13px]">
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#F5EFE6]/15">
                  <Award className="h-3.5 w-3.5" />
                </span>
                <span className="min-w-0">{data.heritageBadge}</span>
              </span>
            </motion.div>

            <motion.div variants={staggerParent(0.08)} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.2 }}>
              <motion.p variants={fadeUp} className="mt-6 text-[1rem] leading-[1.9] text-[#F5EFE6]/90 sm:text-lg md:mt-8 md:text-[1.2rem] md:leading-10 text-pretty-fa">
                {lead}
              </motion.p>

              <div className="mt-7 grid gap-x-8 gap-y-6 md:mt-8 md:grid-cols-2">
                {rest.map((paragraph, i) => (
                  <motion.div key={i} variants={fadeUp} className={i === rest.length - 1 ? "border-s-2 border-firuzeh ps-4 md:col-span-2 md:ps-5" : ""}>
                    <h3 className="text-xs font-bold text-saffron">{PARAGRAPH_LABELS[i]}</h3>
                    <p className="mt-2 text-[0.95rem] leading-[1.85] text-[#F5EFE6]/75 sm:text-[1.02rem] text-pretty-fa">{paragraph}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* stacked photo deck */}
          <div className="lg:col-span-5 lg:pt-6">
            <PhotoDeck images={data.images} />
          </div>

          {/* specs — glass cards with lachaki corners */}
          <div className="lg:col-span-12">
            <div className="mb-4 flex items-center gap-3">
              <h3 className="text-base font-extrabold text-[#F5EFE6]">ویژگی‌های قهوه یزدی</h3>
              <span aria-hidden className="h-px flex-1 bg-[#F5EFE6]/10" />
            </div>
            <motion.ul
              className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-5"
              variants={staggerParent(0.07)}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, amount: 0.25 }}
            >
              {data.specs.map((spec) => {
                const Icon = SPEC_ICONS[spec.label] ?? Coffee;
                return (
                  <motion.li key={spec.label} variants={fadeUp} className="last:col-span-2 lg:last:col-span-1">
                    <ScrollReactiveCard className="h-full" lift={3}>
                      <LachakiCardFrame tone="dark" size="sm" radius="rounded-2xl" innerRadius="rounded-[0.7rem]" className="h-full">
                        <motion.div
                          whileTap={{ scale: 0.96 }}
                          tabIndex={-1}
                          transition={SPRING}
                          className="h-full rounded-2xl bg-[#F5EFE6]/[0.06] p-4 sm:p-5"
                        >
                          <span className="grid h-9 w-9 place-items-center rounded-xl bg-saffron/15 text-saffron">
                            <Icon className="h-4 w-4" strokeWidth={1.8} />
                          </span>
                          <p className="mt-3 text-xs font-semibold text-[#F5EFE6]/70 sm:mt-4">{spec.label}</p>
                          <p className="mt-1 text-[0.85rem] leading-relaxed font-bold text-[#F5EFE6] sm:text-[15px] sm:leading-7">{spec.value}</p>
                        </motion.div>
                      </LachakiCardFrame>
                    </ScrollReactiveCard>
                  </motion.li>
                );
              })}
            </motion.ul>
          </div>

          {/* historical note + citation */}
          <div className="grid gap-5 lg:col-span-12 lg:grid-cols-12 lg:items-center">
            <motion.aside
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={SPRING}
              className="flex gap-3.5 rounded-2xl border border-saffron/60 bg-saffron/[0.07] p-4 sm:gap-4 md:p-6 lg:col-span-8"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-saffron text-[#1A1412]">
                <Info className="h-5 w-5" strokeWidth={2} />
              </span>
              <p className="text-[0.95rem] leading-[1.85] text-[#F5EFE6]/85 sm:text-[15px] sm:leading-8">
                {note.label && <strong className="font-extrabold text-saffron">{note.label}</strong>}
                {note.body}
              </p>
            </motion.aside>

            <div className="flex flex-col items-stretch gap-2 sm:items-start lg:col-span-4 lg:items-end">
              <span className="text-xs text-[#F5EFE6]/70">برای مطالعه بیشتر</span>
              <MagneticButton
                href={data.externalLink.url}
                external
                sheen
                ariaLabel={`${data.externalLink.label} (در پنجره جدید باز می‌شود)`}
                className="min-h-[52px] w-full rounded-full bg-saffron px-6 py-3.5 text-[15px] font-extrabold text-[#1A1412] shadow-glow sm:w-auto"
              >
                <span className="text-center">{data.externalLink.label}</span>
                <ExternalLink className="h-4 w-4 shrink-0" strokeWidth={2} />
              </MagneticButton>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
