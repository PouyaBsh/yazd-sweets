"use client";

import { motionValue, type MotionValue } from "framer-motion";
import { useState, useSyncExternalStore } from "react";

/** SSR-safe media query (false on the server, live on the client). */
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined") return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => (typeof window === "undefined" ? false : window.matchMedia(query).matches),
    () => false,
  );
}

/** true on devices with a real hovering pointer (mouse / trackpad). */
export function useCanHover() {
  return useMediaQuery("(hover: hover) and (pointer: fine)");
}

type ScrollSignals = { scrollY: MotionValue<number>; velocity: MotionValue<number>; boost: MotionValue<number> };

let shared: ScrollSignals | null = null;

/**
 * ONE page-wide scroll signal (was: a useScroll + useVelocity + useSpring per component — ~20
 * copies, each ticking on every frame). A single passive scroll listener feeds a single spring
 * (same feel: stiffness 140, damping 32, mass 0.6) that only runs while the page moves.
 */
function createShared(): ScrollSignals {
  const scrollY = motionValue(window.scrollY);
  const velocity = motionValue(0);
  const boost = motionValue(0);
  const K = 140;
  const C = 32;
  const M = 0.6;
  let lastY = window.scrollY;
  let lastT = performance.now();
  let lastEvent = lastT;
  let target = 0;
  let v = 0; // smoothed velocity (px/s)
  let dv = 0; // its rate of change
  let raf = 0;
  let prev = 0;

  const tick = (now: number) => {
    const dt = Math.min(0.064, (now - (prev || now)) / 1000) || 1 / 60;
    prev = now;
    if (now - lastEvent > 80) target = 0; // finger lifted / wheel stopped
    const a = (-K * (v - target) - C * dv) / M;
    dv += a * dt;
    v += dv * dt;
    velocity.set(v);
    boost.set(Math.min(1, Math.abs(v) / 2400));
    if (target === 0 && Math.abs(v) < 0.5 && Math.abs(dv) < 5) {
      v = 0;
      dv = 0;
      velocity.set(0);
      boost.set(0);
      raf = 0;
      prev = 0;
      return;
    }
    raf = requestAnimationFrame(tick);
  };

  window.addEventListener(
    "scroll",
    () => {
      const now = performance.now();
      const y = window.scrollY;
      const dt = Math.max(8, now - lastT);
      target = ((y - lastY) / dt) * 1000;
      lastY = y;
      lastT = now;
      lastEvent = now;
      scrollY.set(y);
      if (!raf) raf = requestAnimationFrame(tick);
    },
    { passive: true },
  );
  return { scrollY, velocity, boost };
}

/**
 * Smoothed page scroll velocity.
 *  velocity → signed px/s (smoothed)
 *  boost    → 0…1 magnitude, used to accelerate ornaments while the user scrolls fast
 */
export function useScrollVelocity(): ScrollSignals {
  const [signals] = useState<ScrollSignals>(() => {
    if (typeof window === "undefined") return { scrollY: motionValue(0), velocity: motionValue(0), boost: motionValue(0) };
    shared ??= createShared();
    return shared;
  });
  return signals;
}
