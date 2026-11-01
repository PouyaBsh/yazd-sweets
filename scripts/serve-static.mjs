#!/usr/bin/env node
/**
 * Zero-dependency preview server for the static export in ./out — behaves like GitHub Pages
 * (folder → index.html, unknown path → 404.html with status 404).
 *
 *   npm run preview:static                         → http://localhost:4173/
 *   npm run preview:static -- --base=/yazd-sweets  → http://localhost:4173/yazd-sweets/
 *   npm run preview:static -- --port=8080
 */
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "out");
const arg = (name, fallback) => {
  const hit = process.argv.slice(2).find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : fallback;
};
const port = Number(arg("port", process.env.PORT || 4173));
let base = arg("base", "").trim().replace(/\/+$/, "");
if (base && !base.startsWith("/")) base = `/${base}`;

if (!existsSync(path.join(root, "index.html"))) {
  console.error("✖ out/index.html not found — run `npm run export` first.");
  process.exit(1);
}

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".map": "application/json; charset=utf-8",
};

function resolveFile(urlPath) {
  let rel = decodeURIComponent(urlPath.split("?")[0].split("#")[0]);
  if (base) {
    if (rel === base) return { redirect: `${base}/` };
    if (!rel.startsWith(`${base}/`)) return null;
    rel = rel.slice(base.length);
  }
  const target = path.normalize(path.join(root, rel));
  if (!target.startsWith(root)) return null; // no path traversal
  const candidates = [target, path.join(target, "index.html"), `${target}.html`];
  for (const c of candidates) if (existsSync(c) && statSync(c).isFile()) return { file: c };
  return null;
}

createServer((req, res) => {
  const hit = resolveFile(req.url || "/");
  if (hit?.redirect) {
    res.writeHead(301, { Location: hit.redirect }).end();
    return;
  }
  const file = hit?.file ?? path.join(root, "404.html");
  const status = hit?.file ? 200 : 404;
  res.writeHead(status, { "Content-Type": TYPES[path.extname(file).toLowerCase()] || "application/octet-stream" });
  if (existsSync(file)) createReadStream(file).pipe(res);
  else res.end("404");
}).listen(port, () => {
  console.log(`\n▸ Serving ./out at http://localhost:${port}${base}/  (Ctrl+C to stop)\n`);
});
