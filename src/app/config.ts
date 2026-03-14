import { CalcInputs } from "./calc.service";

// Default form values
export const DEFAULT_INPUTS: CalcInputs = {
  breadCount: 6,
  targetBallWeight: 90,
  yeastType: "fresh",
  hydrationPct: 66,
  saltPct: 2.0,
  sugarPct: 2.0,
  oilPct: 2.0,
  milkPctOfWater: 0,
  starterWeight: 380,
  starterHydrationPct: 100,
  totalHours: 8,
  roomTemp: 22,
};

// Yeast type display labels
export const YEAST_LABELS: Record<string, string> = {
  fresh: "Fresh yeast",
  activeDry: "Active dry yeast",
  instant: "Instant yeast",
};

// Fixed step durations (minutes)
export const TIMER_CONSTANTS = {
  mixMinutes: 35,
  benchRestMinutes: 15,
  finalShapeMinutes: 10,
  preheatMinutes: 45,
  bakeMinutes: 15,
  finalProofMinMinutes: 50,
};

// Bulk fermentation clamp bounds (minutes)
export const BULK_CLAMP = { min: 135, max: 240 };

// Divide & pre-shape clamp bounds (minutes, per-loaf factor)
export const SHAPE_CLAMP = { min: 22, max: 48, perLoafFactor: 1.2 };
