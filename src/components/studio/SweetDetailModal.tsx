"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useRef } from "react";
import { AdaptiveImage } from "@/components/AdaptiveImage";
import { Kinetic3DShowcase } from "@/components/kinetic/Kinetic3DShowcase";
import { SWEETS_DATA } from "@/data/yazd-content";
import { SPRING } from "@/lib/motion";
import { SpecMatrix } from "./SpecMatrix";

interface SweetDetailModalProps {
  sweetId: string | null;
  onClose: () => void;
  onNavigate: (id: string) => void;
}

/** Full-spec dialog opened from the Bento grid. Esc closes; ←/→ browse the sweets. */
export function SweetDetailModal({ sweetId, onClose, onNavigate }: SweetDetailModalProps) {
  const sweet = sweetId ? (SWEETS_DATA.find((s) => s.id === sweetId) ?? null) : null;
  const closeRef = useRef<HTMLButtonElement>(null);
  const isOpen = sweet !== null;
  const index = sweet ? SWEETS_DATA.indexOf(sweet) : -1;

  const step = (delta: number) => {
    if (index < 0) return;
    onNavigate(SWEETS_DATA[(index + delta + SWEETS_DATA.length) % SWEETS_DATA.length].id);
  };

  useEffect(() => {
    if (!isOpen) return;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => closeRef.current?.focus(), 60);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus?.();
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (event: globalThis.KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      // RTL: left arrow = next, right arrow = previous
      if (event.key === "ArrowLeft") onNavigate(SWEETS_DATA[(index + 1) % SWEETS_DATA.length].id);
      if (event.key === "ArrowRight") onNavigate(SWEETS_DATA[(index - 1 + SWEETS_DATA.length) % SWEETS_DATA.length].id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, index, onClose, onNavigate]);

  return (
    <AnimatePresence>
      {sweet && (
        <motion.div
          key="sweet-dialog"
          className="fixed inset-0 z-45 flex items-end justify-center p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:items-center sm:p-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={SPRING}
        >
          <motion.button
            type="button"
            aria-label="بستن"
            tabIndex={-1}
            onClick={onClose}
            className="absolute inset-0 cursor-default bg-ink/45 backdrop-blur-sm"
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="sweet-dialog-title"
            initial={{ opacity: 0, y: 48, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 28, scale: 0.97 }}
            transition={SPRING}
            className="relative max-h-[92dvh] w-full max-w-5xl overflow-y-auto overscroll-contain rounded-[2rem] border border-ink/10 bg-card shadow-lift"
          >
            <div className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-ink/[0.06] bg-card/90 px-5 py-3 backdrop-blur-md md:px-7">
              <span className="text-[13px] font-bold text-umber">{sweet.order} / ۰۶ · نمای کامل</span>
              <div className="flex items-center gap-1.5">
                <motion.button
                  type="button"
                  onClick={() => step(-1)}
                  whileHover={{ x: 2 }}
                  whileTap={{ scale: 0.92 }}
                  transition={SPRING}
                  aria-label="شیرینی قبلی"
                  className="grid h-12 w-12 place-items-center rounded-full border border-ink/10 bg-canvas text-ink"
                >
                  <ChevronRight className="h-4 w-4" />
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => step(1)}
                  whileHover={{ x: -2 }}
                  whileTap={{ scale: 0.92 }}
                  transition={SPRING}
                  aria-label="شیرینی بعدی"
                  className="grid h-12 w-12 place-items-center rounded-full border border-ink/10 bg-canvas text-ink"
                >
                  <ChevronLeft className="h-4 w-4" />
                </motion.button>
                <motion.button
                  ref={closeRef}
                  type="button"
                  onClick={onClose}
                  whileHover={{ rotate: 90 }}
                  whileTap={{ scale: 0.92 }}
                  transition={SPRING}
                  aria-label="بستن"
                  className="ms-1 grid h-12 w-12 place-items-center rounded-full bg-ink text-canvas"
                >
                  <X className="h-4 w-4" />
                </motion.button>
              </div>
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={sweet.id}
                initial={{ opacity: 0, x: -24 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 24 }}
                transition={SPRING}
                className="grid gap-6 p-5 md:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] md:gap-8 md:p-7"
              >
                <div className="order-2 md:order-1">
                  <h3 id="sweet-dialog-title" className="text-2xl font-black leading-[1.4] text-ink md:text-[1.9rem]">
                    {sweet.title}
                  </h3>
                  <p className="copy-fa mt-4">{sweet.description}</p>
                </div>
                <div className="order-1 md:order-2">
                  <Kinetic3DShowcase kineticId="modal" className="aspect-[4/3] w-full" rounded="rounded-[1.5rem]" amplitude={0.7}>
                    <AdaptiveImage
                      src={sweet.image}
                      alt={sweet.imageAlt}
                      aspectRatio="h-full"
                      eager
                      sizes="(max-width: 768px) 92vw, 40vw"
                    />
                  </Kinetic3DShowcase>
                </div>
                <SpecMatrix sweet={sweet} layout="narrow" className="order-3 md:col-span-2" />
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
