import type { NextConfig } from "next";

/**
 * Static export (GitHub Pages or any static host) — run `npm run export`, which sets STATIC_EXPORT=1
 * and writes the finished site to /out.
 *
 * NEXT_PUBLIC_BASE_PATH is only needed when the site lives in a sub-folder,
 * e.g. https://<user>.github.io/yazd-sweets → "/yazd-sweets". On your own domain leave it empty.
 * (The GitHub Actions workflow fills it in automatically.)
 */
const isStaticExport = process.env.STATIC_EXPORT === "1";
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").trim().replace(/\/+$/, "");

const nextConfig: NextConfig = {
  ...(isStaticExport ? { output: "export" as const } : {}),
  ...(basePath ? { basePath } : {}),
  // every <Image> is already `unoptimized`; this keeps static export happy (no image server)
  images: { unoptimized: true },
  // Cache Components / partial prefetching need a Next server (PPR) — Next refuses them in
  // export mode, and a one-page static site gains nothing from them there.
  cacheComponents: !isStaticExport,
  partialPrefetching: !isStaticExport,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
