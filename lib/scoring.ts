import type { Pick, Series, ScoreBreakdown } from "./types";

// Points per round for correct winner
const ROUND_POINTS: Record<number, number> = {
  1: 1,
  2: 2,
  3: 4,
  4: 8,
};