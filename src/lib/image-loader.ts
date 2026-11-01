/**
 * next/image custom loader (works with `output: "export"` — no image server needed).
 * Maps a local photo + the width the browser picked from srcset to a pre-built variant:
 *   /images/qottab.webp @768  →  <basePath>/images/v/768/qottab.avif
 * Variants come from scripts/build-image-variants.mjs: 128 (WebP) · 768 / 1024 (AVIF + WebP).
 */
const BASE = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").trim().replace(/\/+$/, "");
const WIDTHS = [128, 768, 1024];

type LoaderArgs = { src: string; width: number; quality?: number };

function variant({ src, width }: LoaderArgs, avif: boolean) {
  if (!src.startsWith("/images/")) return src.startsWith("/") ? `${BASE}${src}` : src;
  const w = WIDTHS.find((x) => x >= width) ?? WIDTHS[WIDTHS.length - 1];
  const name = src.slice("/images/".length);
  return `${BASE}/images/v/${w}/${avif && w >= 768 ? name.replace(/\.webp$/, ".avif") : name}`;
}

export default function yazdImageLoader(args: LoaderArgs) {
  return variant(args, true);
}

/** Same variants, WebP only — used by <AdaptiveImage> if a browser can't decode AVIF. */
export function webpImageLoader(args: LoaderArgs) {
  return variant(args, false);
}
