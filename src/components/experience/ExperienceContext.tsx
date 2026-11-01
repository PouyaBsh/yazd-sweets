"use client";

import { createContext, useContext } from "react";

export type ViewMode = "studio" | "bento";
/** 1 = forward (next sweet), -1 = backward. Drives directional 3D transitions. */
export type Direction = 1 | -1;

export interface ExperienceState {
  /** Currently showcased sweet in the Sweet Studio. */
  selectedSweetId: string;
  direction: Direction;
  /** Select a sweet; direction is inferred from the order when omitted. */
  selectSweet: (id: string, direction?: Direction) => void;
  /** Move forward/backward through the six sweets (wraps around). */
  stepSweet: (delta: Direction) => void;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  /** Select a sweet, switch to the studio view and smooth-scroll to #sweet-studio. */
  focusSweet: (id: string) => void;
}

export const ExperienceContext = createContext<ExperienceState | null>(null);

export function useExperience() {
  const ctx = useContext(ExperienceContext);
  if (!ctx) throw new Error("useExperience must be used inside <YazdExperience>");
  return ctx;
}
