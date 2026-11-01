"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  /** px */
  size: number;
  /** ring thickness in px */
  stroke: number;
  color: string;
  track: string;
  /** one full turn, ms */
  duration: number;
  /** change it to start a fresh, empty ring (new step / manual pick) */
  cycleKey: string | number;
  running: boolean;
  /** fires once when the ring closes */
  onDone?: () => void;
  className?: string;
}

/**
 * A countdown ring that is also the timer.
 * Two half-rings rotate on transform only (right half 0→50 %, left half 50→100 %), so the fill runs
 * on the compositor thread — an SVG stroke-dashoffset animation would repaint the page every frame.
 * When the ring closes it calls onDone; pausing the ring pauses the step.
 */
export function ProgressRing({ size, stroke, color, track, duration, cycleKey, running, onDone, className }: ProgressRingProps) {
  const rightRef = useRef<HTMLSpanElement>(null);
  const leftRef = useRef<HTMLSpanElement>(null);
  const anims = useRef<Animation[]>([]);
  const onDoneRef = useRef(onDone);
  const runningRef = useRef(running);

  useEffect(() => {
    onDoneRef.current = onDone;
    runningRef.current = running;
  });

  useEffect(() => {
    const r = rightRef.current;
    const l = leftRef.current;
    if (!r || !l) return;
    const opts: KeyframeAnimationOptions = { duration, easing: "linear", fill: "forwards" };
    const a1 = r.animate(
      [
        { transform: "rotate(-135deg)", offset: 0 },
        { transform: "rotate(45deg)", offset: 0.5 },
        { transform: "rotate(45deg)", offset: 1 },
      ],
      opts,
    );
    const a2 = l.animate(
      [
        { transform: "rotate(-135deg)", offset: 0 },
        { transform: "rotate(-135deg)", offset: 0.5 },
        { transform: "rotate(45deg)", offset: 1 },
      ],
      opts,
    );
    a1.onfinish = () => onDoneRef.current?.();
    anims.current = [a1, a2];
    if (!runningRef.current) {
      a1.pause();
      a2.pause();
    }
    return () => {
      a1.onfinish = null;
      a1.cancel();
      a2.cancel();
    };
  }, [cycleKey, duration]);

  useEffect(() => {
    anims.current.forEach((a) => {
      if (a.playState === "finished") return;
      if (running) a.play();
      else a.pause();
    });
  }, [running, cycleKey]);

  const half = size / 2;
  const arc = { width: size, height: size, borderWidth: stroke, top: 0 } as const;
  return (
    <span aria-hidden data-progress-ring data-running={running ? "" : undefined} className={cn("relative block shrink-0", className)} style={{ width: size, height: size }}>
      <span className="absolute inset-0 rounded-full border-solid" style={{ borderWidth: stroke, borderColor: track }} />
      {/* right half: fills 12 → 6 o'clock */}
      <span className="absolute top-0 overflow-hidden" style={{ left: half, width: half, height: size }}>
        <span
          ref={rightRef}
          className="absolute rounded-full border-solid"
          style={{ ...arc, left: -half, borderColor: "transparent", borderTopColor: color, borderRightColor: color, transform: "rotate(-135deg)" }}
        />
      </span>
      {/* left half: fills 6 → 12 o'clock */}
      <span className="absolute top-0 overflow-hidden" style={{ left: 0, width: half, height: size }}>
        <span
          ref={leftRef}
          className="absolute rounded-full border-solid"
          style={{ ...arc, left: 0, borderColor: "transparent", borderBottomColor: color, borderLeftColor: color, transform: "rotate(-135deg)" }}
        />
      </span>
    </span>
  );
}
