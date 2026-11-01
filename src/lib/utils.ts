import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Sub-folder the site is served from ("" on its own domain) — see next.config.ts. */
export const BASE_PATH = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").trim().replace(/\/+$/, "");

/**
 * Prefix a root-relative asset path (/images/…) with the base path. next/image does NOT do this
 * for `src` strings, so without it photos would 404 at https://<user>.github.io/<repo>/.
 */
export function assetPath(src: string) {
  if (!BASE_PATH || !src.startsWith("/") || src.startsWith("//") || src.startsWith(`${BASE_PATH}/`)) return src;
  return `${BASE_PATH}${src}`;
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const FA_DIGITS = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];

/** Converts Latin digits to Persian digits. */
export function toFa(value: number | string) {
  return String(value).replace(/\d/g, (d) => FA_DIGITS[Number(d)]);
}

/**
 * Splits an ingredient sentence such as
 * "آرد گندم، زرده تخم‌مرغ، ماست، پودر قند و هل سبز"
 * into pills — ignoring separators that live inside parentheses.
 */
export function splitIngredients(sentence: string): string[] {
  const topLevel: string[] = [];
  let depth = 0;
  let buffer = "";
  for (const ch of sentence) {
    if (ch === "(") depth++;
    if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === "،" && depth === 0) {
      topLevel.push(buffer);
      buffer = "";
      continue;
    }
    buffer += ch;
  }
  topLevel.push(buffer);

  return topLevel
    .flatMap((segment) => {
      // split on " و " only when it is outside parentheses
      const parts: string[] = [];
      let d = 0;
      let current = "";
      const chars = Array.from(segment);
      for (let i = 0; i < chars.length; i++) {
        const ch = chars[i];
        if (ch === "(") d++;
        if (ch === ")") d = Math.max(0, d - 1);
        if (d === 0 && ch === " " && chars[i + 1] === "و" && chars[i + 2] === " ") {
          parts.push(current);
          current = "";
          i += 2;
          continue;
        }
        current += ch;
      }
      parts.push(current);
      return parts;
    })
    .map((s) => s.trim())
    .filter(Boolean);
}

/** "#D48C29" + 0.14 → "rgba(212, 140, 41, 0.14)" */
export function hexToRgba(hex: string, alpha: number) {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const n = parseInt(full, 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

let activeScroll: { raf: number; stop: () => void } | null = null;

/**
 * Glide the page until the section's first element sits at the top (respecting scroll-margin-top).
 * A custom rAF scroll instead of scrollIntoView(): the destination is re-measured on every frame,
 * so late layout changes, other programmatic scrolls or sticky elements can't leave it short.
 * Any wheel / touch / key input from the visitor cancels it immediately.
 */
export function scrollToSection(id: string) {
  if (typeof window === "undefined") return;
  const el = document.getElementById(id);
  if (!el) return;
  glideTo(() => {
    const margin = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    return Math.max(0, Math.min(max, el.getBoundingClientRect().top + window.scrollY - margin));
  });
}

/**
 * Back to the very top (scrollY = 0). Native `scrollTo({ behavior: "smooth" })` gets cut short
 * on this page — layout/scroll-linked animations interrupt it mid-way — so it uses the same
 * re-measuring glide as scrollToSection.
 */
export function scrollToTop() {
  if (typeof window === "undefined") return;
  glideTo(() => 0);
}

function glideTo(target: () => number) {
  activeScroll?.stop();

  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    window.scrollTo({ top: target(), behavior: "instant" });
    return;
  }

  const startY = window.scrollY;
  const startT = performance.now();
  const duration = Math.min(1400, Math.max(520, 420 + Math.abs(target() - startY) * 0.22));
  const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2); // easeInOutCubic

  const onUserInput = () => stop();
  const events = ["wheel", "touchstart", "keydown", "mousedown"] as const;
  const run = { raf: 0, stop };
  function stop() {
    cancelAnimationFrame(run.raf);
    events.forEach((e) => window.removeEventListener(e, onUserInput));
    if (activeScroll === run) activeScroll = null;
  }

  const step = (now: number) => {
    if (activeScroll !== run) return;
    const p = Math.min(1, (now - startT) / duration);
    const dest = target();
    window.scrollTo({ top: startY + (dest - startY) * ease(p), behavior: "instant" });
    if (p < 1) {
      run.raf = requestAnimationFrame(step);
    } else {
      // final settle: one more correction in case anything shifted on the last frame
      requestAnimationFrame(() => window.scrollTo({ top: target(), behavior: "instant" }));
      stop();
    }
  };

  activeScroll = run;
  run.raf = requestAnimationFrame(step);
  // let the click that started this finish before listening for "user took over" input
  window.setTimeout(() => {
    if (activeScroll === run) events.forEach((e) => window.addEventListener(e, onUserInput, { passive: true }));
  }, 50);
}
