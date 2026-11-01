/**
 * Compositor-first animation helpers.
 *
 * Why: on phones every frame in which JavaScript touches a style forces the browser's main thread
 * through style → layout → paint → layerize for the whole page (~100 composited layers here).
 * Ambient loops driven from requestAnimationFrame therefore cost 200–800 ms of main-thread time per
 * second on a mid-range phone even when "nothing happens". The same motion expressed as Web
 * Animations (element.animate) on transform / opacity runs entirely on the compositor thread:
 * zero main-thread work per frame, so scrolling and touches stay smooth — and nothing is removed.
 */

let linearSupport: boolean | null = null;

function supportsLinearEasing() {
  if (linearSupport === null) {
    linearSupport = typeof CSS !== "undefined" && CSS.supports?.("animation-timing-function", "linear(0, 0.5, 1)") === true;
  }
  return linearSupport;
}

const springCache = new Map<string, { easing: string; duration: number }>();

/**
 * Sample a damped spring's step response (0 → 1) into a CSS `linear()` easing, so a WAAPI animation
 * keeps the exact spring feel (same stiffness / damping as framer-motion) while running off-thread.
 */
export function springEasing(stiffness: number, damping: number, mass = 1) {
  const key = `${stiffness}/${damping}/${mass}`;
  const hit = springCache.get(key);
  if (hit) return hit;
  const dt = 1 / 240;
  let x = 0;
  let v = 0;
  let t = 0;
  const samples: number[] = [0];
  while (t < 8) {
    const a = (-stiffness * (x - 1) - damping * v) / mass;
    v += a * dt;
    x += v * dt;
    t += dt;
    samples.push(x);
    if (Math.abs(1 - x) < 0.0004 && Math.abs(v) < 0.004) break;
  }
  const n = 48;
  const pts: string[] = [];
  for (let i = 0; i <= n; i++) {
    const s = samples[Math.round((i / n) * (samples.length - 1))];
    pts.push(i === n ? "1" : s.toFixed(4));
  }
  const result = {
    easing: supportsLinearEasing() ? `linear(${pts.join(", ")})` : "cubic-bezier(0.22, 1, 0.36, 1)",
    duration: Math.round(t * 1000),
  };
  springCache.set(key, result);
  return result;
}

/** Interactive spring (stiffness 280, damping 26) — the page's one spring — as a compositor easing. */
export const springUI = () => springEasing(280, 26);

export function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
}

/** Commit an animation's end state as inline style, then drop it (keeps the element's animation list short). */
export function settle(anim: Animation) {
  anim.finished
    .then(() => {
      try {
        anim.commitStyles();
      } catch {
        /* element may be gone */
      }
      anim.cancel();
    })
    .catch(() => {});
}
