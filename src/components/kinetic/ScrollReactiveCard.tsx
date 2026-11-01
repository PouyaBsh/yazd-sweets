"use client";

import { motion, useInView, useSpring, useTransform, type HTMLMotionProps } from "framer-motion";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { SPRING_CONFIG } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useCanHover, useScrollVelocity } from "./hooks";

const ReactiveContext = createContext(false);

/** Read the "active" state of the nearest ScrollReactiveCard (hover on desktop, viewport-centre on touch). */
export function useReactive() {
  return useContext(ReactiveContext);
}

interface ScrollReactiveCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  className?: string;
  /** Force a state (e.g. the selected sweet). */
  forceActive?: boolean;
  /** Lift in px when active. */
  lift?: number;
}

/**
 * "Scroll is the mobile cursor."
 *  • desktop (hover: hover): active while hovered
 *  • touch: active while the card sits in the central 60% of the viewport
 *  • touch: scroll velocity adds a subtle inertial drift (±5px) for a living, physical feel
 * Children (e.g. LachakiCardFrame) read the active state through context.
 */
export function ScrollReactiveCard({ children, className, forceActive, lift = 4, style, ...rest }: ScrollReactiveCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const canHover = useCanHover();
  const inCenter = useInView(ref, { margin: "-20% 0px -20% 0px" });
  const [hovered, setHovered] = useState(false);
  const active = forceActive ?? (canHover ? hovered : inCenter);

  const { velocity } = useScrollVelocity();
  const liftSpring = useSpring(0, SPRING_CONFIG);
  const drift = useTransform(velocity, [-3000, 0, 3000], [5, 0, -5]);
  const y = useTransform([liftSpring, drift], ([l, d]: number[]) => l + (canHover ? 0 : d));

  useEffect(() => {
    liftSpring.set(active ? -lift : 0);
  }, [active, lift, liftSpring]);

  return (
    <ReactiveContext.Provider value={active}>
      <motion.div
        ref={ref}
        data-reactive={active ? "active" : "idle"}
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => setHovered(false)}
        style={{ ...style, y }}
        className={cn("relative", className)}
        {...rest}
      >
        {children}
      </motion.div>
    </ReactiveContext.Provider>
  );
}
