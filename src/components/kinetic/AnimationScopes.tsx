"use client";

import { useEffect } from "react";

/**
 * Pauses every CSS animation inside a section while that section is off-screen.
 * Sections opt in with `data-anim-scope`; the observer flips `data-anim-offscreen` on them and a
 * CSS rule sets animation-play-state: paused for their whole subtree.
 * Why: an animation whose element isn't being rendered (off-screen / content-visibility skipped)
 * can't live on the compositor, so the browser ticks it on the main thread — a style recalc on
 * every frame for something nobody can see. Everything resumes exactly where it was.
 */
export function AnimationScopes() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) e.target.toggleAttribute("data-anim-offscreen", !e.isIntersecting);
      },
      { rootMargin: "10% 0px 10% 0px" },
    );
    document.querySelectorAll("[data-anim-scope]").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
  return null;
}
