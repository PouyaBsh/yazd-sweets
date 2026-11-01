#!/usr/bin/env node
/**
 * Yazd Sweets — automated kinetic + visual + UX + accessibility audit (Windows / macOS / Linux)
 * --------------------------------------------------------------------------------------------
 *   npm run audit:install   → one-time: download the Chromium build Playwright needs
 *   npm run audit           → builds + serves the site (if nothing is running), then audits it
 *
 * Options / env:
 *   AUDIT_URL=http://localhost:3000   audit an already-running server instead
 *   AUDIT_PORT=3100                   port used when the script starts its own server
 *   --skip-build                      reuse the existing .next production build
 *
 * Output: .audit-screenshots/*.png  +  .audit-screenshots/audit-report.json
 * Exit code 1 when a required check fails.
 */

import AxeBuilder from "@axe-core/playwright";
import { spawn, spawnSync } from "node:child_process";
import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, ".audit-screenshots");
const PORT = Number(process.env.AUDIT_PORT || 3100);
const BASE = process.env.AUDIT_URL || `http://localhost:${PORT}`;
const SKIP_BUILD = process.argv.includes("--skip-build");

const VIEWPORTS = [
  { name: "desktop-1440x900", width: 1440, height: 900, isMobile: false, hasTouch: false, deviceScaleFactor: 1.5, mobile: false },
  { name: "iphone15pro-393x852", width: 393, height: 852, isMobile: true, hasTouch: true, deviceScaleFactor: 3, mobile: true },
  { name: "android-360x800", width: 360, height: 800, isMobile: true, hasTouch: true, deviceScaleFactor: 2, mobile: true },
];

const SWEET_IDS = ["qottab", "baghlava", "pashmak", "loz", "haji-badam", "cake-yazdi"];
const ALL_IMAGES = ["qottab.webp", "baghlava.webp", "pashmak.webp", "loz.webp", "haji-badam.webp", "cake-yazdi.webp", "coffee-1.webp", "coffee-2.webp", "coffee-3.webp"];

const c = {
  dim: (s) => `\x1b[2m${s}\x1b[0m`,
  green: (s) => `\x1b[32m${s}\x1b[0m`,
  red: (s) => `\x1b[31m${s}\x1b[0m`,
  yellow: (s) => `\x1b[33m${s}\x1b[0m`,
  bold: (s) => `\x1b[1m${s}\x1b[0m`,
};
const log = (...a) => console.log(...a);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ─────────────────────────── server ─────────────────────────── */

async function reachable(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
    return res.ok;
  } catch {
    return false;
  }
}

async function ensureServer() {
  if (await reachable(BASE)) {
    log(c.dim(`  using running server ${BASE}`));
    return null;
  }
  if (process.env.AUDIT_URL) throw new Error(`AUDIT_URL ${BASE} is not reachable`);
  const nextBin = path.join(ROOT, "node_modules", "next", "dist", "bin", "next");
  if (!SKIP_BUILD) {
    log(c.dim("  building production bundle (next build)…"));
    const r = spawnSync(process.execPath, [nextBin, "build"], { cwd: ROOT, stdio: "inherit" });
    if (r.status !== 0) throw new Error("next build failed");
  }
  log(c.dim(`  starting next on :${PORT}…`));
  const child = spawn(process.execPath, [nextBin, "start", "-p", String(PORT)], { cwd: ROOT, stdio: ["ignore", "pipe", "pipe"] });
  const started = Date.now();
  while (Date.now() - started < 60_000) {
    if (await reachable(BASE)) return child;
    await sleep(500);
  }
  child.kill();
  throw new Error("next start did not become ready within 60s");
}

/* ─────────────────────────── page helpers ─────────────────────────── */

async function settle(page, ms = 600) {
  await page.waitForTimeout(ms);
}

async function autoScroll(page) {
  const { h, vh } = await page.evaluate(() => ({ h: document.documentElement.scrollHeight, vh: innerHeight }));
  for (let y = 0; y <= h; y += Math.round(vh * 0.55)) {
    await page.evaluate((v) => window.scrollTo({ top: v, behavior: "instant" }), y);
    await page.waitForTimeout(140);
  }
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await settle(page, 700);
}

async function waitForImages(page) {
  await page
    .waitForFunction(
      () =>
        [...document.images]
          .filter((img) => img.src.includes("/images/") && img.checkVisibility())
          .every((img) => img.complete && img.naturalWidth > 0),
      null,
      { timeout: 20_000 },
    )
    .catch(() => {});
}

async function centerOn(page, selector) {
  await page.evaluate((sel) => {
    const el = document.querySelector(sel);
    el?.scrollIntoView({ block: "center", behavior: "instant" });
  }, selector);
  await settle(page, 500);
}

async function clickCentered(locator) {
  await locator.evaluate((el) => el.scrollIntoView({ block: "center", behavior: "instant" }));
  await locator.page().waitForTimeout(250);
  await locator.click();
}

async function swipe(page, cdp, selector, fromRatio, toRatio, mobile) {
  const box = await page.locator(selector).first().boundingBox();
  if (!box) throw new Error(`no box for ${selector}`);
  const y = box.y + box.height * 0.5;
  const x1 = box.x + box.width * fromRatio;
  const x2 = box.x + box.width * toRatio;
  const steps = 14;
  if (mobile) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x1, y }] });
    for (let i = 1; i <= steps; i++) {
      await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x1 + ((x2 - x1) * i) / steps, y }] });
      await page.waitForTimeout(16);
    }
    await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  } else {
    await page.mouse.move(x1, y);
    await page.mouse.down();
    await page.mouse.move(x2, y, { steps });
    await page.mouse.up();
    await page.mouse.move(2, 2);
  }
  await settle(page, 900);
}

/** Hide the fixed header / sticky selector while capturing element screenshots. */
async function overlays(page, visible) {
  await page.evaluate((show) => {
    let tag = document.getElementById("audit-overlay-style");
    if (!tag) {
      tag = document.createElement("style");
      tag.id = "audit-overlay-style";
      document.head.appendChild(tag);
    }
    tag.textContent = show ? "" : "[data-audit-overlay]{visibility:hidden !important}";
  }, visible);
}

const selectedSweet = (page) =>
  page.evaluate(() => document.querySelector('[id^="sweet-tab-"][aria-selected="true"]')?.id.replace("sweet-tab-", "") ?? null);

const deckFront = (page) => page.evaluate(() => Number(document.querySelector("[data-deck-front]")?.getAttribute("data-deck-card") ?? -1));

const overflow = (page) =>
  page.evaluate(() => ({ scrollWidth: document.documentElement.scrollWidth, clientWidth: document.documentElement.clientWidth }));

async function contactSheet(browser, shots, outPath, cols) {
  const page = await browser.newPage({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 1 });
  const cells = shots
    .map(
      (s) =>
        `<figure style="margin:0"><img src="data:image/png;base64,${s.b64}" style="width:100%;display:block;border-radius:14px;border:1px solid rgba(28,22,19,.12)"/><figcaption style="padding:6px 2px;font:600 13px system-ui,sans-serif;color:#1C1613">${s.label}</figcaption></figure>`,
    )
    .join("");
  await page.setContent(
    `<html><body style="margin:0;background:#F2EAE0"><div style="display:grid;grid-template-columns:repeat(${cols},1fr);gap:18px;padding:18px;align-items:start">${cells}</div></body></html>`,
    { waitUntil: "load" },
  );
  await page.screenshot({ path: outPath, fullPage: true });
  await page.close();
}

/* ─────────────────────────── in-page probes ─────────────────────────── */

function probeImages() {
  const imgs = [...document.images].filter((img) => img.src.includes("/images/") && img.checkVisibility());
  const files = new Set();
  const broken = [];
  const notCover = [];
  const deferred = [];
  for (const img of imgs) {
    const file = decodeURIComponent(new URL(img.currentSrc || img.src).pathname.split("/").pop() || "");
    const r = img.getBoundingClientRect();
    const offscreen = r.right < 0 || r.left > innerWidth || r.bottom < 0 || r.top > innerHeight;
    if (img.complete && img.naturalWidth > 0) files.add(file);
    else if (img.loading === "lazy" && offscreen) deferred.push(file);
    else broken.push(file);
    if (getComputedStyle(img).objectFit !== "cover") notCover.push(file);
  }
  return { checked: imgs.length, files: [...files], broken: [...new Set(broken)], deferredLazy: [...new Set(deferred)], notCover: [...new Set(notCover)] };
}

function probeOrnaments() {
  const kinds = ["girih", "shamseh", "lachaki", "badgir", "ambient", "particles"];
  const out = {};
  for (const k of kinds) {
    const nodes = [...document.querySelectorAll(`[data-ornament="${k}"]`)];
    out[k] = {
      count: nodes.length,
      pointerEventsNone: nodes.every((n) => getComputedStyle(n).pointerEvents === "none"),
    };
  }
  return out;
}

function probeTouchTargets() {
  const sel = 'button, a[href], [role="tab"], [role="button"], [role="switch"], [role="radio"]';
  const fails = [];
  const warns = [];
  let checked = 0;
  for (const el of document.querySelectorAll(sel)) {
    if (!el.checkVisibility({ checkVisibilityCSS: true })) continue;
    if (el.closest("[inert]")) continue;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    checked++;
    const label = (el.getAttribute("aria-label") || el.textContent || el.tagName).trim().replace(/\s+/g, " ").slice(0, 48);
    const entry = { label, w: Math.round(r.width), h: Math.round(r.height) };
    if (r.width < 44 - 0.5 || r.height < 44 - 0.5) fails.push(entry);
    else if (r.width < 48 - 0.5 || r.height < 48 - 0.5) warns.push(entry);
  }
  return { checked, fails, warns };
}

function probeTextClipping() {
  const vw = document.documentElement.clientWidth;
  const issues = [];
  const ellipsis = [];
  const candidates = document.querySelectorAll("h1, h2, h3, h4, p, blockquote, dd, figcaption, li, span, strong, a, button");
  for (const el of candidates) {
    const hasText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 0);
    if (!hasText || !el.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
    if (el.closest("[inert], [aria-hidden='true']")) continue;
    const cs = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    if (r.width === 0) continue;
    if (cs.position === "absolute" && r.width <= 2 && r.height <= 2) continue; // sr-only text
    const label = el.textContent.trim().replace(/\s+/g, " ").slice(0, 40);
    if (cs.textOverflow === "ellipsis" || cs.webkitLineClamp !== "none") {
      if (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1) ellipsis.push(label);
      continue;
    }
    // self overflow
    if (cs.overflowX !== "visible" && el.scrollWidth > el.clientWidth + 1) issues.push({ label, reason: "self-overflow" });
    // clipped by a non-scrolling ancestor, or by the viewport
    let a = el.parentElement;
    let scrollerAncestor = false;
    while (a && a !== document.body) {
      const acs = getComputedStyle(a);
      if (acs.overflowX === "auto" || acs.overflowX === "scroll") {
        scrollerAncestor = true;
        break;
      }
      if (acs.overflowX === "hidden" || acs.overflowX === "clip") {
        const ar = a.getBoundingClientRect();
        if (r.left < ar.left - 1 || r.right > ar.right + 1) {
          issues.push({ label, reason: "clipped-by-ancestor" });
          break;
        }
      }
      a = a.parentElement;
    }
    if (!scrollerAncestor && (r.left < -1 || r.right > vw + 1)) issues.push({ label, reason: "outside-viewport" });
  }
  // collisions between block text elements
  const blocks = [...document.querySelectorAll("h1, h2, h3, h4, p, blockquote")].filter(
    (el) => el.checkVisibility({ checkOpacity: true }) && !el.closest("[inert], [aria-hidden='true']") && getComputedStyle(el).position !== "absolute",
  );
  const collisions = [];
  for (let i = 0; i < blocks.length; i++) {
    const ri = blocks[i].getBoundingClientRect();
    for (let j = i + 1; j < blocks.length; j++) {
      if (blocks[i].contains(blocks[j]) || blocks[j].contains(blocks[i])) continue;
      const rj = blocks[j].getBoundingClientRect();
      const ix = Math.max(0, Math.min(ri.right, rj.right) - Math.max(ri.left, rj.left));
      const iy = Math.max(0, Math.min(ri.bottom, rj.bottom) - Math.max(ri.top, rj.top));
      if (ix * iy > 24) collisions.push([blocks[i].textContent.trim().slice(0, 24), blocks[j].textContent.trim().slice(0, 24)]);
    }
  }
  return { issues, collisions, intentionalTruncation: ellipsis.length };
}

/* ─────────────────────────── per-viewport audit ─────────────────────────── */

async function auditViewport(browser, vp) {
  const tag = vp.name;
  const proxy = process.env.HTTPS_PROXY ? true : false;
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    isMobile: vp.isMobile,
    hasTouch: vp.hasTouch,
    deviceScaleFactor: vp.deviceScaleFactor,
    locale: "fa-IR",
    ignoreHTTPSErrors: proxy,
    reducedMotion: "no-preference",
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  const consoleErrors = [];
  page.on("console", (m) => m.type() === "error" && consoleErrors.push(m.text()));
  page.on("pageerror", (e) => consoleErrors.push(`pageerror: ${e.message}`));

  const tests = {};
  const shots = [];
  const shot = (name) => {
    const file = path.join(OUT, `${name}-${tag}.png`);
    shots.push(path.basename(file));
    return file;
  };
  const record = (key, pass, details, required = true) => {
    tests[key] = { pass, required, ...details };
    const mark = pass ? c.green("PASS") : required ? c.red("FAIL") : c.yellow("WARN");
    log(`    ${mark}  ${key}`);
  };

  log(c.bold(`\n  ▸ ${tag}`));
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const fontOk = await page.evaluate(() => document.fonts.check('16px "Vazirmatn FD"'));
  await autoScroll(page);
  await waitForImages(page);
  const overflowLog = [{ step: "load", ...(await overflow(page)) }];

  /* 03 gallery strip (wave / centre spotlight live) */
  await centerOn(page, "section[aria-labelledby='dock-title']");
  await settle(page, 1600);
  await page.locator("section[aria-labelledby='dock-title']").screenshot({ path: shot("03-gallery-strip-kinetic") });

  /* Test A — autonomous 3D levitation (no pointer interaction) */
  await centerOn(page, "[data-kinetic='showcase']");
  await settle(page, 900);
  const sample = () =>
    page.evaluate(() => {
      const card = document.querySelector("[data-kinetic='showcase']");
      const halo = [...document.querySelectorAll("[data-ornament='shamseh'] [data-spin='outer']")].find((n) => {
        const r = n.getBoundingClientRect();
        return r.bottom > 0 && r.top < innerHeight;
      });
      return { card: card ? getComputedStyle(card).transform : null, shamseh: halo ? getComputedStyle(halo).transform : null };
    });
  const t0 = await sample();
  await page.waitForTimeout(650);
  const t650 = await sample();
  await centerOn(page, "[data-kinetic='coffee']");
  await settle(page, 700);
  const coffee0 = await page.evaluate(() => getComputedStyle(document.querySelector("[data-kinetic='coffee']")).transform);
  await page.waitForTimeout(650);
  const coffee650 = await page.evaluate(() => getComputedStyle(document.querySelector("[data-kinetic='coffee']")).transform);
  const levitating = t0.card && t0.card !== "none" && t0.card !== t650.card;
  const spinning = t0.shamseh && t0.shamseh !== t650.shamseh;
  const coffeeFloat = coffee0 !== "none" && coffee0 !== coffee650;
  record("A-autonomous-3d-levitation", Boolean(levitating && spinning && coffeeFloat), {
    showcase: { t0: t0.card, t650: t650.card },
    shamseh: { t0: t0.shamseh, t650: t650.shamseh },
    coffeeDeck: { t0: coffee0, t650: coffee650 },
  }, vp.mobile);

  /* 04 studio — floating 3D card */
  await centerOn(page, "[data-kinetic='showcase']");
  await settle(page, 400);
  await page.screenshot({ path: shot("04-sweet-studio-3d-float") });

  /* Test B (1/2) — showcase swipe + next/prev, and 05 all six sweets with zero layout shift */
  const sB = { start: await selectedSweet(page) };
  await swipe(page, cdp, "[data-kinetic='showcase']", 0.2, 0.85, vp.mobile); // rightward = next (RTL)
  sB.afterSwipeNext = await selectedSweet(page);
  await swipe(page, cdp, "[data-kinetic='showcase']", 0.85, 0.2, vp.mobile); // leftward = previous
  sB.afterSwipePrev = await selectedSweet(page);
  await clickCentered(page.getByRole("button", { name: "شیرینی بعدی" }));
  await settle(page, 700);
  sB.afterNextButton = await selectedSweet(page);
  await clickCentered(page.getByRole("button", { name: "شیرینی قبلی" }));
  await settle(page, 700);
  sB.afterPrevButton = await selectedSweet(page);

  const stageShots = [];
  const heights = [];
  await overlays(page, false);
  for (let i = 0; i < SWEET_IDS.length; i++) {
    if (i > 0) {
      await clickCentered(page.getByRole("button", { name: "شیرینی بعدی" }));
      await settle(page, 1000);
    } else {
      await centerOn(page, "[data-stage-height]");
    }
    const id = await selectedSweet(page);
    heights.push(
      await page.evaluate(() => ({
        stage: Math.round(document.querySelector("[data-stage-height]").getBoundingClientRect().height),
        doc: document.documentElement.scrollHeight,
      })),
    );
    overflowLog.push({ step: `sweet:${id}`, ...(await overflow(page)) });
    const buf = await page.locator("[data-stage-height]").screenshot({ scale: "css" });
    stageShots.push({ label: `${String(i + 1).padStart(2, "0")} · ${id}`, b64: buf.toString("base64") });
  }
  await overlays(page, true);
  await contactSheet(browser, stageShots, shot("05-sweet-studio-all-6-sweets"), 3);
  const zeroShift = heights.every((h) => h.stage === heights[0].stage && h.doc === heights[0].doc);

  /* 06 bento grid */
  await clickCentered(page.getByRole("radio", { name: "نمای شبکه‌ای" }).last());
  await settle(page, 1300);
  overflowLog.push({ step: "bento", ...(await overflow(page)) });
  await page.evaluate(() => document.getElementById("sweet-studio").scrollIntoView({ block: "start", behavior: "instant" }));
  await settle(page, 800);
  await overlays(page, false);
  await page.locator("#sweet-studio").screenshot({ path: shot("06-sweet-studio-bento-grid") });
  await overlays(page, true);
  await clickCentered(page.getByRole("button", { name: /نمایش کامل ویژگی‌های باقلوا/ }));
  await settle(page, 900);
  const modalOpen = await page.locator("[role='dialog']").count();
  overflowLog.push({ step: "bento-modal", ...(await overflow(page)) });
  await page.keyboard.press("Escape");
  await settle(page, 700);
  await clickCentered(page.getByRole("radio", { name: "نمای استودیویی تعاملی" }).last());
  await settle(page, 1000);

  /* Test B (2/2) — coffee deck auto-cycle, swipe and controls · 07 deck states */
  await centerOn(page, "[data-kinetic='coffee']");
  const autoStart = await deckFront(page);
  await page.waitForTimeout(4700);
  const autoNext = await deckFront(page);
  await swipe(page, cdp, "[data-deck-front]", 0.25, 0.9, vp.mobile);
  const afterDeckSwipe = await deckFront(page);
  await clickCentered(page.getByRole("button", { name: "تصویر بعدی" }));
  await settle(page, 900);
  const afterDeckNext = await deckFront(page);

  const deckShots = [];
  await overlays(page, false);
  for (let i = 0; i < 3; i++) {
    await clickCentered(page.getByRole("tablist", { name: "تصاویر قهوه یزدی" }).getByRole("tab").nth(i));
    await settle(page, 900);
    const front = await deckFront(page);
    const caption = await page.evaluate(() => document.querySelector("[data-deck-caption]")?.textContent?.trim().slice(0, 60));
    overflowLog.push({ step: `coffee:${front}`, ...(await overflow(page)) });
    await page.evaluate(() => document.querySelector("[data-deck-front]")?.scrollIntoView({ block: "center", behavior: "instant" }));
    await settle(page, 500);
    const deckBox = await page.locator("[data-deck-front]").boundingBox();
    const x = vp.mobile ? 0 : Math.max(0, deckBox.x - 70);
    const y = Math.max(0, deckBox.y - 50);
    const buf = await page.screenshot({
      scale: "css",
      clip: {
        x,
        y,
        width: vp.mobile ? vp.width : Math.min(vp.width - x, deckBox.width + 140),
        height: Math.min(vp.height - y, deckBox.height + 300),
      },
    });
    deckShots.push({ label: `coffee-${i + 1}.webp → front=${front} · ${caption ?? ""}`, b64: buf.toString("base64"), front });
  }
  await overlays(page, true);
  await contactSheet(browser, deckShots, shot("07-yazdi-coffee-3d-deck"), 3);
  const deckCycles = deckShots.every((d, i) => d.front === i);

  // mobile story deck (only rendered on phones)
  let storyDeck = "n/a";
  if (vp.mobile) {
    const before = await page.evaluate(() => document.querySelector('[aria-label="روایت‌های تاریخی"] [aria-selected="true"]')?.getAttribute("aria-label"));
    await clickCentered(page.getByRole("button", { name: "روایت بعدی" }));
    await settle(page, 800);
    const after = await page.evaluate(() => document.querySelector('[aria-label="روایت‌های تاریخی"] [aria-selected="true"]')?.getAttribute("aria-label"));
    storyDeck = before !== after ? "pass" : "fail";
  }

  const bPass =
    sB.afterSwipeNext !== sB.start &&
    sB.afterSwipePrev === sB.start &&
    sB.afterNextButton !== sB.start &&
    sB.afterPrevButton === sB.start &&
    zeroShift &&
    modalOpen === 1 &&
    autoNext !== autoStart &&
    afterDeckSwipe !== autoNext &&
    afterDeckNext !== afterDeckSwipe &&
    deckCycles &&
    storyDeck !== "fail";
  record("B-auto-cycle-and-swipe", bPass, {
    showcase: sB,
    allSixSweets: { heights, zeroLayoutShift: zeroShift },
    bentoModalOpened: modalOpen === 1,
    coffeeDeck: { autoStart, autoNextAfter4700ms: autoNext, afterSwipe: afterDeckSwipe, afterNextButton: afterDeckNext, thumbCycle: deckShots.map((d) => d.front) },
    mobileStoryDeck: storyDeck,
  });

  /* Test C — zero horizontal overflow */
  overflowLog.push({ step: "final", ...(await overflow(page)) });
  const cPass = overflowLog.every((o) => o.scrollWidth <= o.clientWidth);
  record("C-zero-horizontal-overflow", cPass, { steps: overflowLog });

  /* Test D — local images + ornament layers */
  await autoScroll(page);
  await waitForImages(page);
  const img = await page.evaluate(probeImages);
  const orn = await page.evaluate(probeOrnaments);
  const missing = ALL_IMAGES.filter((f) => !img.files.includes(f));
  const ornOk = ["girih", "shamseh", "lachaki", "badgir"].every((k) => orn[k].count > 0 && orn[k].pointerEventsNone);
  record("D-images-and-ornaments", img.broken.length === 0 && img.notCover.length === 0 && missing.length === 0 && ornOk, {
    images: { ...img, missing },
    ornaments: orn,
  });

  /* Test E — touch targets (phones) */
  if (vp.mobile) {
    const tt = await page.evaluate(probeTouchTargets);
    record("E-touch-targets-44px", tt.fails.length === 0, { checked: tt.checked, below44: tt.fails, between44and48: tt.warns });
  } else {
    tests["E-touch-targets-44px"] = { pass: true, required: false, note: "desktop — not applicable" };
  }

  /* Test F — text clipping & collisions */
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await settle(page, 500);
  const clip = await page.evaluate(probeTextClipping);
  record("F-text-clipping-and-collisions", clip.issues.length === 0 && clip.collisions.length === 0, clip, vp.width <= 400);

  /* Test G — axe WCAG 2.x AA + keyboard */
  await autoScroll(page);
  await settle(page, 600);
  const axe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  const focus = [];
  await page.evaluate(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
  });
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press("Tab");
    focus.push(
      await page.evaluate(() => {
        const el = document.activeElement;
        return el ? `${el.tagName.toLowerCase()}:${(el.getAttribute("aria-label") || el.textContent || "").trim().slice(0, 30)}` : null;
      }),
    );
  }
  await clickCentered(page.locator("#sweet-tab-qottab"));
  await settle(page, 600);
  await page.locator("#sweet-tab-qottab").focus();
  await page.keyboard.press("ArrowLeft");
  await settle(page, 700);
  const arrowSelects = await selectedSweet(page);
  const galleryBtn = page.locator('[data-dock-id="pashmak"] button');
  await galleryBtn.evaluate((el) => {
    el.scrollIntoView({ block: "center", behavior: "instant" });
    el.focus();
  });
  await page.keyboard.press("Enter");
  await settle(page, 1400);
  const enterSelects = await selectedSweet(page);
  const keyboardOk = new Set(focus).size >= 4 && arrowSelects === "baghlava" && enterSelects === "pashmak";
  const focusRules = ["color-contrast", "button-name", "image-alt", "html-has-lang", "valid-lang", "aria-roles"];
  const ruleStatus = Object.fromEntries(
    focusRules.map((r) => [
      r,
      axe.violations.find((v) => v.id === r) ? "fail" : axe.passes.find((v) => v.id === r) ? "pass" : "n/a",
    ]),
  );
  record("G-accessibility-axe-and-keyboard", axe.violations.length === 0 && keyboardOk, {
    violations: axe.violations.map((v) => ({ id: v.id, impact: v.impact, nodes: v.nodes.length, sample: v.nodes.slice(0, 3).map((n) => n.target.join(" ")) })),
    incomplete: axe.incomplete.length,
    focusRules: ruleStatus,
    keyboard: { tabOrder: focus, arrowLeftSelects: arrowSelects, enterOnGallerySelects: enterSelects },
  });

  /* 01 + 02 — full-page captures run last: Playwright's fullPage capture resets
     Chromium's touch emulation, which would flip the site into hover (desktop) mode */
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await settle(page, 800);
  await page.screenshot({ path: shot("01-fullpage"), fullPage: true, scale: "css" });

  /* 02 hero + story + ornaments */
  const storyBottom = await page.evaluate(() => {
    const s = document.getElementById("story");
    return s ? Math.ceil(s.getBoundingClientRect().bottom + window.scrollY) : 1400;
  });
  await page.screenshot({ path: shot("02-hero-story-and-ornaments"), fullPage: true, clip: { x: 0, y: 0, width: vp.width, height: storyBottom }, scale: "css" });


  await context.close();
  return { viewport: vp, fontLoaded: fontOk, consoleErrors, screenshots: shots, tests };
}

/* ─────────────────────────── main ─────────────────────────── */

async function main() {
  log(c.bold("\n  Yazd Sweets · kinetic / visual / UX / a11y audit"));
  await rm(OUT, { recursive: true, force: true });
  await mkdir(OUT, { recursive: true });

  const server = await ensureServer();
  let browser;
  try {
    const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: "localhost,127.0.0.1" } : undefined;
    try {
      browser = await chromium.launch({ proxy });
    } catch (error) {
      throw new Error(`${error.message}\n\n  → Run "npm run audit:install" once to download Chromium.`);
    }

    const results = [];
    for (const vp of VIEWPORTS) results.push(await auditViewport(browser, vp));

    const failures = results.flatMap((r) =>
      Object.entries(r.tests)
        .filter(([, t]) => t.required && !t.pass)
        .map(([k]) => `${r.viewport.name} → ${k}`),
    );
    const report = { generatedAt: new Date().toISOString(), baseUrl: BASE, passed: failures.length === 0, failures, results };
    await writeFile(path.join(OUT, "audit-report.json"), JSON.stringify(report, null, 2), "utf8");

    log(c.bold("\n  Summary"));
    const keys = Object.keys(results[0].tests);
    log(`  ${"test".padEnd(36)}${results.map((r) => r.viewport.name.split("-")[0].padEnd(13)).join("")}`);
    for (const k of keys) {
      const row = results
        .map((r) => {
          const t = r.tests[k];
          const s = !t ? "—" : t.pass ? "pass" : t.required ? "FAIL" : "warn";
          const col = s === "pass" ? c.green : s === "FAIL" ? c.red : c.yellow;
          return col(s.padEnd(13));
        })
        .join("");
      log(`  ${k.padEnd(36)}${row}`);
    }
    for (const r of results) if (r.consoleErrors.length) log(c.yellow(`  console errors on ${r.viewport.name}: ${r.consoleErrors.length}`));
    log(failures.length ? c.red(`\n  ✖ ${failures.length} required check(s) failed — see .audit-screenshots/audit-report.json`) : c.green("\n  ✔ All required checks passed."));
    log(c.dim(`  screenshots + report → ${OUT}\n`));
    process.exitCode = failures.length ? 1 : 0;
  } finally {
    await browser?.close();
    server?.kill();
  }
}

main().catch((error) => {
  console.error(c.red(`\n  Audit error: ${error.stack || error.message}`));
  process.exitCode = 1;
});
