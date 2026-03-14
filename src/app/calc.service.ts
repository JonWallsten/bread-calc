import { Injectable } from '@angular/core';

export interface CalcInputs {
  breadCount: number;
  targetBallWeight: number;
  yeastType: 'fresh' | 'activeDry' | 'instant';
  hydrationPct: number;
  saltPct: number;
  sugarPct: number;
  oilPct: number;
  milkPctOfWater: number;
  starterWeight: number;
  starterHydrationPct: number;
  totalHours: number;
  roomTemp: number;
}

export interface CalcResult {
  breadCount: number;
  targetBallWeight: number;
  targetDoughWeight: number;
  yeastType: string;
  yeastTypeLabel: string;
  hydrationPct: number;
  saltPct: number;
  sugarPct: number;
  oilPct: number;
  milkPctOfWater: number;
  starterWeight: number;
  starterHydrationPct: number;
  starterFlour: number;
  starterWater: number;
  totalHours: number;
  roomTemp: number;
  flourToAdd: number;
  totalFlour: number;
  totalWater: number;
  waterToAdd: number;
  milkToAdd: number;
  saltToAdd: number;
  sugarToAdd: number;
  oilToAdd: number;
  yeastToAdd: number;
  chosenYeastPct: number;
  finalDoughWeight: number;
  actualPerBall: number;
  prefermentedFlourPct: number;
  mixMinutes: number;
  bulkMinutes: number;
  divideAndShapeMinutes: number;
  benchRestMinutes: number;
  finalProofMinutes: number;
  preheatMinutes: number;
  bakeMinutes: number;
  fold1: number;
  fold2: number;
  freshPctFinal: number;
}

export type CalcOutput = CalcResult | { error: string };

export const YEAST_LABELS: Record<string, string> = {
  fresh: 'Fresh yeast',
  activeDry: 'Active dry yeast',
  instant: 'Instant yeast',
};

export const DEFAULT_INPUTS: CalcInputs = {
  breadCount: 6,
  targetBallWeight: 120,
  yeastType: 'fresh',
  hydrationPct: 68,
  saltPct: 2.0,
  sugarPct: 0,
  oilPct: 0,
  milkPctOfWater: 0,
  starterWeight: 380,
  starterHydrationPct: 100,
  totalHours: 8,
  roomTemp: 22,
};

@Injectable({ providedIn: 'root' })
export class CalcService {
  readonly clamp = (val: number, min: number, max: number): number =>
    Math.max(min, Math.min(max, val));

  readonly round1 = (v: number): number => Math.round(v * 10) / 10;

  yeastBaseline(hours: number): number {
    if (hours <= 3) return 2.8;
    if (hours <= 4) return 2.0;
    if (hours <= 5) return 1.5;
    if (hours <= 6) return 1.1;
    if (hours <= 7) return 0.85;
    if (hours <= 8) return 0.65;
    if (hours <= 9) return 0.5;
    if (hours <= 10) return 0.4;
    if (hours <= 12) return 0.3;
    return 0.2;
  }

  waterTempRange(roomTemp: number): string {
    if (roomTemp >= 27) return '12–14 °C';
    if (roomTemp >= 24) return '14–16 °C';
    if (roomTemp >= 21) return '16–18 °C';
    if (roomTemp >= 18) return '18–20 °C';
    return '20–22 °C';
  }

  calculate(inputs: CalcInputs): CalcOutput {
    const {
      breadCount,
      targetBallWeight,
      yeastType,
      hydrationPct,
      saltPct,
      sugarPct,
      oilPct,
      milkPctOfWater,
      starterWeight,
      starterHydrationPct,
      totalHours,
      roomTemp,
    } = inputs;

    if (
      breadCount < 1 ||
      targetBallWeight < 1 ||
      hydrationPct < 1 ||
      saltPct <= 0 ||
      starterHydrationPct < 1 ||
      totalHours <= 0
    ) {
      return {
        error: 'Please enter valid values. Salt must be greater than zero.',
      };
    }

    const targetDoughWeight = breadCount * targetBallWeight;
    const hydration = hydrationPct / 100;
    const salt = saltPct / 100;
    const sugar = sugarPct / 100;
    const oil = oilPct / 100;
    const milkFraction = milkPctOfWater / 100;
    const starterHydration = starterHydrationPct / 100;

    const starterFlour = starterWeight / (1 + starterHydration);
    const starterWater = starterWeight - starterFlour;

    let freshPct = this.yeastBaseline(totalHours) / 100;
    freshPct *= Math.pow(0.9, roomTemp - 22);

    const starterRatio = starterWeight / targetDoughWeight;
    const starterHydrationFactor = this.clamp(0.9 + (starterHydration - 1.0) * 0.25, 0.82, 1.08);
    const reduction = Math.min(0.48, starterRatio * 1.15 * starterHydrationFactor);
    freshPct *= 1 - reduction;
    freshPct = Math.max(0.0005, freshPct);

    const freshPctFinal = freshPct;
    let chosenYeastPct: number;
    if (yeastType === 'activeDry') {
      chosenYeastPct = freshPctFinal / 2.5;
    } else if (yeastType === 'instant') {
      chosenYeastPct = freshPctFinal / 3.0;
    } else {
      chosenYeastPct = freshPctFinal;
    }

    const additivePct = hydration + salt + sugar + oil + chosenYeastPct;
    const starterImpact =
      starterWeight +
      (hydration * starterFlour - starterWater) +
      salt * starterFlour +
      sugar * starterFlour +
      oil * starterFlour +
      chosenYeastPct * starterFlour;

    const flourToAdd = (targetDoughWeight - starterImpact) / (1 + additivePct);

    if (flourToAdd <= 0 || !isFinite(flourToAdd)) {
      return {
        error:
          'These inputs do not produce a valid recipe. Try increasing target weight or reducing starter.',
      };
    }

    const totalFlour = flourToAdd + starterFlour;
    const totalWater = hydration * totalFlour;
    const addedWaterTotal = Math.max(0, totalWater - starterWater);
    const milkToAdd = addedWaterTotal * milkFraction;
    const waterToAdd = addedWaterTotal - milkToAdd;
    const saltToAdd = totalFlour * salt;
    const sugarToAdd = totalFlour * sugar;
    const oilToAdd = totalFlour * oil;
    const yeastToAdd = totalFlour * chosenYeastPct;
    const finalDoughWeight =
      flourToAdd + starterWeight + addedWaterTotal + saltToAdd + sugarToAdd + oilToAdd + yeastToAdd;
    const actualPerBall = finalDoughWeight / breadCount;
    const prefermentedFlourPct = (starterFlour / totalFlour) * 100;

    const totalMinutes = totalHours * 60;
    const mixMinutes = 35;
    const bulkMinutes = Math.round(this.clamp(totalMinutes * 0.42, 135, 240));
    const divideAndShapeMinutes = Math.round(this.clamp(breadCount * 1.2, 22, 48));
    const benchRestMinutes = 15;
    const preheatMinutes = 45;
    const bakeMinutes = 15;
    const finalProofMinutes = Math.max(
      50,
      Math.round(
        totalMinutes -
          mixMinutes -
          bulkMinutes -
          divideAndShapeMinutes -
          benchRestMinutes -
          preheatMinutes -
          bakeMinutes,
      ),
    );

    const fold1 = Math.round(bulkMinutes * 0.33);
    const fold2 = Math.round(bulkMinutes * 0.66);
    const yeastTypeLabel = YEAST_LABELS[yeastType];

    return {
      breadCount,
      targetBallWeight,
      targetDoughWeight,
      yeastType,
      yeastTypeLabel,
      hydrationPct,
      saltPct,
      sugarPct,
      oilPct,
      milkPctOfWater,
      starterWeight,
      starterHydrationPct,
      starterFlour,
      starterWater,
      totalHours,
      roomTemp,
      flourToAdd,
      totalFlour,
      totalWater,
      waterToAdd,
      milkToAdd,
      saltToAdd,
      sugarToAdd,
      oilToAdd,
      yeastToAdd,
      chosenYeastPct,
      finalDoughWeight,
      actualPerBall,
      prefermentedFlourPct,
      mixMinutes,
      bulkMinutes,
      divideAndShapeMinutes,
      benchRestMinutes,
      finalProofMinutes,
      preheatMinutes,
      bakeMinutes,
      fold1,
      fold2,
      freshPctFinal,
    };
  }
}
