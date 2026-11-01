import type { Transition, Variants } from "framer-motion";

/** The one spring that drives every interactive state change on the page. */
export const SPRING: Transition = { type: "spring", stiffness: 280, damping: 26 };

/** Same spring, used for motion values (useSpring). */
export const SPRING_CONFIG = { stiffness: 280, damping: 26 } as const;

/**
 * Softer spring for highlight fade-outs (gold rings, glows): still spring physics,
 * but slower and slightly delayed so a highlight lingers and dissolves instead of blinking off.
 */
export const SPRING_FADE_OUT: Transition = { type: "spring", stiffness: 110, damping: 20, delay: 0.06 };

/**
 * Hero slideshow dissolve: over-damped springs (no overshoot, no blink) so a new photo
 * settles in over ~1.2 s while the Ken-Burns scale drifts a little longer.
 *
 * restDelta / restSpeed are tightened on purpose: framer's defaults for small ranges stop a
 * spring once it is within 0.005 of its target and then SNAP the rest of the way. On the
 * 1.06 → 1 zoom that final snap was a 0.47 % jump — ~24× a normal frame step — which read as
 * a little "hit" at the end of every slide. With these values the last step is ~0.01 px.
 */
const SOFT_LANDING = { restDelta: 0.00002, restSpeed: 0.0002 } as const;
export const SPRING_DISSOLVE: Transition = { type: "spring", stiffness: 55, damping: 18, ...SOFT_LANDING };
export const SPRING_DRIFT: Transition = { type: "spring", stiffness: 30, damping: 16, ...SOFT_LANDING };

/** Critically damped, calmer glide for the autonomous gallery wave (no overshoot). */
export const SPRING_GLIDE: Transition = { type: "spring", stiffness: 120, damping: 22 };

/** Variant names used for parent → child hover propagation (cards → images). */
export const HOVER_ZOOM: Variants = {
  rest: { scale: 1, transition: SPRING },
  hover: { scale: 1.06, transition: SPRING },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: { opacity: 1, y: 0, transition: SPRING },
};

export const staggerParent = (stagger = 0.07, delay = 0): Variants => ({
  hidden: {},
  show: { transition: { staggerChildren: stagger, delayChildren: delay } },
});
