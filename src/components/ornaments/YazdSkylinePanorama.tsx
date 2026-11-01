"use client";

import { motion, type Transition, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import { ORNAMENT } from "./geometry";

/* ───────────────────────── geometry helpers (static strings, SSR-safe) ───────────────────────── */

/** Persian pointed arch (four-centred look) from x=a to x=b, springing at ys, apex at ya, open at yb. */
function arch(a: number, b: number, yb: number, ys: number, ya: number) {
  const m = (a + b) / 2;
  const k = (b - a) * 0.12;
  return `M${a} ${yb}V${ys}C${a} ${ys - (ys - ya) * 0.55} ${m - k} ${ya + (ys - ya) * 0.22} ${m} ${ya}C${m + k} ${ya + (ys - ya) * 0.22} ${b} ${ys - (ys - ya) * 0.55} ${b} ${ys}V${yb}`;
}

/** Crenellated windcatcher crown: merlons of width w from x0 to x1 at height y (top yTop). */
function crown(x0: number, x1: number, y: number, yTop: number, w = 4) {
  let d = `M${x0} ${y}`;
  for (let x = x0; x + w <= x1 + 0.01; x += w * 2) {
    d += `V${yTop}H${x + w}V${y}`;
    if (x + w * 2 <= x1 + 0.01) d += `H${x + w * 2}`;
  }
  return d;
}

/** Vertical vent slots of a windcatcher. */
function slots(xs: number[], y0: number, y1: number) {
  return xs.map((x) => `M${x} ${y0}V${y1}`).join("");
}

const G = 128; // ground line

/* left house with a roof dome */
const HOUSE_L = `M14 ${G}V100H58V${G}M24 100a12 10 0 0 1 24 0`;
const HOUSE_L_DOOR = arch(31, 41, G, 118, 110);

/* windcatcher A */
const BADGIR_A = `M70 ${G}V54H102V${G}M67 54H105M72 54V30H100V54`;
const BADGIR_A_TOP = crown(72, 100, 30, 24);
const BADGIR_A_SLOTS = slots([77, 83, 89, 95], 34, 48);
const BADGIR_A_NICHE = arch(81, 91, 108, 96, 88);

/* palm */
const PALM_TRUNK = `M126 ${G}C125 114 128 100 124 86`;
const PALM_FRONDS = [
  "M124 86C116 80 108 81 103 88",
  "M124 86C118 76 111 72 105 72",
  "M124 86C123 77 125 71 129 66",
  "M124 86C128 76 135 72 142 74",
  "M124 86C132 82 140 85 144 92",
];

/* Amir-Chakhmaq style tiered facade with two slim minarets */
const FACADE = `M156 ${G}V62H294V${G}M152 62H298`;
const FACADE_UPPER = [0, 1, 2, 3, 4, 5].map((i) => arch(162 + i * 22, 178 + i * 22, 90, 78, 68)).join("");
const FACADE_LOWER = [arch(164, 182, 124, 108, 98), arch(188, 206, 124, 108, 98), arch(244, 262, 124, 108, 98), arch(268, 286, 124, 108, 98)].join("");
const FACADE_PORTAL = arch(212, 238, G, 108, 92);
const minaret = (x: number, top: number, base: number) =>
  `M${x} ${base}V${top + 8}M${x + 8} ${base}V${top + 8}M${x - 2} ${top + 18}H${x + 10}M${x} ${top + 8}C${x} ${top + 3} ${x + 3} ${top} ${x + 4} ${top - 3}C${x + 5} ${top} ${x + 8} ${top + 3} ${x + 8} ${top + 8}`;
const FACADE_MINARETS = minaret(205, 22, 62) + minaret(237, 22, 62);

/* Jameh-mosque portal (pishtaq) with the twin tall minarets */
const PORTAL = `M336 ${G}V40H404V${G}M333 40H407`;
const PORTAL_ARCH = arch(348, 392, G, 76, 54);
const PORTAL_INNER = arch(356, 384, G, 92, 74);
const PORTAL_MINARETS = minaret(338, 4, 40) + minaret(394, 4, 40);

/* dome on its drum */
const DOME_BODY = `M404 ${G}V96H416M416 ${G}V92H496V${G}`;
const DOME = "M420 92C420 72 444 62 456 46C468 62 492 72 492 92";
const DOME_RIBS = "M438 92C440 77 449 65 456 53M474 92C472 77 463 65 456 53";
const DOME_FINIAL = "M456 46V37";
const DRUM_WINDOWS = [arch(426, 436, 112, 104, 98), arch(451, 461, 112, 104, 98), arch(476, 486, 112, 104, 98)].join("");

/* Dowlat-Abad: tallest windcatcher rising from its garden pavilion */
const PAVILION = `M520 ${G}V104H592V${G}M516 104H596`;
const PAVILION_ARCHES = [arch(528, 544, G, 118, 110), arch(548, 564, G, 118, 110), arch(568, 584, G, 118, 110)].join("");
const BADGIR_B = "M540 104V42H572V104M537 42H575M542 42V16H570V42";
const BADGIR_B_TOP = crown(542, 570, 16, 10);
const BADGIR_B_SLOTS = slots([547, 552, 557, 562, 567], 20, 36);

/* Abarkuh-style cypress */
const CYPRESS = `M608 ${G}V120M608 120C598 106 599 82 608 62C617 82 618 106 608 120Z`;

/* domed-roof houses + small windcatcher */
const HOUSES_R = `M626 ${G}V100H704V${G}M634 100a10 9 0 0 1 20 0M659 100a10 9 0 0 1 20 0M684 100a10 9 0 0 1 20 0`;
const HOUSES_R_DOORS = [arch(640, 650, G, 118, 111), arch(680, 690, G, 118, 111)].join("");
const BADGIR_C = `M710 ${G}V78H730V${G}M707 78H733`;
const BADGIR_C_TOP = crown(712, 728, 78, 72);
const BADGIR_C_SLOTS = slots([716, 720, 724], 84, 96);

/* ───────────────────────── component ───────────────────────── */

type Stroke = { d: string; color: string; w?: number; o?: number };

const STROKES: Stroke[] = [
  { d: HOUSE_L, color: ORNAMENT.terracotta },
  { d: HOUSE_L_DOOR, color: ORNAMENT.terracotta, w: 0.9 },
  { d: BADGIR_A, color: ORNAMENT.terracotta },
  { d: BADGIR_A_TOP, color: ORNAMENT.terracotta },
  { d: BADGIR_A_SLOTS, color: ORNAMENT.firuzeh, w: 1.4 },
  { d: BADGIR_A_NICHE, color: ORNAMENT.terracotta, w: 0.9 },
  { d: PALM_TRUNK, color: ORNAMENT.terracotta, w: 1.5 },
  ...PALM_FRONDS.map((d) => ({ d, color: "#5C7A45", w: 1.3 })),
  { d: FACADE, color: ORNAMENT.terracotta },
  { d: FACADE_UPPER, color: ORNAMENT.terracotta, w: 0.85 },
  { d: FACADE_LOWER, color: ORNAMENT.terracotta, w: 0.85 },
  { d: FACADE_PORTAL, color: ORNAMENT.firuzeh, w: 1.1 },
  { d: FACADE_MINARETS, color: ORNAMENT.terracotta },
  { d: PORTAL, color: ORNAMENT.terracotta },
  { d: PORTAL_ARCH, color: ORNAMENT.terracotta },
  { d: PORTAL_INNER, color: ORNAMENT.firuzeh, w: 1.1 },
  { d: PORTAL_MINARETS, color: ORNAMENT.terracotta },
  { d: DOME_BODY, color: ORNAMENT.terracotta },
  { d: DOME, color: ORNAMENT.firuzeh, w: 1.3 },
  { d: DOME_RIBS, color: ORNAMENT.firuzeh, w: 0.8, o: 0.55 },
  { d: DOME_FINIAL, color: ORNAMENT.saffron, w: 1.4 },
  { d: DRUM_WINDOWS, color: ORNAMENT.terracotta, w: 0.85 },
  { d: PAVILION, color: ORNAMENT.terracotta },
  { d: PAVILION_ARCHES, color: ORNAMENT.terracotta, w: 0.9 },
  { d: BADGIR_B, color: ORNAMENT.terracotta },
  { d: BADGIR_B_TOP, color: ORNAMENT.terracotta },
  { d: BADGIR_B_SLOTS, color: ORNAMENT.firuzeh, w: 1.3 },
  { d: CYPRESS, color: "#5C7A45", w: 1.2 },
  { d: HOUSES_R, color: ORNAMENT.terracotta },
  { d: HOUSES_R_DOORS, color: ORNAMENT.terracotta, w: 0.9 },
  { d: BADGIR_C, color: ORNAMENT.terracotta },
  { d: BADGIR_C_TOP, color: ORNAMENT.terracotta },
  { d: BADGIR_C_SLOTS, color: ORNAMENT.firuzeh, w: 1.2 },
];

/** soft adobe fills behind the line work */
const FILL_ADOBE = [
  `M14 ${G}V100H58V${G}Z`,
  `M70 ${G}V30H100V54H102V${G}Z`,
  `M156 ${G}V62H294V${G}Z`,
  `M336 ${G}V40H404V${G}Z`,
  `M404 ${G}V96H416V92H496V${G}Z`,
  `M520 ${G}V104H540V16H570V104H592V${G}Z`,
  `M626 ${G}V100H704V${G}Z`,
  `M710 ${G}V78H730V${G}Z`,
].join("");

const DRAW: Transition = { type: "spring", stiffness: 22, damping: 14, restDelta: 0.0005 };
// leaving the screen resets instantly (no spring running off-screen); coming back draws again
const draw: Variants = {
  hidden: { pathLength: 0, opacity: 0, transition: { duration: 0 } },
  show: (i: number) => ({ pathLength: 1, opacity: 1, transition: { pathLength: { ...DRAW, delay: i * 0.035 }, opacity: { duration: 0.2, delay: i * 0.035 } } }),
};
const fade: Variants = {
  hidden: { opacity: 0, transition: { duration: 0 } },
  show: { opacity: 1, transition: { type: "spring", stiffness: 30, damping: 18, delay: 0.6 } },
};

/**
 * Footer panorama of Yazd: windcatchers (Dowlat-Abad, Yazdi badgirs), the Jameh-mosque portal with
 * its twin minarets, a tiled dome against a low desert sun, the Amir-Chakhmaq tiered facade,
 * domed-roof houses, a palm and a cypress. Line work draws itself in every time it scrolls into view.
 */
export function YazdSkylinePanorama({ className }: { className?: string }) {
  return (
    <motion.svg
      viewBox="0 -8 760 140"
      preserveAspectRatio="xMidYMax meet"
      className={cn("pointer-events-none block", className)}
      fill="none"
      aria-hidden
      data-ornament="skyline"
      initial="hidden"
      whileInView="show"
      viewport={{ once: false, amount: 0.35 }}
    >
      {/* desert sun sinking behind the dome */}
      <motion.g variants={fade}>
        <circle cx={468} cy={70} r={34} fill={ORNAMENT.saffron} fillOpacity={0.12} />
        <circle cx={468} cy={70} r={34} stroke={ORNAMENT.saffron} strokeOpacity={0.35} strokeWidth={0.8} strokeDasharray="1.5 4" />
      </motion.g>
      <motion.g variants={fade}>
        <path d={FILL_ADOBE} fill={ORNAMENT.terracotta} fillOpacity={0.06} />
        <path d={`${DOME}Z`} fill={ORNAMENT.firuzeh} fillOpacity={0.13} />
        <path d={CYPRESS} fill="#5C7A45" fillOpacity={0.16} />
        <circle cx={456} cy={35} r={2.2} fill={ORNAMENT.saffron} />
        <circle cx={342} cy={1.5} r={1.4} fill={ORNAMENT.saffron} />
        <circle cx={398} cy={1.5} r={1.4} fill={ORNAMENT.saffron} />
      </motion.g>
      {STROKES.map((s, i) => (
        <motion.path
          key={i}
          custom={i}
          variants={draw}
          d={s.d}
          stroke={s.color}
          strokeOpacity={s.o ?? 0.72}
          strokeWidth={s.w ?? 1.15}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {/* ground */}
      <motion.path custom={0} variants={draw} d={`M0 ${G}.5H760`} stroke={ORNAMENT.terracotta} strokeOpacity={0.55} strokeWidth={1} />
    </motion.svg>
  );
}
