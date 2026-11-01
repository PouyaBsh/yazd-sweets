#!/usr/bin/env node
/**
 * Responsive image variants for next/image's custom loader (src/lib/image-loader.ts).
 *
 *   public/images/<name>.webp  →  public/images/v/<width>/<name>.webp   for every width in WIDTHS
 *
 * Only three widths on purpose: every slot of the page asks for one of them (see the `sizes`
 * props), so a phone downloads each photo at most twice (a 128px thumb + one 768px copy) and
 * reuses it everywhere — instead of the full-quality original in every slot.
 * The 768 / 1024 copies are also written as AVIF (~40 % smaller than WebP at the same look);
 * the loader serves AVIF and <AdaptiveImage> falls back to the WebP copy if a browser can't decode it.
 * Uses sharp (installed with Next.js). Without sharp the originals are copied, so it never breaks.
 * Skips work when the variants are already newer than their source.
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const WIDTHS = [128, 768, 1024];
const QUALITY = { 128: 68, 768: 74, 1024: 76 };
const AVIF_QUALITY = { 768: 52, 1024: 54 };

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = path.join(root, "public", "images");
const outRoot = path.join(srcDir, "v");

let sharp = null;
try {
  sharp = (await import("sharp")).default;
} catch {
  console.warn("! sharp not available — copying originals as variants");
}

const files = readdirSync(srcDir).filter((f) => /\.(webp|jpe?g|png)$/i.test(f));
let made = 0;
let skipped = 0;
for (const w of WIDTHS) mkdirSync(path.join(outRoot, String(w)), { recursive: true });

for (const file of files) {
  const src = path.join(srcDir, file);
  const srcTime = statSync(src).mtimeMs;
  const outName = file.replace(/\.(jpe?g|png)$/i, ".webp");
  for (const w of WIDTHS) {
    const out = path.join(outRoot, String(w), outName);
    const outAvif = out.replace(/\.webp$/, ".avif");
    const wantAvif = Boolean(AVIF_QUALITY[w]);
    const fresh = (f) => existsSync(f) && statSync(f).mtimeMs >= srcTime;
    if (fresh(out) && (!wantAvif || fresh(outAvif))) {
      skipped++;
      continue;
    }
    if (!sharp) {
      copyFileSync(src, out);
      if (wantAvif) copyFileSync(src, outAvif); // same bytes; the browser sniffs the real format
    } else {
      const base = () => sharp(src).resize({ width: w, withoutEnlargement: true });
      await base().webp({ quality: QUALITY[w], effort: 5, smartSubsample: true }).toFile(out);
      if (wantAvif) await base().avif({ quality: AVIF_QUALITY[w], effort: 4 }).toFile(outAvif);
    }
    made++;
  }
}
console.log(`✔ image variants: ${made} written, ${skipped} up to date (${WIDTHS.join(" / ")} px)`);
