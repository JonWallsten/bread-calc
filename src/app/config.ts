import { CalcInputs } from "./calc.service";

// Default mixer speed labels (display only, do not affect timing)
export const DEFAULT_MIXER_SPEEDS = {
  low: "1",
  lowMedium: "2–3",
  medium: "3–4",
};

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
  starterWeight: 0,
  starterHydrationPct: 100,
  totalHours: 8,
  roomTemp: 22,
  mixingMethod: "manual",
  mixerSpeedLow: DEFAULT_MIXER_SPEEDS.low,
  mixerSpeedLowMedium: DEFAULT_MIXER_SPEEDS.lowMedium,
  mixerSpeedMedium: DEFAULT_MIXER_SPEEDS.medium,
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

// Manual mixing step durations (minutes)
export const MANUAL_MIX_CONSTANTS = {
  initialMixMinutes: 5,
  autolyseMinutes: 20,
  developmentMinutes: 10,
};

// Machine (stand mixer) mixing step durations (minutes)
export const MACHINE_MIX_CONSTANTS = {
  initialMixMinutes: 4,
  autolyseMinutes: 20,
  incorporationMinutes: 2,
  developmentMixMinutes: 6,
};

// Bulk fermentation clamp bounds (minutes)
export const BULK_CLAMP = { min: 135, max: 240 };

// Divide & pre-shape clamp bounds (minutes, per-loaf factor)
export const SHAPE_CLAMP = { min: 22, max: 48, perLoafFactor: 1.2 };

// Recommended ranges and validation thresholds for percentage fields.
// 'rec' = typical/recommended baker's range (shown in hints).
// 'warn' = outside the recommended range but still plausible (amber).
// 'error' = extreme values, almost certainly a mistake (red).
export interface FieldRange {
  rec: { min: number; max: number };
  warn: { min: number; max: number };
  error: { min: number; max: number };
}

export const FIELD_RANGES: Record<string, FieldRange> = {
  hydration: {
    rec: { min: 60, max: 80 },
    warn: { min: 50, max: 90 },
    error: { min: 50, max: 90 },
  },
  salt: {
    rec: { min: 1.8, max: 2.2 },
    warn: { min: 1.5, max: 3.0 },
    error: { min: 1.5, max: 3.0 },
  },
  sugar: {
    rec: { min: 0, max: 5 },
    warn: { min: 0, max: 10 },
    error: { min: 0, max: 10 },
  },
  oil: {
    rec: { min: 0, max: 5 },
    warn: { min: 0, max: 10 },
    error: { min: 0, max: 10 },
  },
  milk: {
    rec: { min: 0, max: 50 },
    warn: { min: 0, max: 75 },
    error: { min: 0, max: 75 },
  },
};
