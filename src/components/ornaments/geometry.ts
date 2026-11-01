/** Shared sacred-geometry helpers for the Yazd ornament system. */

/** n-pointed star polygon points. `inner` is the inner radius as a ratio of `r`. */
export function starPoints(cx: number, cy: number, r: number, n: number, inner = 0.62, rotation = -90) {
  const pts: string[] = [];
  const offset = (rotation * Math.PI) / 180;
  for (let i = 0; i < n * 2; i++) {
    const radius = i % 2 === 0 ? r : r * inner;
    const angle = (Math.PI / n) * i + offset;
    pts.push(`${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`);
  }
  return pts.join(" ");
}

/** Regular polygon points. */
export function polygonPoints(cx: number, cy: number, r: number, n: number, rotation = -90) {
  const pts: string[] = [];
  const offset = (rotation * Math.PI) / 180;
  for (let i = 0; i < n; i++) {
    const angle = ((Math.PI * 2) / n) * i + offset;
    pts.push(`${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`);
  }
  return pts.join(" ");
}

/** Points evenly spaced on a circle (for dot rings / radial strokes). */
export function ringPositions(cx: number, cy: number, r: number, n: number, rotation = -90) {
  const offset = (rotation * Math.PI) / 180;
  return Array.from({ length: n }, (_, i) => {
    const angle = ((Math.PI * 2) / n) * i + offset;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle), angle: (angle * 180) / Math.PI };
  });
}

/** Ornament palette (strokes only — never used for text). */
export const ORNAMENT = {
  terracotta: "#B85D3B",
  saffron: "#D48C29",
  firuzeh: "#1D6A73",
  lajevard: "#27466B",
  copper: "#C8893A",
  gold: "#E2B467",
  cream: "#F5EFE6",
} as const;
