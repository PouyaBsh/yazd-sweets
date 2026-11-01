"use client";

import { useEffect, useState } from "react";

/**
 * Cycles an index 0…length-1 every `interval` ms while `enabled`.
 * Returns -1 when disabled, so callers can fall back to user-driven state.
 */
export function useAutoCycle(length: number, interval: number, enabled: boolean) {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!enabled || length < 2) return;
    const timer = window.setInterval(() => setIndex((i) => (i + 1) % length), interval);
    return () => window.clearInterval(timer);
  }, [enabled, interval, length]);
  return enabled ? index : -1;
}
