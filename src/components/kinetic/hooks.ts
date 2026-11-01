"use client";

import { useScroll, useSpring, useTransform, useVelocity } from "framer-motion";
import { useSyncExternalStore } from "react";

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

/**
 * Smoothed page scroll velocity.
 *  velocity → signed px/s (smoothed)
 *  boost    → 0…1 magnitude, used to accelerate ornaments while the user scrolls fast
 */
export function useScrollVelocity() {
  const { scrollY } = useScroll();
  const raw = useVelocity(scrollY);
  const velocity = useSpring(raw, { stiffness: 140, damping: 32, mass: 0.6 });
  const boost = useTransform(velocity, (v) => Math.min(1, Math.abs(v) / 2400));
  return { scrollY, velocity, boost };
}
