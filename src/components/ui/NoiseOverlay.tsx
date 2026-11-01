/**
 * Global tactile grain — a whisper of paper / adobe texture over the whole screen.
 * Pure SVG <feTurbulence>, no image request, never intercepts pointer events.
 */
export function NoiseOverlay() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-50 opacity-[0.028]">
      <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
        <filter id="yazd-grain">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#yazd-grain)" />
      </svg>
    </div>
  );
}
