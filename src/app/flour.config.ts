// ── Flour definitions ──────────────────────────────────

export interface FlourDefinition {
    id: string;
    nameEn: string;
    nameSv: string;
    hydrationBias: number;
    notesEn: string;
    notesSv: string;
}

export const FLOUR_DEFINITIONS: FlourDefinition[] = [
    {
        id: 'nuvola_super',
        nameEn: 'Caputo Nuvola Super',
        nameSv: 'Caputo Nuvola Super',
        hydrationBias: 2.5,
        notesEn: 'Strong flour that handles higher hydration well.',
        notesSv: 'Starkt mjöl som klarar högre hydrering bra.',
    },
    {
        id: 'manitoba_cream',
        nameEn: 'Manitoba Cream',
        nameSv: 'Manitoba Cream',
        hydrationBias: 1.5,
        notesEn: 'Strong flour with good water absorption.',
        notesSv: 'Starkt mjöl med god vattenabsorption.',
    },
    {
        id: 'rustique',
        nameEn: 'Rustique',
        nameSv: 'Rustique',
        hydrationBias: 2.0,
        notesEn:
            'Rustic flour that often feels dry early and benefits from slightly higher hydration.',
        notesSv: 'Rustikt mjöl som ofta känns torrt tidigt och gynnas av något högre hydrering.',
    },
    {
        id: 'strong_bread',
        nameEn: 'Strong bread flour',
        nameSv: 'Vetemjöl Special',
        hydrationBias: 0.5,
        notesEn: 'Standard strong bread flour with moderate absorption.',
        notesSv: 'Standardmässigt starkt brödmjöl med måttlig absorption.',
    },
    {
        id: 'tipo_00',
        nameEn: 'Tipo 00',
        nameSv: 'Tipo 00',
        hydrationBias: 0,
        notesEn: 'Fine Italian flour. Neutral hydration baseline, good for pizza and soft breads.',
        notesSv: 'Fint italienskt mjöl. Neutral hydreringsbaslinje, bra för pizza och mjuka bröd.',
    },
    {
        id: 'sifted_spelt',
        nameEn: 'Sifted spelt',
        nameSv: 'Siktat dinkel',
        hydrationBias: -1.0,
        notesEn: 'Weaker gluten than wheat. Tends to absorb less water, handle gently.',
        notesSv:
            'Svagare gluten än vete. Tenderar att absorbera mindre vatten, hantera försiktigt.',
    },
    {
        id: 'whole_spelt',
        nameEn: 'Whole spelt',
        nameSv: 'Fullkornsdinkel',
        hydrationBias: 1.5,
        notesEn: 'Absorbs more water due to bran. Needs gentler mixing.',
        notesSv: 'Absorberar mer vatten pga kli. Behöver försiktigare blandning.',
    },
    {
        id: 'rye_sifted',
        nameEn: 'Sifted rye',
        nameSv: 'Rågsikt',
        hydrationBias: 2.0,
        notesEn: 'High absorption, sticky dough. Best as a portion of the total flour.',
        notesSv: 'Hög absorption, kladdig deg. Bäst som en del av det totala mjölet.',
    },
    {
        id: 'rye_flour',
        nameEn: 'Rye flour',
        nameSv: 'Rågmjöl',
        hydrationBias: 3.0,
        notesEn: 'Very high absorption. Use in smaller amounts unless making a rye-heavy bread.',
        notesSv:
            'Mycket hög absorption. Använd i mindre mängder om du inte gör ett rågdominerat bröd.',
    },
];

// ── Flour blend row ───────────────────────────────────

export interface FlourBlendRow {
    flourId: string;
    percent: number;
}

// ── Flour preset ──────────────────────────────────────

export interface FlourPreset {
    id: string;
    nameEn: string;
    nameSv: string;
    flours: FlourBlendRow[];
    customHydrationAdjustment: number;
    notesEn: string;
    notesSv: string;
    builtin: true;
}

export interface UserFlourPreset {
    id: string;
    name: string;
    flours: FlourBlendRow[];
    customHydrationAdjustment: number;
    notes: string;
    createdAt: string;
    updatedAt: string;
}

export const BUILT_IN_PRESETS: FlourPreset[] = [
    {
        id: 'builtin_fluffy_rolls',
        nameEn: 'Fluffy rolls',
        nameSv: 'Fluffiga frallor',
        flours: [
            { flourId: 'nuvola_super', percent: 55 },
            { flourId: 'manitoba_cream', percent: 30 },
            { flourId: 'rustique', percent: 15 },
        ],
        customHydrationAdjustment: 0,
        notesEn: 'Great for soft, fluffy dinner rolls.',
        notesSv: 'Perfekt för mjuka, fluffiga frallor.',
        builtin: true,
    },
    {
        id: 'builtin_rustic_everyday',
        nameEn: 'Rustic everyday',
        nameSv: 'Rustikt vardagsbröd',
        flours: [
            { flourId: 'strong_bread', percent: 70 },
            { flourId: 'rustique', percent: 20 },
            { flourId: 'rye_sifted', percent: 10 },
        ],
        customHydrationAdjustment: 0.5,
        notesEn: 'Hearty everyday bread with a hint of rye.',
        notesSv: 'Mustigt vardagsbröd med en touch av råg.',
        builtin: true,
    },
];

export function getFlourDefinitionById(id: string): FlourDefinition | undefined {
    return FLOUR_DEFINITIONS.find((f) => f.id === id);
}

export function calculateFlourBlendAdjustment(rows: FlourBlendRow[]): number {
    let total = 0;
    for (const row of rows) {
        const def = getFlourDefinitionById(row.flourId);
        if (def) {
            total += row.percent * def.hydrationBias;
        }
    }
    return total / 100;
}
