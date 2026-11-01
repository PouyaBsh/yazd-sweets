#!/usr/bin/env node
/**
 * Yazd Sweets — cross-platform image check / downloader (Windows / macOS / Linux)
 * ----------------------------------------------------------------------
 * Uses only native Node.js APIs (fs/promises, path, fetch) — no wget/curl,
 * no `mkdir -p`, no shell. Works the same in PowerShell, CMD and bash.
 *
 *   npm run download-images          → fetch any missing images
 *   npm run download-images:force    → re-download everything (overwrites!)
 *   npm run dev                      → runs this first via the "predev" hook
 *
 * The site's 9 photos are now local, user-supplied WebP files in public/images/
 * (url: null below), so nothing is fetched for them — the script only makes sure
 * each file exists. Give an entry a url again if you ever want it auto-downloaded.
 *
 * Rules:
 *   • An existing real photo is NEVER overwritten (unless --force), so your
 *     own replacement photos in public/images/ are safe.
 *   • A file that is a previously generated placeholder is retried.
 *   • If a download fails or times out, a high-craft SVG placeholder is
 *     written to that exact file path, so the site and the build never break.
 *     (The AdaptiveImage component detects and renders these placeholders.)
 *   • The script always exits with code 0 so `npm run dev` never gets blocked.
 */

import { mkdir, readFile, rename, stat, writeFile, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "public", "images");

const FORCE = process.argv.includes("--force");
const TIMEOUT_MS = 25_000;
const MAX_ATTEMPTS = 2;
const MIN_VALID_BYTES = 2_048;
const PLACEHOLDER_MARKER = "yazd-sweets-placeholder";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

/** @type {{ file: string; url: string | null; label: string; latin: string; accent: string }[]} */
const IMAGES = [
  {
    file: "qottab.webp",
    label: "قطاب",
    latin: "QOTTAB",
    accent: "#D48C29",
    url: null,
  },
  {
    file: "baghlava.webp",
    label: "باقلوا",
    latin: "BAGHLAVA",
    accent: "#5C7A45",
    url: null,
  },
  {
    file: "pashmak.webp",
    label: "پشمک",
    latin: "PASHMAK",
    accent: "#B85D3B",
    url: null,
  },
  {
    file: "loz.webp",
    label: "لوز",
    latin: "LOZ",
    accent: "#D99B26",
    url: null,
  },
  {
    file: "haji-badam.webp",
    label: "حاجی بادام",
    latin: "HAJI BADAM",
    accent: "#9E6240",
    url: null,
  },
  {
    file: "cake-yazdi.webp",
    label: "کیک یزدی",
    latin: "CAKE YAZDI",
    accent: "#C87D55",
    url: null,
  },
  {
    file: "coffee-1.webp",
    label: "قهوه یزدی",
    latin: "YAZDI COFFEE · I",
    accent: "#1D6A73",
    url: null,
  },
  {
    file: "coffee-2.webp",
    label: "قهوه یزدی",
    latin: "YAZDI COFFEE · II",
    accent: "#B85D3B",
    url: null,
  },
  {
    file: "coffee-3.webp",
    label: "قهوه یزدی",
    latin: "YAZDI COFFEE · III",
    accent: "#D48C29",
    url: null,
  },
];

/* ───────────────────────── helpers ───────────────────────── */

const color = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};

/** Detect a real raster image by its magic bytes. */
function detectImageType(buffer) {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpeg";
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) return "png";
  if (buffer.toString("ascii", 0, 4) === "RIFF" && buffer.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (buffer.toString("ascii", 0, 3) === "GIF") return "gif";
  if (buffer.toString("ascii", 4, 12).startsWith("ftypavif")) return "avif";
  return null;
}

/** @returns {Promise<"missing" | "placeholder" | "invalid" | "ok">} */
async function inspectExisting(filePath) {
  try {
    const info = await stat(filePath);
    if (!info.isFile()) return "missing";
    const head = (await readFile(filePath)).subarray(0, 4096);
    if (head.toString("utf8").includes(PLACEHOLDER_MARKER)) return "placeholder";
    if (info.size < MIN_VALID_BYTES && !detectImageType(head)) return "invalid";
    return "ok";
  } catch {
    return "missing";
  }
}

async function fetchImage(url) {
  let lastError;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
    try {
      const response = await fetch(url, {
        signal: controller.signal,
        redirect: "follow",
        headers: {
          "User-Agent": USER_AGENT,
          Accept: "image/avif,image/webp,image/apng,image/jpeg,image/png,image/*;q=0.8,*/*;q=0.5",
          "Accept-Language": "fa-IR,fa;q=0.9,en;q=0.8",
          Referer: "https://chatgpt.com/",
        },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      const type = detectImageType(buffer);
      if (!type) throw new Error("response is not an image");
      if (buffer.length < MIN_VALID_BYTES) throw new Error("image too small");
      return { buffer, type };
    } catch (error) {
      lastError = error?.name === "AbortError" ? new Error(`timeout after ${TIMEOUT_MS / 1000}s`) : error;
    } finally {
      clearTimeout(timer);
    }
  }
  throw lastError ?? new Error("unknown error");
}

/** Write via a temp file + rename so a half-written file never lands in public/. */
async function writeAtomic(filePath, data) {
  const tmp = `${filePath}.${process.pid}.tmp`;
  await writeFile(tmp, data);
  try {
    await rename(tmp, filePath);
  } catch {
    // Windows can refuse rename-over when the target is locked (e.g. open in a viewer).
    await writeFile(filePath, data);
    await unlink(tmp).catch(() => {});
  }
}

function escapeXml(value) {
  return value.replace(/[<>&"']/g, (ch) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;", "'": "&apos;" })[ch]);
}

/** A warm, Yazd-architecture-inspired placeholder (khesht bricks, iwan arch, khatam star). */
function buildPlaceholderSvg({ label, latin, accent }) {
  const star = (cx, cy, r) => {
    const pts = [];
    for (let i = 0; i < 16; i++) {
      const radius = i % 2 === 0 ? r : r * 0.62;
      const angle = (Math.PI / 8) * i - Math.PI / 2;
      pts.push(`${(cx + radius * Math.cos(angle)).toFixed(1)},${(cy + radius * Math.sin(angle)).toFixed(1)}`);
    }
    return pts.join(" ");
  };

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 900" width="1200" height="900" role="img" aria-label="${escapeXml(label)}">
  <!-- ${PLACEHOLDER_MARKER}: replace this file with a real photo of the same name -->
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FAF6F0"/>
      <stop offset="1" stop-color="#F2EAE0"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.55">
      <stop offset="0" stop-color="${accent}" stop-opacity="0.22"/>
      <stop offset="1" stop-color="${accent}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="khesht" width="64" height="32" patternUnits="userSpaceOnUse">
      <rect width="64" height="32" fill="none"/>
      <path d="M0 0.5H64M0 16.5H64M0.5 0V16M32.5 16V32" stroke="#1C1613" stroke-opacity="0.07" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="1200" height="900" fill="url(#bg)"/>
  <rect width="1200" height="900" fill="url(#khesht)"/>
  <rect width="1200" height="900" fill="url(#glow)"/>
  <g transform="translate(600 430)">
    <path d="M-190 260 V-40 C-190 -170 -90 -250 0 -300 C90 -250 190 -170 190 -40 V260 Z" fill="#FFFDF9" stroke="#1C1613" stroke-opacity="0.12" stroke-width="2"/>
    <path d="M-150 260 V-30 C-150 -140 -70 -205 0 -248 C70 -205 150 -140 150 -30 V260" fill="none" stroke="${accent}" stroke-opacity="0.55" stroke-width="2" stroke-dasharray="2 10" stroke-linecap="round"/>
    <polygon points="${star(0, -40, 74)}" fill="${accent}" fill-opacity="0.9"/>
    <polygon points="${star(0, -40, 40)}" fill="#FFFDF9"/>
    <circle cx="0" cy="-40" r="12" fill="${accent}"/>
  </g>
  <text x="600" y="610" text-anchor="middle" direction="rtl" font-family="Vazirmatn, Tahoma, 'Segoe UI', sans-serif" font-size="64" font-weight="800" fill="#1C1613">${escapeXml(label)}</text>
  <text x="600" y="660" text-anchor="middle" font-family="'Segoe UI', Tahoma, sans-serif" font-size="20" letter-spacing="8" fill="#5E5249">${escapeXml(latin)}</text>
  <line x1="420" y1="700" x2="780" y2="700" stroke="#1C1613" stroke-opacity="0.12"/>
</svg>
`;
}

/* ───────────────────────── main ───────────────────────── */

async function processImage(item) {
  const target = path.join(OUTPUT_DIR, item.file);
  const state = await inspectExisting(target);

  if (state === "ok" && (!FORCE || !item.url)) {
    return { file: item.file, status: "kept", detail: "already present" };
  }

  if (!item.url) {
    await writeAtomic(target, buildPlaceholderSvg(item));
    return { file: item.file, status: "placeholder", detail: "missing local photo (no download URL)" };
  }

  try {
    const { buffer, type } = await fetchImage(item.url);
    await writeAtomic(target, buffer);
    return { file: item.file, status: "downloaded", detail: `${type}, ${(buffer.length / 1024).toFixed(0)} KB` };
  } catch (error) {
    if (state === "ok") {
      // --force failed: keep the existing real photo rather than replacing it.
      return { file: item.file, status: "kept", detail: `download failed (${error.message}); existing file kept` };
    }
    await writeAtomic(target, buildPlaceholderSvg(item));
    return { file: item.file, status: "placeholder", detail: error.message };
  }
}

async function main() {
  console.log(color.bold("\n  Yazd Sweets · image check"));
  console.log(color.dim(`  → ${OUTPUT_DIR}${FORCE ? "  (force mode)" : ""}\n`));

  await mkdir(OUTPUT_DIR, { recursive: true });

  const results = await Promise.all(IMAGES.map((item) => processImage(item)));

  for (const r of results) {
    const tag =
      r.status === "downloaded"
        ? color.green("✔ downloaded ")
        : r.status === "kept"
          ? color.dim("• kept       ")
          : color.yellow("◌ placeholder");
    console.log(`  ${tag}  ${r.file.padEnd(16)} ${color.dim(r.detail)}`);
  }

  const placeholders = results.filter((r) => r.status === "placeholder").length;
  if (placeholders > 0) {
    console.log(
      color.yellow(
        `\n  ${placeholders} image(s) could not be downloaded — SVG placeholders were written instead.\n` +
          "  Drop your own photo with the same file name into public/images/ (or re-run `npm run download-images`).",
      ),
    );
  } else {
    console.log(color.green("\n  All 9 images are ready."));
  }
  console.log("");
}

main().catch((error) => {
  // Never block `npm run dev` / `npm run build`.
  console.error(color.red(`  Image script error: ${error?.message ?? error}`));
  process.exitCode = 0;
});
