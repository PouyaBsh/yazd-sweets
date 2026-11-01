"use client";

import { useEffect, useRef } from "react";

/**
 * Global tactile grain — a whisper of paper / adobe texture over the whole screen.
 *
 * Was a full-screen live SVG <feTurbulence> filter: on phones it is re-rasterised at 3× density
 * every time the viewport height changes (the browser bar sliding in and out while scrolling) —
 * a 100 ms+ hitch each time. Now a 256 px grain tile is generated once on a canvas and repeated,
 * which costs nothing to draw. Same opacity, same look; never intercepts pointer events.
 */
export function NoiseOverlay() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const size = 256;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(size, size);
    // two octaves of value noise (fine grain + a softer mottling), desaturated
    const coarse = new Float32Array((size / 4) * (size / 4)).map(() => Math.random());
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const c = coarse[(y >> 2) * (size / 4) + (x >> 2)];
        const v = Math.round((Math.random() * 0.7 + c * 0.3) * 255);
        const i = (y * size + x) * 4;
        img.data[i] = v;
        img.data[i + 1] = v;
        img.data[i + 2] = v;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    el.style.backgroundImage = `url(${canvas.toDataURL("image/png")})`;
  }, []);
  return (
    <div
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 opacity-[0.028]"
      style={{ backgroundSize: "128px 128px", backgroundRepeat: "repeat" }}
    />
  );
}
