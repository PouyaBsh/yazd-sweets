import { cn } from "@/lib/utils";

type OrnamentProps = { className?: string; strokeWidth?: number };

/** Points for an 8-pointed khatam star (Persian girih motif). */
function khatamPoints(cx: number, cy: number, r: number, inner = 0.62) {
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const radius = i % 2 === 0 ? r : r * inner;
    const angle = (Math.PI / 8) * i - Math.PI / 2;
    pts.push(`${(cx + radius * Math.cos(angle)).toFixed(2)},${(cy + radius * Math.sin(angle)).toFixed(2)}`);
  }
  return pts.join(" ");
}

/** Solid 8-pointed star — used as the brand mark and bullet accents. */
export function KhatamStar({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={cn("h-6 w-6", className)} aria-hidden>
      <polygon points={khatamPoints(24, 24, 22)} fill="currentColor" />
      <polygon points={khatamPoints(24, 24, 10)} fill="var(--color-canvas)" />
      <circle cx="24" cy="24" r="3.2" fill="currentColor" />
    </svg>
  );
}

/** Line-art girih rosette for decorative corners. */
export function GirihRosette({ className, strokeWidth = 1 }: OrnamentProps) {
  return (
    <svg viewBox="0 0 200 200" className={className} fill="none" aria-hidden>
      <g stroke="currentColor" strokeWidth={strokeWidth}>
        <polygon points={khatamPoints(100, 100, 92, 0.7)} />
        <polygon points={khatamPoints(100, 100, 64, 0.7)} />
        <polygon points={khatamPoints(100, 100, 36, 0.7)} />
        <circle cx="100" cy="100" r="96" strokeOpacity="0.5" />
        <rect x="35" y="35" width="130" height="130" strokeOpacity="0.6" />
        <rect x="35" y="35" width="130" height="130" transform="rotate(45 100 100)" strokeOpacity="0.6" />
      </g>
    </svg>
  );
}

/** Pointed Persian arch (iwan) outline. */
export function ArchOutline({ className, strokeWidth = 1 }: OrnamentProps) {
  return (
    <svg viewBox="0 0 200 280" className={className} fill="none" preserveAspectRatio="none" aria-hidden>
      <path
        d="M4 280V110C4 52 52 22 100 4c48 18 96 48 96 106v170"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/** Yazd windcatcher (badgir) silhouette strip — for the footer and section breaks. */
export function BadgirSkyline({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 600 80" className={className} fill="currentColor" aria-hidden preserveAspectRatio="xMidYMax meet">
      <path d="M0 80V62h40V50h18v12h30V36h10V18h34v18h10v26h40V56c0-14 12-24 26-24s26 10 26 24v6h34V28h8V8h40v20h8v34h36V48h20v14h40V30h10V14h30v16h10v32h44v18Z" />
      <g fill="var(--color-canvas)" opacity="0.9">
        <rect x="113" y="22" width="3" height="12" />
        <rect x="120" y="22" width="3" height="12" />
        <rect x="127" y="22" width="3" height="12" />
        <rect x="345" y="12" width="3" height="14" />
        <rect x="352" y="12" width="3" height="14" />
        <rect x="359" y="12" width="3" height="14" />
        <rect x="366" y="12" width="3" height="14" />
        <rect x="504" y="18" width="3" height="10" />
        <rect x="511" y="18" width="3" height="10" />
        <rect x="518" y="18" width="3" height="10" />
      </g>
    </svg>
  );
}

/** Khesht (mud-brick) bond pattern, used as a faint texture inside cards. */
export function KheshtPattern({ className, id = "khesht" }: { className?: string; id?: string }) {
  return (
    <svg className={cn("pointer-events-none", className)} aria-hidden>
      <defs>
        <pattern id={id} width="48" height="24" patternUnits="userSpaceOnUse">
          <path d="M0 .5h48M0 12.5h48M.5 0v12M24.5 12v12" stroke="currentColor" strokeWidth="1" fill="none" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  );
}
