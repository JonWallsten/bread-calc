import { Injectable } from '@angular/core';
import { FlourBlendRow } from './flour.config';
import {
    YEAST_LABELS,
    TIMER_CONSTANTS,
    BULK_CLAMP,
    BULK_RATIO,
    FINAL_PROOF_MAX,
    SHAPE_CLAMP,
    MANUAL_MIX_CONSTANTS,
    MACHINE_MIX_CONSTANTS,
    BAKE_TIME_TABLE,
    OVEN_TEMP_TABLE,
} from './config';
export { YEAST_LABELS } from './config';
export { DEFAULT_INPUTS } from './config';

export interface CalcInputs {
    breadCount: number;
    targetBallWeight: number;
    yeastType: 'fresh' | 'activeDry' | 'instant' | 'swedishDry';
    hydrationPct: number;
    saltPct: number;
    sugarPct: number;
    oilPct: number;
    milkPctOfWater: number;
    starterWeight: number;
    starterHydrationPct: number;
    totalHours: number;
    roomTemp: number;
    flourBlendAdjustment?: number;
    customHydrationAdjustment?: number;
    mixingMethod: 'manual' | 'machine';
    mixerSpeedLow?: string;
    mixerSpeedLowMedium?: string;
    mixerSpeedMedium?: string;
}

export interface CalcResult {
    breadCount: number;
    targetBallWeight: number;
    targetDoughWeight: number;
    yeastType: string;
    yeastTypeLabel: string;
    hydrationPct: number;
    effectiveHydrationPct: number;
    flourBlendAdjustment: number;
    customHydrationAdjustment: number;
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
    ovenTempLow: number;
    ovenTempHigh: number;
    fold1: number;
    fold2: number;
    freshPctFinal: number;
    mixingMethod: 'manual' | 'machine';
    initialMixMinutes: number;
    autolyseMinutes: number;
    incorporationMinutes: number;
    developmentMinutes: number;
    mixerSpeedLow: string;
    mixerSpeedLowMedium: string;
    mixerSpeedMedium: string;
    flourBlendRows?: FlourBlendRow[];
}

export type CalcOutput = CalcResult | { error: string };

@Injectable({ providedIn: 'root' })
export class CalcService {
    readonly clamp = (val: number, min: number, max: number): number =>
        Math.max(min, Math.min(max, val));

    readonly round1 = (v: number): number => Math.round(v * 10) / 10;

    /** Format ingredient weight consistently: whole grams, except yeast < 10 g gets 1 decimal */
    formatWeight(value: number, isYeast = false): string {
        if (isYeast && value < 10) return `${this.round1(value)}`;
        return `${Math.round(value)}`;
    }

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
            flourBlendAdjustment: flourAdj = 0,
            customHydrationAdjustment: customAdj = 0,
            mixingMethod = 'manual',
            mixerSpeedLow = '1',
            mixerSpeedLowMedium = '2–3',
            mixerSpeedMedium = '3–4',
        } = inputs;

        const effectiveHydrationPct = hydrationPct + flourAdj + customAdj;

        if (
            breadCount < 1 ||
            targetBallWeight < 1 ||
            hydrationPct < 1 ||
            saltPct <= 0 ||
            starterHydrationPct < 1 ||
            totalHours <= 0
        ) {
            return {
                error: 'validation',
            };
        }

        const targetDoughWeight = breadCount * targetBallWeight;
        const hydration = effectiveHydrationPct / 100;
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
        const starterHydrationFactor = this.clamp(
            0.9 + (starterHydration - 1.0) * 0.25,
            0.82,
            1.08,
        );
        const reduction = Math.min(0.48, starterRatio * 1.15 * starterHydrationFactor);
        freshPct *= 1 - reduction;
        freshPct = Math.max(0.0005, freshPct);

        const freshPctFinal = freshPct;
        let chosenYeastPct: number;
        if (yeastType === 'activeDry') {
            chosenYeastPct = freshPctFinal / 2.5;
        } else if (yeastType === 'instant' || yeastType === 'swedishDry') {
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
                error: 'recipe',
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
            flourToAdd +
            starterWeight +
            addedWaterTotal +
            saltToAdd +
            sugarToAdd +
            oilToAdd +
            yeastToAdd;
        const actualPerBall = finalDoughWeight / breadCount;
        const prefermentedFlourPct = (starterFlour / totalFlour) * 100;

        const round5 = (v: number) => Math.round(v / 5) * 5;
        const totalMinutes = totalHours * 60;
        const { benchRestMinutes, preheatMinutes, bakeMinutesDefault, finalProofMinMinutes } =
            TIMER_CONSTANTS;

        // Dynamic bake time based on weight per piece
        const bakeMinutes =
            BAKE_TIME_TABLE.find((row) => actualPerBall <= row.maxWeight)?.minutes ??
            bakeMinutesDefault;

        // Oven temperature recommendation based on weight per piece
        const ovenTempEntry =
            OVEN_TEMP_TABLE.find((row) => actualPerBall <= row.maxWeight) ??
            OVEN_TEMP_TABLE[OVEN_TEMP_TABLE.length - 1];
        const ovenTempLow = ovenTempEntry.low;
        const ovenTempHigh = ovenTempEntry.high;

        // Compute mixing step breakdown based on method
        let initialMixMinutes: number;
        let autolyseMinutes: number;
        let incorporationMinutes: number;
        let developmentMinutes: number;

        if (mixingMethod === 'machine') {
            initialMixMinutes = MACHINE_MIX_CONSTANTS.initialMixMinutes;
            autolyseMinutes = MACHINE_MIX_CONSTANTS.autolyseMinutes;
            incorporationMinutes = MACHINE_MIX_CONSTANTS.incorporationMinutes;
            developmentMinutes = MACHINE_MIX_CONSTANTS.developmentMixMinutes;
        } else {
            initialMixMinutes = MANUAL_MIX_CONSTANTS.initialMixMinutes;
            autolyseMinutes = MANUAL_MIX_CONSTANTS.autolyseMinutes;
            incorporationMinutes = 0;
            developmentMinutes = MANUAL_MIX_CONSTANTS.developmentMinutes;
        }

        const mixMinutes =
            initialMixMinutes + autolyseMinutes + incorporationMinutes + developmentMinutes;

        const divideAndShapeMinutes = round5(
            this.clamp(breadCount * SHAPE_CLAMP.perLoafFactor, SHAPE_CLAMP.min, SHAPE_CLAMP.max),
        );

        // Time available for fermentation = total minus non-ferment steps
        const nonFermentMinutes =
            mixMinutes + divideAndShapeMinutes + benchRestMinutes + preheatMinutes + bakeMinutes;
        const availableMinutes = Math.max(0, totalMinutes - nonFermentMinutes);

        const bulkMinutes = round5(
            this.clamp(availableMinutes * BULK_RATIO, BULK_CLAMP.min, BULK_CLAMP.max),
        );
        const finalProofMinutes = round5(
            this.clamp(availableMinutes - bulkMinutes, finalProofMinMinutes, FINAL_PROOF_MAX),
        );

        const fold1 = round5(bulkMinutes * 0.33);
        const fold2 = round5(bulkMinutes * 0.66);
        const yeastTypeLabel = YEAST_LABELS[yeastType];

        return {
            breadCount,
            targetBallWeight,
            targetDoughWeight,
            yeastType,
            yeastTypeLabel,
            hydrationPct,
            effectiveHydrationPct,
            flourBlendAdjustment: flourAdj,
            customHydrationAdjustment: customAdj,
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
            ovenTempLow,
            ovenTempHigh,
            fold1,
            fold2,
            freshPctFinal,
            mixingMethod,
            initialMixMinutes,
            autolyseMinutes,
            incorporationMinutes,
            developmentMinutes,
            mixerSpeedLow,
            mixerSpeedLowMedium,
            mixerSpeedMedium,
        };
    }
}
