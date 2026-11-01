import { AmbientSpiceParticles } from "@/components/kinetic/AmbientSpiceParticles";
import { DesertSaffronAmbient, GirihPatternCanvas } from "@/components/ornaments";
import { ArchOutline } from "@/components/ui/Ornaments";
import { GalleryDock } from "./GalleryDock";
import { HeroIntro } from "./HeroIntro";
import { StoryDeck } from "./StoryDeck";

/** Section 1 — editorial hero, heritage story deck and the quick-jump gallery dock. */
export function HeroSection() {
  return (
    <section aria-label="یزد؛ شهر شیرینی‌های اصیل ایرانی" className="relative isolate">
      {/* atmosphere: girih lattice, warm desert light, faint arches, drifting spice motes */}
      <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[56rem] overflow-hidden">
        <div className="absolute inset-0 bg-linear-to-b from-sand/70 via-canvas to-canvas" />
        <GirihPatternCanvas />
        <div className="absolute -top-24 left-1/2 flex -translate-x-1/2 gap-10 opacity-60">
          {[0, 1, 2, 3, 4].map((i) => (
            <ArchOutline key={i} className="h-[30rem] w-48 text-ink/[0.05]" />
          ))}
        </div>
      </div>
      <DesertSaffronAmbient edgeFade="bottom" />
      <AmbientSpiceParticles className="-z-10 h-[56rem]" count={16} seed={11} />
      <HeroIntro />
      <StoryDeck />
      <GalleryDock />
    </section>
  );
}
