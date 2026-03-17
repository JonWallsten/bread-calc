import { CalcInputs } from './calc.service';

export interface Recipe {
    id: string;
    name: string;
    nameKey?: string; // i18n key for built-in presets
    inputs: CalcInputs;
    builtIn: boolean;
    updatedAt?: string;
    skipUpload?: boolean;
}

export const BUILT_IN_RECIPES: Recipe[] = [
    {
        id: 'neapolitan-pizza',
        name: 'Neapolitan Pizza',
        nameKey: 'recipeNeapolitanPizza',
        builtIn: true,
        inputs: {
            breadCount: 4,
            targetBallWeight: 270,
            yeastType: 'fresh',
            hydrationPct: 65,
            saltPct: 2.5,
            sugarPct: 0,
            oilPct: 0,
            milkPctOfWater: 0,
            starterWeight: 0,
            starterHydrationPct: 100,
            totalHours: 24,
            roomTemp: 22,
            mixingMethod: 'manual',
        },
    },
    {
        id: 'everyday-bread',
        name: 'Everyday Bread',
        nameKey: 'recipeEverydayBread',
        builtIn: true,
        inputs: {
            breadCount: 24,
            targetBallWeight: 90,
            yeastType: 'fresh',
            hydrationPct: 66,
            saltPct: 2.0,
            sugarPct: 2.0,
            oilPct: 2.0,
            milkPctOfWater: 0,
            starterWeight: 0,
            starterHydrationPct: 100,
            totalHours: 8,
            roomTemp: 22,
            mixingMethod: 'manual',
        },
    },
];
