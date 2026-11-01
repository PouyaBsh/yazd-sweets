"use client";

import { motion, useInView, useMotionTemplate, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import { prefersReducedMotion, settle, springUI } from "@/lib/compositor";
import { SPRING_CONFIG } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface Kinetic3DShowcaseProps {
  children: ReactNode;
  className?: string;
  /** Rounded class of the tilting surface (glare + sheen follow it). */
  rounded?: string;
  /** Autonomous orbit strength (1 = spec amplitudes; 0 = still). */
  amplitude?: number;
  /** Max pointer tilt in degrees. */
  maxTilt?: number;
  /** Exposed as data-kinetic on the moving surface (used by the audit). */
  kineticId?: string;
  /** Disable pointer reaction (e.g. while the parent is being dragged). */
  interactive?: boolean;
}

const IDLE_MS = 2200;

/* figure-8 periods (from the original sin/cos formulas) */
const P_RX = (2 * Math.PI) / 0.0016; // rotateX + scale  ≈ 3.93 s
const P_RY = (2 * Math.PI) / 0.0012; // rotateY + sheen  ≈ 5.24 s
const P_TY = (2 * Math.PI) / 0.0022; // translateY       ≈ 2.86 s
const SINE = "cubic-bezier(0.37, 0, 0.63, 1)"; // easeInOutSine: alternate between extremes = a sine wave

/**
 * Kinetic 3D frame with full desktop ⇄ mobile parity.
 *
 *  Autonomous figure-8 levitation: rotateX ±5.5° (+ scale ±1.2 %), rotateY ±6.5°, y ±6px, and a warm
 *  specular sheen sweeping in sync with rotateY. Each axis is its own Web Animation on its own layer,
 *  so the whole levitation runs on the compositor thread — no per-frame JavaScript (it used to cost
 *  a full style/paint/layerize pass on every frame on phones).
 *
 *  Mouse: tilts toward the cursor with a cursor-following glare (the orbit holds still meanwhile);
 *  after 2.2s idle it resumes. Touch: pressing tilts toward the finger (scale 0.97, deeper ambient
 *  elevation); releasing springs back and the orbit carries on.
 */
export function Kinetic3DShowcase({
  children,
  className,
  rounded = "rounded-[1.75rem]",
  amplitude = 1,
  maxTilt = 6,
  kineticId,
  interactive = true,
}: Kinetic3DShowcaseProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const tyRef = useRef<HTMLDivElement>(null);
  const rxRef = useRef<HTMLDivElement>(null);
  const ryRef = useRef<HTMLDivElement>(null);
  const sheenRef = useRef<HTMLDivElement>(null);
  const orbit = useRef<Animation[]>([]);
  const inView = useInView(wrapRef, { margin: "80px" });
  const engaged = useRef(false);
  const active = amplitude > 0.01;

  // pointer targets (smoothed) — these only move while someone is actually pointing / pressing
  const pRX = useMotionValue(0);
  const pRY = useMotionValue(0);
  const sRX = useSpring(pRX, SPRING_CONFIG);
  const sRY = useSpring(pRY, SPRING_CONFIG);
  const blend = useSpring(0, SPRING_CONFIG); // 0 = autonomous orbit, 1 = pointer
  const press = useSpring(0, SPRING_CONFIG); // touch press depth
  const amp = useSpring(amplitude, SPRING_CONFIG);
  const idleTimer = useRef<number | undefined>(undefined);
  const pressing = useRef(false);

  const tiltX = useTransform([sRX, blend], ([r, b]: number[]) => r * b);
  const tiltY = useTransform([sRY, blend], ([r, b]: number[]) => r * b);
  const tiltScale = useTransform(press, (p) => 1 - p * 0.03);
  const sheenOpacity = useTransform([blend, amp], ([b, a]: number[]) => (1 - b) * Math.min(1, a));
  const restShadowOpacity = useTransform(press, (p) => 1 - p);

  // cursor glare
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const glareOpacity = useSpring(0, SPRING_CONFIG);
  const glare = useMotionTemplate`radial-gradient(120% 90% at ${gx}% ${gy}%, rgba(255, 248, 236, 0.42), rgba(255, 248, 236, 0) 52%)`;

  useEffect(() => {
    amp.set(amplitude);
  }, [amplitude, amp]);

  useEffect(() => () => window.clearTimeout(idleTimer.current), []);

  // start / stop the compositor orbit with the amplitude (front card ⇄ back card)
  useEffect(() => {
    const els = [rxRef.current, ryRef.current, tyRef.current, sheenRef.current];
    if (els.some((e) => !e)) return;
    const [rx, ry, ty, sheen] = els as HTMLDivElement[];
    if (!active || prefersReducedMotion()) {
      // glide back to neutral instead of snapping
      const ui = springUI();
      for (const el of [rx, ry, ty]) {
        const from = getComputedStyle(el).transform;
        el.getAnimations().forEach((a) => a.cancel());
        if (from && from !== "none") settle(el.animate([{ transform: from }, { transform: "none" }], { duration: ui.duration, easing: ui.easing, fill: "forwards" }));
      }
      sheen.getAnimations().forEach((a) => a.cancel());
      orbit.current = [];
      return;
    }
    [rx, ry, ty, sheen].forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
    const loop = (duration: number): KeyframeAnimationOptions => ({
      duration: duration / 2,
      iterations: Infinity,
      direction: "alternate",
      easing: SINE,
      iterationStart: 0.5, // every axis starts from neutral → no jump when a card comes to the front
    });
    const list = [
      rx.animate([{ transform: "rotateX(-5.5deg) scale(0.988)" }, { transform: "rotateX(5.5deg) scale(1.012)" }], loop(P_RX)),
      ry.animate([{ transform: "rotateY(6.5deg)" }, { transform: "rotateY(-6.5deg)" }], loop(P_RY)),
      ty.animate([{ transform: "translateY(6px)" }, { transform: "translateY(-6px)" }], loop(P_TY)),
      // sheen strip rides the same clock as rotateY (was: background-position derived from rotateY)
      sheen.animate([{ transform: "translateX(7.4%)" }, { transform: "translateX(-68.9%)" }], loop(P_RY)),
    ];
    orbit.current = list;
    if (!inView || engaged.current) list.forEach((a) => a.pause());
    return () => list.forEach((a) => a.cancel());
    // inView is applied by the effect below; restarting the loop on scroll would make it jump
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  useEffect(() => {
    orbit.current.forEach((a) => (inView && !engaged.current ? a.play() : a.pause()));
  }, [inView]);

  function holdOrbit(hold: boolean) {
    engaged.current = hold;
    orbit.current.forEach((a) => (hold || !inView ? a.pause() : a.play()));
  }

  function aimAt(event: PointerEvent<HTMLDivElement>) {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const nx = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    const ny = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height));
    pRY.set((nx - 0.5) * 2 * maxTilt);
    pRX.set((0.5 - ny) * 2 * maxTilt);
    gx.set(nx * 100);
    gy.set(ny * 100);
  }

  function release() {
    pressing.current = false;
    blend.set(0);
    press.set(0);
    glareOpacity.set(0);
    holdOrbit(false);
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!interactive) return;
    if (event.pointerType === "mouse") {
      aimAt(event);
      blend.set(1);
      glareOpacity.set(1);
      if (!engaged.current) holdOrbit(true);
      window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => {
        blend.set(0);
        glareOpacity.set(0);
        holdOrbit(false);
      }, IDLE_MS);
    } else if (pressing.current) {
      aimAt(event);
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!interactive || event.pointerType === "mouse") return;
    pressing.current = true;
    aimAt(event);
    blend.set(1);
    press.set(1);
    glareOpacity.set(0.7);
    holdOrbit(true);
  }

  return (
    <div
      ref={wrapRef}
      className={cn("relative [perspective:1100px]", className)}
      onPointerMove={handlePointerMove}
      onPointerDown={handlePointerDown}
      onPointerUp={release}
      onPointerCancel={release}
      onPointerLeave={release}
    >
      <motion.div
        aria-hidden
        className={cn("pointer-events-none absolute inset-0", rounded)}
        style={{ opacity: restShadowOpacity, boxShadow: "0 18px 44px -26px rgba(28, 22, 19, 0.3)" }}
      />
      <motion.div
        aria-hidden
        className={cn("pointer-events-none absolute inset-0", rounded)}
        style={{ opacity: press, boxShadow: "0 28px 62px -26px rgba(28, 22, 19, 0.44)" }}
      />
      {/* orbit layers (compositor): translateY → rotateX+scale → rotateY → pointer tilt (framer) */}
      <div ref={tyRef} className="h-full w-full [transform-style:preserve-3d]">
        <div ref={rxRef} data-kinetic={kineticId} className="h-full w-full [transform-style:preserve-3d]">
          <div ref={ryRef} className="h-full w-full [transform-style:preserve-3d]">
            <motion.div
              style={{ rotateX: tiltX, rotateY: tiltY, scale: tiltScale, transformStyle: "preserve-3d" }}
              className={cn("relative h-full w-full overflow-hidden", rounded)}
            >
              {children}
              <motion.div
                aria-hidden
                className={cn("pointer-events-none absolute inset-0 z-10 overflow-hidden mix-blend-screen", rounded)}
                style={{ opacity: sheenOpacity }}
              >
                <div
                  ref={sheenRef}
                  className="absolute inset-y-0 left-0 w-[260%]"
                  style={{
                    transform: "translateX(-30.75%)",
                    background: "linear-gradient(115deg, transparent 30%, rgba(255,248,231,0.32) 50%, transparent 70%)",
                  }}
                />
              </motion.div>
              <motion.div
                aria-hidden
                className={cn("pointer-events-none absolute inset-0 z-10 mix-blend-soft-light", rounded)}
                style={{ backgroundImage: glare, opacity: glareOpacity }}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
