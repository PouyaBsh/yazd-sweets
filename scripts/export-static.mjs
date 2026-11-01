#!/usr/bin/env node
/**
 * Yazd Sweets — static export (Windows / macOS / Linux, no extra dependencies).
 *
 *   npm run export                                  → ./out  (for your own domain, served from "/")
 *   npm run export -- --domain=example.com          → also writes out/CNAME (branch-based Pages only)
 *   npm run export -- --base-path=/yazd-sweets      → for https://<user>.github.io/yazd-sweets/
 *
 * The finished site in ./out is plain HTML/CSS/JS + images: upload it to any static host.
 */
import { spawn } from "node:child_process";
import { existsSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "out");

const arg = (name) => {
  const hit = process.argv.slice(2).find((a) => a === `--${name}` || a.startsWith(`--${name}=`));
  return hit?.includes("=") ? hit.slice(hit.indexOf("=") + 1) : undefined;
};

let basePath = (arg("base-path") ?? process.env.NEXT_PUBLIC_BASE_PATH ?? "").trim().replace(/\/+$/, "");
if (basePath && !basePath.startsWith("/")) basePath = `/${basePath}`;
const domain = (arg("domain") ?? "").trim().replace(/^https?:\/\//, "").replace(/\/.*$/, "");

const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
if (!existsSync(nextBin)) {
  console.error("✖ node_modules/next not found — run `npm install` first.");
  process.exit(1);
}

console.log(`\n▸ Static export  ·  base path: ${basePath || "/ (domain root)"}${domain ? `  ·  CNAME: ${domain}` : ""}\n`);

const code = await new Promise((resolve) => {
  const child = spawn(process.execPath, [nextBin, "build"], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, STATIC_EXPORT: "1", NEXT_PUBLIC_BASE_PATH: basePath, NEXT_TELEMETRY_DISABLED: "1" },
  });
  child.on("exit", (c) => resolve(c ?? 1));
});
if (code !== 0 || !existsSync(path.join(outDir, "index.html"))) {
  console.error("\n✖ Export failed (no out/index.html).");
  process.exit(code || 1);
}

// GitHub Pages runs Jekyll on branch deploys, which would hide the "_next" folder → opt out.
writeFileSync(path.join(outDir, ".nojekyll"), "");
if (domain) writeFileSync(path.join(outDir, "CNAME"), `${domain}\n`);

let files = 0;
let bytes = 0;
(function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else {
      files++;
      bytes += st.size;
    }
  }
})(outDir);

console.log(`\n✔ Static site ready → ${path.relative(root, outDir) || "out"}  (${files} files, ${(bytes / 1024 / 1024).toFixed(1)} MB)`);
console.log(`  Preview locally:  npm run preview:static${basePath ? ` -- --base=${basePath}` : ""}\n`);
