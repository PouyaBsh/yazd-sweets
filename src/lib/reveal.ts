"use client";

import { useSyncExternalStore } from "react";

/**
 * The boot loader (see src/components/layout/BootLoader.tsx) keeps `data-booting` on <html> until
 * every resource is in and React has hydrated, then removes it and fires `yazd:reveal`.
 * Components whose entrance should be seen (hero title, arch, badges…) wait for this.
 */
export const REVEAL_EVENT = "yazd:reveal";

function subscribe(onChange: () => void) {
  window.addEventListener(REVEAL_EVENT, onChange);
  return () => window.removeEventListener(REVEAL_EVENT, onChange);
}

export function isRevealed() {
  return typeof document !== "undefined" && !document.documentElement.hasAttribute("data-booting");
}

export function useRevealed() {
  return useSyncExternalStore(subscribe, isRevealed, () => false);
}
