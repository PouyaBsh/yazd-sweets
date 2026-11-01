"use client";

import {
  motion,
  useAnimationFrame,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, type PointerEvent, type ReactNode } from "react";
import { SPRING_CONFIG } from "@/lib/motion";
import { cn } from "@/lib/utils";

interface Kinetic3DShowcaseProps {
  children: ReactNode;
  className?: string;
  /** Rounded class of the tilting surface (glare + sheen follow it). */
  rounded?: string;
  /** Autonomous orbit strength (1 = spec amplitudes; 0 = still). Springs between values. */
  amplitude?: number;
  /** Max pointer tilt in degrees. */
  maxTilt?: number;
  /** Exposed as data-kinetic on the moving surface (used by the audit). */
  kineticId?: string;
  /** Disable pointer reaction (e.g. while the parent is being dragged). */
  interactive?: boolean;
}

const IDLE_MS = 2200;

/**
 * Kinetic 3D frame with full desktop ⇄ mobile parity.
 *
 *  Autonomous figure-8 levitation (touch devices, and whenever the mouse is idle/away):
 *    rotateX = sin(t·0.0016)·5.5°   rotateY = cos(t·0.0012)·6.5°
 *    y       = sin(t·0.0022)·−6px    scale   = 1 + sin(t·0.0016)·0.012
 *  + a warm specular sheen that sweeps across the surface in sync with rotateY.
 *
 *  Mouse: tilts toward the cursor with a cursor-following glare; after 2.2s idle it blends
 *  back into the orbit. Touch: pressing tilts toward the finger (scale 0.97, deeper ambient
 *  elevation); releasing springs back into the floating orbit.
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
  const inView = useInView(wrapRef, { margin: "80px" });
  const reduced = useReducedMotion();

  // outputs
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const ty = useMotionValue(0);
  const sc = useMotionValue(1);

  // pointer targets (smoothed)
  const pRX = useMotionValue(0);
  const pRY = useMotionValue(0);
  const sRX = useSpring(pRX, SPRING_CONFIG);
  const sRY = useSpring(pRY, SPRING_CONFIG);
  const blend = useSpring(0, SPRING_CONFIG); // 0 = autonomous orbit, 1 = pointer
  const press = useSpring(0, SPRING_CONFIG); // touch press depth
  const amp = useSpring(amplitude, SPRING_CONFIG);
  const idleTimer = useRef<number | undefined>(undefined);
  const pressing = useRef(false);

  useEffect(() => {
    amp.set(amplitude);
  }, [amplitude, amp]);

  useEffect(() => () => window.clearTimeout(idleTimer.current), []);

  useAnimationFrame((t) => {
    const b = blend.get();
    if (!inView && b < 0.01) return;
    const a = reduced ? 0 : amp.get();
    const autoRX = Math.sin(t * 0.0016) * 5.5 * a;
    const autoRY = Math.cos(t * 0.0012) * 6.5 * a;
    const autoTY = Math.sin(t * 0.0022) * -6 * a;
    const autoSC = 1 + Math.sin(t * 0.0016) * 0.012 * a;
    rx.set(autoRX * (1 - b) + sRX.get() * b);
    ry.set(autoRY * (1 - b) + sRY.get() * b);
    ty.set(autoTY * (1 - b));
    sc.set(autoSC * (1 - b) + b - press.get() * 0.03);
  });

  // autonomous sheen: sweeps with the yaw angle
  // (a 260%-wide gradient strip slid with translateX: compositor-only, no per-frame repaint;
  //  equivalent to the old background-position 112% → -12%)
  const sheenX = useTransform(ry, [-6.5, 6.5], ["-68.9%", "7.4%"]);
  const sheenOpacity = useTransform([blend, amp], ([b, a]: number[]) => (1 - b) * Math.min(1, a));

  // cursor glare
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const glareOpacity = useSpring(0, SPRING_CONFIG);
  const glare = useMotionTemplate`radial-gradient(120% 90% at ${gx}% ${gy}%, rgba(255, 248, 236, 0.42), rgba(255, 248, 236, 0) 52%)`;

  // ambient elevation: two static shadow layers that stay on the "ground" while the card
  // levitates (so the gap grows as it rises); the deep one fades in while pressed.
  // Opacity only — animating a box-shadow string would repaint the image every frame.
  const restShadowOpacity = useTransform(press, (p) => 1 - p);

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
  }

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!interactive) return;
    if (event.pointerType === "mouse") {
      aimAt(event);
      blend.set(1);
      glareOpacity.set(1);
      window.clearTimeout(idleTimer.current);
      idleTimer.current = window.setTimeout(() => {
        blend.set(0);
        glareOpacity.set(0);
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
      <motion.div
        data-kinetic={kineticId}
        style={{ rotateX: rx, rotateY: ry, y: ty, scale: sc, transformStyle: "preserve-3d" }}
        className={cn("relative h-full w-full overflow-hidden will-change-transform", rounded)}
      >
        {children}
        <motion.div
          aria-hidden
          className={cn("pointer-events-none absolute inset-0 z-10 overflow-hidden mix-blend-screen", rounded)}
          style={{ opacity: sheenOpacity }}
        >
          <motion.div
            className="absolute inset-y-0 left-0 w-[260%] will-change-transform"
            style={{ x: sheenX, background: "linear-gradient(115deg, transparent 30%, rgba(255,248,231,0.32) 50%, transparent 70%)" }}
          />
        </motion.div>
        <motion.div
          aria-hidden
          className={cn("pointer-events-none absolute inset-0 z-10 mix-blend-soft-light", rounded)}
          style={{ backgroundImage: glare, opacity: glareOpacity }}
        />
      </motion.div>
    </div>
  );
}
