import { Injectable, signal, computed } from '@angular/core';

export type Lang = 'en' | 'sv';

const STORAGE_KEY = 'breadCalcLang';

interface Translations {
    // Topbar
    appTitle: string;

    // Sections
    dough: string;
    yeast: string;
    percentages: string;
    starter: string;
    proofing: string;
    results: string;
    instructions: string;
    copyRecipe: string;
    copyInstructions: string;
    copied: string;

    // Dough fields
    numberOfBreads: string;
    ballWeight: string;
    hintBallWeight: string;

    // Yeast fields
    yeastType: string;
    freshYeast: string;
    swedishDryYeast: string;
    activeDryYeast: string;
    instantYeast: string;
    yeastRecommendationPending: string;
    yeastHelpFresh: string;
    yeastHelpSwedishDry: string;
    yeastHelpActiveDry: string;
    yeastHelpInstant: string;

    // Advanced
    advancedSettings: string;

    // Percentages fields
    hydration: string;
    hintHydration: string;
    salt: string;
    hintSalt: string;
    sugar: string;
    hintSugar: string;
    oil: string;
    hintOil: string;
    milkAsPctOfWater: string;
    hintMilk: string;

    // Starter fields
    starterTotalWeight: string;
    hintStarter: (minG: number, maxG: number) => string;
    starterHydration: string;
    hintStarterHydration: string;

    // Proofing fields
    timeUntilOven: string;
    roomTemperature: string;

    // Button
    calculate: string;

    // Info tooltips
    infoDough: string;
    infoYeast: string;
    infoPercentages: string;
    infoStarter: string;
    infoProofing: string;

    // Results
    totalDoughWeight: string;
    actualPerBall: string;
    starterFlourShare: string;
    waterTemperature: string;
    ingredients: string;
    flourToAdd: string;
    waterToAdd: string;
    milkToAdd: string;
    saltIngredient: string;
    sugarIngredient: string;
    oilIngredient: string;

    // Results support text template parts
    supportStarterCalc: (hydPct: number, flourG: number, waterG: number) => string;
    supportYeastEstimated: (label: string, hoursStr: string, tempStr: string) => string;
    supportHeuristic: string;

    // Instructions
    stepMix: string;
    stepBulk: string;
    stepDivide: string;
    stepBenchRest: string;
    stepFinalShape: string;
    stepFinalProof: string;
    stepPreheat: string;
    stepBake: string;

    // Manual mixing steps
    stepMixLiquids: string;
    stepAddFlour: string;
    stepRest: string;
    stepAddSaltEtc: string;
    stepDevelopByHand: string;

    // Machine mixing steps
    stepInitialMix: string;
    stepMachineRest: string;
    stepIncorporate: string;
    stepDevelopMachine: string;

    // Mixing method
    mixingMethod: string;
    manual: string;
    machine: string;
    mixerSpeedLow: string;
    mixerSpeedLowMedium: string;
    mixerSpeedMedium: string;
    yourMixer: string;

    // Instruction body templates
    bodyMix: (
        starterG: number,
        waterG: number,
        milkPart: string,
        yeastPart: string,
        flourG: number,
        saltG: number,
        sugarPart: string,
        oilPart: string,
    ) => string;
    bodyBulk: (temp: number, duration: string, fold1: string, fold2: string) => string;
    bodyDivide: (count: number, weight: number) => string;
    bodyBenchRest: (duration: string) => string;
    bodyFinalShape: string;
    bodyFinalProof: (temp: number, duration: string) => string;
    bodyPreheat: (duration: string, tempLow: number, tempHigh: number) => string;
    bodyBake: (duration: string) => string;
    ovenTempGuide: string;

    // Manual instruction body templates
    bodyMixLiquids: (ingredientList: string) => string;
    bodyDisperseStarter: (ingredientList: string) => string;
    bodyAddFlour: (ingredientList: string) => string;
    bodyAddFlourWithDryYeast: (flourList: string, yeastPhrase: string) => string;
    bodyAddFlourWithSwedishYeast: (flourList: string, yeastPhrase: string) => string;
    bodyHydrateDryYeast: (yeastPhrase: string) => string;
    bodyRest: (duration: string) => string;
    bodyAddSaltEtc: (extras: string) => string;
    bodyDevelopByHand: (duration: string) => string;

    // Machine instruction body templates
    bodyInitialMix: (liquidsList: string, flourList: string, speedPhrase: string) => string;
    bodyDisperseStarterMachine: (ingredientList: string, speedPhrase: string) => string;
    bodyAddFlourMachine: (flourList: string, speedPhrase: string) => string;
    bodyAddFlourWithDryYeastMachine: (
        flourList: string,
        yeastPhrase: string,
        speedPhrase: string,
    ) => string;
    bodyAddFlourWithSwedishYeastMachine: (
        flourList: string,
        yeastPhrase: string,
        speedPhrase: string,
    ) => string;
    bodyHydrateDryYeastMachine: (yeastPhrase: string) => string;
    bodyMachineRest: (duration: string) => string;
    bodyIncorporate: (extras: string, speedPhrase: string) => string;
    bodyDevelopMachine: (duration: string, speedPhrase: string) => string;
    // Timer
    startTimer: string;
    editTimer: string;
    estimatedTime: string;
    extendTimer: string;
    pause: string;
    resume: string;
    reset: string;
    finished: string;
    running: string;
    paused: string;
    stopped: string;

    // Bulk fermentation phases
    bulkPhaseRest: string;
    bulkPhaseFold1: string;
    bulkPhaseFold2: string;
    bulkPhaseFinal: string;
    phaseLabel: (current: number, total: number) => string;

    // Short words / connectors
    water: string;
    flour: string;
    milk: string;
    and: string;

    // Flour blend
    flourBlend: string;
    infoFlourBlend: string;
    preset: string;
    loadPreset: string;
    savePreset: string;
    updatePreset: string;
    deletePreset: string;
    newPreset: string;
    addFlour: string;
    removeFlour: string;
    flourType: string;
    share: string;
    totalPct: string;
    blendMustBe100: string;
    duplicateFlour: string;
    presetName: string;
    presetNotes: string;
    customAdjustment: string;
    builtIn: string;
    myPreset: string;
    baseHydration: string;
    flourAdjustment: string;
    presetAdjustment: string;
    effectiveHydration: string;
    hydrationWarning: string;
    flourBlendAbsorptionNote: string;
    hydrationAdjustedNote: (adjustment: string) => string;
    enterPresetName: string;
    confirmDeletePreset: string;
    noPresets: string;
    cancel: string;
    save: string;

    // Navigation
    calculator: string;
    sessions: string;
    loginToViewSessions: string;
    bakeSaved: string;
    viewSessions: string;

    // Aria-labels
    switchLanguage: string;
    toggleTheme: string;
    scrollToTop: string;
    decrease: string;
    increase: string;
    markComplete: (title: string) => string;
    markIncomplete: (title: string) => string;

    // Splash screen
    splashTitle: string;
    splashSubtitle: string;
    splashFeature1: string;
    splashFeature2: string;
    splashFeature3: string;
    splashFeature4: string;
    splashFeature5: string;
    splashGetStarted: string;

    // Validation
    validationError: string;
    recipeError: string;

    // Recipes
    recipes: string;
    selectRecipe: string;
    saveRecipe: string;
    loadRecipe: string;
    deleteRecipe: string;
    updateRecipe: string;
    recipeName: string;
    enterRecipeName: string;
    confirmDeleteRecipe: string;
    savedRecipes: string;
    noSavedRecipes: string;
    recipeNeapolitanPizza: string;
    recipeEverydayBread: string;
    recipeSaved: string;
    recipeLoaded: string;

    // Auth
    loginWithGoogle: string;
    logout: string;
    loggedInAs: string;

    // Saved bakes
    myBakes: string;
    saveBakeTitle: string;
    saveThisBake: string;
    bakingNotes: string;
    bakeTitle: string;
    bakingRating: string;
    bakedOn: string;
    noBakes: string;
    confirmDeleteBake: string;
    uploadPhoto: string;
    deletePhoto: string;
    maxPhotos: string;
    viewBake: string;
    showRecipe: string;
    hideRecipe: string;
    adjustValues: string;
    addPhotos: string;
    pendingPhotos: string;
    noPhotos: string;
    photoOf: (current: number, total: number) => string;

    // Compare
    compareBakes: string;
    selectBakeA: string;
    selectBakeB: string;
    difference: string;
    noChange: string;
    higher: string;
    lower: string;
    yeastIngredient: string;
    milkIngredient: string;
    sugarAmount: string;
    oilAmount: string;
    deleteBake: string;
    bakeAgain: string;
    editBake: string;
    shareBake: string;
    stopSharing: string;
    linkCopied: string;
    sharedByUser: (name: string) => string;
    bakeNotFound: string;
    noBakesYet: string;
    compareNeedTwo: string;

    // Sync
    uploadLocalRecipesTitle: string;
    uploadLocalRecipesBody: (count: number) => string;
    uploadButton: string;
    keepLocalButton: string;
    uploadToCloud: string;
}

const en: Translations = {
    appTitle: 'Bread Dough Calculator',
    dough: 'Dough',
    yeast: 'Yeast',
    percentages: 'Percentages',
    starter: 'Starter',
    proofing: 'Proofing',
    results: 'Recipe',
    instructions: 'Instructions',
    copyRecipe: 'Copy recipe',
    copyInstructions: 'Copy instructions',
    copied: 'Copied!',
    numberOfBreads: 'Number of breads',
    ballWeight: 'Ball weight (g)',
    hintBallWeight:
        'Rolls: 80–100 g · Baguette: 350–400 g · Sandwich loaf: 500–900 g · Sourdough boule: 700–1000 g · Pizza: 200–280 g',
    yeastType: 'Yeast type',
    freshYeast: 'Fresh yeast',
    swedishDryYeast: 'Swedish dry yeast (KronJäst)',
    activeDryYeast: 'Active dry yeast',
    instantYeast: 'Instant yeast',
    yeastRecommendationPending: 'Estimated yeast will appear after calculate.',
    yeastHelpFresh: 'Crumble into the liquid and mix until dispersed.',
    yeastHelpSwedishDry:
        'Mix into the flour first, let stand about 10 minutes, then add finger-warm liquid.',
    yeastHelpActiveDry: 'Dissolve in warm liquid first, then continue with the flour.',
    yeastHelpInstant: 'Mix directly into the flour before adding liquid.',
    advancedSettings: 'Advanced settings',
    hydration: 'Hydration',
    hintHydration: 'Typical: 60–80%',
    salt: 'Salt',
    hintSalt: 'Typical: 1.8–2.2%',
    sugar: 'Sugar',
    hintSugar: 'Optional, 0–5%',
    oil: 'Oil',
    hintOil: 'Optional, 0–5%',
    milkAsPctOfWater: 'Milk as % of added water',
    hintMilk: 'Optional, 0–50%',
    starterTotalWeight: 'Starter total weight (g)',
    hintStarter: (minG, maxG) => `Typical: ${minG}–${maxG} g (10–30% of flour)`,
    starterHydration: 'Starter hydration (%)',
    hintStarterHydration: 'Typical: 80–125%',
    timeUntilOven: 'Time until oven (hours)',
    roomTemperature: 'Room temperature (\u00b0C)',
    calculate: 'Calculate',
    infoDough:
        'Enter how many breads you want and the target weight per ball. Final weight per ball is approximate because the final dough weight depends on rounding.',
    infoYeast:
        'Choose the yeast type. The calculator estimates the amount from total time until oven, room temperature, starter amount, and starter hydration.',
    infoPercentages:
        'Hydration is total liquid divided by total flour, including the flour and water inside the starter. Salt is required. Sugar and oil are optional. Milk replaces part of the added water.',
    infoStarter:
        'Starter total weight is the full starter amount in grams. Starter hydration is the water-to-flour ratio inside the starter. For example, 100% hydration means equal parts water and flour by weight.',
    infoProofing:
        'Enter the total time until the dough should go into the oven and the room temperature. The calculator splits this into mixing, bulk fermentation, shaping, final proof, and preheating.',
    totalDoughWeight: 'Total dough weight',
    actualPerBall: 'Actual per ball',
    starterFlourShare: 'Pre-fermented flour',
    waterTemperature: 'Water temperature',
    ingredients: 'Ingredients',
    flourToAdd: 'Flour to add',
    waterToAdd: 'Water to add',
    milkToAdd: 'Milk to add',
    saltIngredient: 'Salt',
    sugarIngredient: 'Sugar',
    oilIngredient: 'Oil',
    supportStarterCalc: (hydPct: number, flourG: number, waterG: number) =>
        `Starter is calculated at ${hydPct}% hydration, which means roughly ${flourG} g flour and ${waterG} g water inside the starter.`,
    supportYeastEstimated: (label: string, hoursStr: string, tempStr: string) =>
        `${label} is estimated from ${hoursStr} h, ${tempStr}\u00b0C, total starter amount, and starter hydration.`,
    supportHeuristic: 'This is a practical baking heuristic, not an exact fermentation model.',
    stepMix: 'Mix',
    stepBulk: 'Bulk fermentation',
    stepDivide: 'Divide and pre-shape',
    stepBenchRest: 'Bench rest',
    stepFinalShape: 'Final shape',
    stepFinalProof: 'Final proof',
    stepPreheat: 'Preheat oven',
    stepBake: 'Bake',

    // Manual mixing steps
    stepMixLiquids: 'Mix liquids',
    stepAddFlour: 'Add flour',
    stepRest: 'Rest',
    stepAddSaltEtc: 'Add salt & extras',
    stepDevelopByHand: 'Develop by hand',

    // Machine mixing steps
    stepInitialMix: 'Initial mix',
    stepMachineRest: 'Rest',
    stepIncorporate: 'Incorporate salt & extras',
    stepDevelopMachine: 'Develop in mixer',

    // Mixing method
    mixingMethod: 'Mixing method',
    manual: 'By hand',
    machine: 'Stand mixer',
    mixerSpeedLow: 'Low speed',
    mixerSpeedLowMedium: 'Low-medium speed',
    mixerSpeedMedium: 'Medium speed',
    yourMixer: 'your mixer',

    bodyMix: (starterG, waterG, milkPart, yeastPart, flourG, saltG, sugarPart, oilPart) =>
        `Mix ${starterG} g starter, ${waterG} g water${milkPart}${yeastPart}. Add ${flourG} g flour and mix until no dry flour remains. Rest about 20 minutes, then add ${saltG} g salt${sugarPart}${oilPart}. Mix until smooth, elastic, and slightly tacky.`,
    bodyBulk: (temp, duration, fold1, fold2) =>
        `Ferment around ${temp}\u00b0C for about ${duration}. Give one fold at about ${fold1} and another at about ${fold2}. The dough should feel lighter and puffier by the end.`,
    bodyDivide: (count, weight) =>
        `Divide into ${count} pieces, about ${weight} g each. Pre-shape gently.`,
    bodyBenchRest: (duration) =>
        `Rest covered for ${duration} so the dough relaxes before final shaping.`,
    bodyFinalShape:
        'Shape into rolls or rustic squares. Build enough surface tension for height without squeezing out too much gas.',
    bodyFinalProof: (temp, duration) =>
        `Proof at about ${temp}\u00b0C for around ${duration}. A fingertip dent should spring back slowly, not immediately.`,
    bodyPreheat: (duration, tempLow, tempHigh) =>
        `Preheat to ${tempLow}\u2013${tempHigh}\u00b0C during the last ${duration} of final proof.`,
    bodyBake: (duration) =>
        `Bake with steam if possible. Start at high heat, then reduce slightly if needed. Bake for about ${duration}, until golden and set.`,
    ovenTempGuide:
        'Higher temp (240\u00b0C+) gives a crispier crust and faster browning. Lower temp (200\u2013210\u00b0C) gives a softer crust and more even bake. Larger breads need lower temp and longer time.',

    // Manual instruction body templates
    bodyMixLiquids: (ingredientList) =>
        `Combine ${ingredientList} in a bowl. Stir until evenly dispersed.`,
    bodyDisperseStarter: (ingredientList) =>
        `Combine ${ingredientList} in a bowl. Stir until the starter is loosened and evenly dispersed.`,
    bodyAddFlour: (ingredientList) =>
        `Add ${ingredientList} and mix by hand until no dry flour remains. Do not knead yet.`,
    bodyAddFlourWithDryYeast: (flourList, yeastPhrase) =>
        `Mix ${yeastPhrase} into ${flourList}, then add to the bowl and mix by hand until no dry flour remains. Do not knead yet.`,
    bodyAddFlourWithSwedishYeast: (flourList, yeastPhrase) =>
        `Mix ${yeastPhrase} into ${flourList} and let stand for about 10 minutes. Then combine with the starter mixture and mix by hand until no dry flour remains.`,
    bodyHydrateDryYeast: (yeastPhrase) =>
        ` In a separate cup, dissolve ${yeastPhrase} in a small amount of warm water, then add it to the bowl.`,
    bodyRest: (duration) =>
        `Cover and rest for ${duration}. The flour absorbs the water and gluten begins to develop on its own.`,
    bodyAddSaltEtc: (extras) =>
        `Add ${extras} to the dough. Pinch and fold until fully incorporated.`,
    bodyDevelopByHand: (duration) =>
        `Knead or use stretch-and-folds for about ${duration} until the dough is smooth, elastic, and slightly tacky.`,

    // Machine instruction body templates
    bodyInitialMix: (liquidsList, flourList, speedPhrase) =>
        `Add ${liquidsList} to the mixer bowl. Add ${flourList} and mix on ${speedPhrase} until no dry flour remains.`,
    bodyDisperseStarterMachine: (ingredientList, speedPhrase) =>
        `Add ${ingredientList} to the mixer bowl. Mix briefly on ${speedPhrase} until the starter is loosened and evenly dispersed.`,
    bodyAddFlourMachine: (flourList, speedPhrase) =>
        `Add ${flourList} and mix on ${speedPhrase} until no dry flour remains.`,
    bodyAddFlourWithDryYeastMachine: (flourList, yeastPhrase, speedPhrase) =>
        `Add ${flourList} mixed with ${yeastPhrase} and mix on ${speedPhrase} until no dry flour remains.`,
    bodyAddFlourWithSwedishYeastMachine: (flourList, yeastPhrase, speedPhrase) =>
        `Mix ${yeastPhrase} into ${flourList} and let stand for about 10 minutes. Add to the bowl and mix on ${speedPhrase} until no dry flour remains.`,
    bodyHydrateDryYeastMachine: (yeastPhrase) =>
        ` In a separate cup, dissolve ${yeastPhrase} in a small amount of warm water, then add it to the mixer bowl.`,
    bodyMachineRest: (duration) =>
        `Stop the mixer, cover, and rest for ${duration}. The flour hydrates and gluten begins to develop passively.`,
    bodyIncorporate: (extras, speedPhrase) =>
        `Add ${extras}. Mix on ${speedPhrase} until fully incorporated.`,
    bodyDevelopMachine: (duration, speedPhrase) =>
        `Increase to ${speedPhrase} and mix for about ${duration}. The dough should start pulling away from the bowl sides, becoming smooth, elastic, and slightly tacky but not loose.`,

    startTimer: 'Start timer',
    editTimer: 'Edit time',
    estimatedTime: 'Estimated time',
    extendTimer: '+5 min',
    pause: 'Pause',
    resume: 'Resume',
    reset: 'Reset',
    finished: 'finished.',
    running: 'Running',
    paused: 'Paused',
    stopped: 'Stopped.',
    bulkPhaseRest: 'Rest',
    bulkPhaseFold1: 'First fold',
    bulkPhaseFold2: 'Second fold',
    bulkPhaseFinal: 'Bulk done',
    phaseLabel: (current, total) => `Phase ${current}/${total}`,
    splashTitle: 'Welcome to Bread Dough Calculator',
    splashSubtitle: 'Everything you need to bake great bread',
    splashFeature1: 'Calculate dough for any number of breads',
    splashFeature2: 'Automatic yeast estimation based on time and temperature',
    splashFeature3: 'Step-by-step instructions with built-in timers',
    splashFeature4: 'Adjustable hydration, salt, sugar, oil & milk',
    splashFeature5: 'Works in English and Swedish',
    splashGetStarted: 'Get started',
    water: 'water',
    flour: 'flour',
    milk: 'milk',
    and: 'and',
    flourBlend: 'Flour blend',
    infoFlourBlend:
        'Build a custom flour blend to automatically adjust hydration. The blend should total 100%. Save blends as presets for quick access.',
    preset: 'Preset',
    loadPreset: 'Load',
    savePreset: 'Save as new',
    updatePreset: 'Update',
    deletePreset: 'Delete',
    newPreset: 'New',
    addFlour: 'Add flour',
    removeFlour: 'Remove',
    flourType: 'Flour type',
    share: 'Share',
    totalPct: 'Total',
    blendMustBe100: 'Flour blend must total 100%.',
    duplicateFlour: 'Duplicate flour type.',
    presetName: 'Preset name',
    presetNotes: 'Notes',
    customAdjustment: 'Custom adjustment',
    builtIn: 'Built-in',
    myPreset: 'My preset',
    baseHydration: 'Base hydration',
    flourAdjustment: 'Flour adjustment',
    presetAdjustment: 'Preset adjustment',
    effectiveHydration: 'Effective hydration',
    hydrationWarning: 'Effective hydration is outside the typical range.',
    flourBlendAbsorptionNote:
        'This flour blend tends to absorb more water than a neutral mix. Dough may feel slightly firm early and relax after resting.',
    hydrationAdjustedNote: (adj) =>
        `Hydration has been adjusted (${adj} pp) to account for the flour blend. If you use different flours, start at the base hydration and adjust to feel.`,
    enterPresetName: 'Enter a preset name.',
    confirmDeletePreset: 'Delete this preset?',
    noPresets: 'No presets yet.',
    cancel: 'Cancel',
    save: 'Save',
    calculator: 'Calculator',
    sessions: 'Bakes',
    loginToViewSessions: 'Sign in to view your saved bakes',
    bakeSaved: 'Bake saved!',
    viewSessions: 'View bakes →',
    switchLanguage: 'Switch language',
    toggleTheme: 'Toggle dark/light mode/system preference',
    scrollToTop: 'Scroll to top',
    decrease: 'Decrease',
    increase: 'Increase',
    markComplete: (title: string) => `Mark ${title} complete`,
    markIncomplete: (title: string) => `Mark ${title} incomplete`,
    validationError: 'Please enter valid values. Salt must be greater than zero.',
    recipeError:
        'These inputs do not produce a valid recipe. Try increasing target weight or reducing starter.',
    recipes: 'Recipes',
    selectRecipe: 'Select a recipe…',
    saveRecipe: 'Save recipe',
    loadRecipe: 'Load',
    deleteRecipe: 'Delete',
    updateRecipe: 'Update',
    recipeName: 'Recipe name',
    enterRecipeName: 'Enter a recipe name.',
    confirmDeleteRecipe: 'Delete this recipe?',
    savedRecipes: 'Saved recipes',
    noSavedRecipes: 'No saved recipes yet.',
    recipeNeapolitanPizza: 'Neapolitan Pizza',
    recipeEverydayBread: 'Everyday Bread',
    recipeSaved: 'Recipe saved.',
    recipeLoaded: 'Recipe loaded.',

    // Auth
    loginWithGoogle: 'Sign in with Google',
    logout: 'Sign out',
    loggedInAs: 'Signed in as',

    // Saved bakes
    myBakes: 'My bakes',
    saveBakeTitle: 'Save bake',
    saveThisBake: 'Save this bake',
    bakingNotes: 'Notes',
    bakeTitle: 'Title',
    bakingRating: 'Rating',
    bakedOn: 'Baked on',
    noBakes: 'No saved bakes yet.',
    confirmDeleteBake: 'Delete this bake?',
    uploadPhoto: 'Upload photo',
    deletePhoto: 'Delete photo',
    maxPhotos: 'Maximum 3 photos per bake.',
    viewBake: 'View bake',
    showRecipe: 'Show recipe',
    hideRecipe: 'Hide recipe',
    adjustValues: 'Adjust values',
    addPhotos: 'Add photos',
    pendingPhotos: 'photos selected',
    noPhotos: 'No photos yet',
    photoOf: (current, total) => `${current} of ${total}`,

    // Compare
    compareBakes: 'Compare bakes',
    selectBakeA: 'Bake A',
    selectBakeB: 'Bake B',
    difference: 'Difference',
    noChange: 'No change',
    higher: 'higher',
    lower: 'lower',
    yeastIngredient: 'Yeast',
    milkIngredient: 'Milk',
    sugarAmount: 'Sugar',
    oilAmount: 'Oil',
    deleteBake: 'Delete bake',
    bakeAgain: 'Bake this again',
    editBake: 'Edit',
    shareBake: 'Share bake',
    stopSharing: 'Stop sharing',
    linkCopied: 'Link copied!',
    sharedByUser: (name: string) => `Shared by ${name}`,
    bakeNotFound: 'This bake is not available.',
    noBakesYet: 'No saved bakes yet.',
    compareNeedTwo: 'Save at least two bakes to compare them.',

    // Sync
    uploadLocalRecipesTitle: 'Upload local recipes?',
    uploadLocalRecipesBody: (count: number) =>
        `You have ${count} recipe(s) saved on this device. Would you like to upload them to your account?`,
    uploadButton: 'Upload',
    keepLocalButton: 'Keep local',
    uploadToCloud: 'Upload to cloud',
};

const sv: Translations = {
    appTitle: 'Degkalkylator',
    dough: 'Deg',
    yeast: 'Jäst',
    percentages: 'Procent',
    starter: 'Surdeg',
    proofing: 'Jäsning',
    results: 'Recept',
    instructions: 'Instruktioner',
    copyRecipe: 'Kopiera recept',
    copyInstructions: 'Kopiera instruktioner',
    copied: 'Kopierat!',
    numberOfBreads: 'Antal bröd',
    ballWeight: 'Bollvikt (g)',
    hintBallWeight:
        'Frallor: 80–100 g · Baguette: 350–400 g · Formfranska: 500–900 g · Surdegsbröd: 700–1000 g · Pizza: 200–280 g',
    yeastType: 'Jästtyp',
    freshYeast: 'Färsk jäst',
    swedishDryYeast: 'Torrjäst (KronJäst)',
    activeDryYeast: 'Aktiv torrjäst',
    instantYeast: 'Snabbjäst',
    yeastRecommendationPending: 'Beräknad jäst visas efter beräkning.',
    yeastHelpFresh: 'Smula ner i vätskan och rör tills den lösts upp.',
    yeastHelpSwedishDry:
        'Blanda i mjölet först, låt stå ca 10 minuter, tillsätt sedan fingervarmt vatten.',
    yeastHelpActiveDry: 'Lös upp i varmt vatten först, blanda sedan med mjölet.',
    yeastHelpInstant: 'Blanda direkt i mjölet innan du tillsätter vätska.',
    advancedSettings: 'Avancerade inställningar',
    hydration: 'Hydrering',
    hintHydration: 'Typiskt: 60–80%',
    salt: 'Salt',
    hintSalt: 'Typiskt: 1,8–2,2%',
    sugar: 'Socker',
    hintSugar: 'Valfritt, 0–5%',
    oil: 'Olja',
    hintOil: 'Valfritt, 0–5%',
    milkAsPctOfWater: 'Mjölk som % av tillsatt vatten',
    hintMilk: 'Valfritt, 0–50%',
    starterTotalWeight: 'Surdeg totalvikt (g)',
    hintStarter: (minG, maxG) => `Typiskt: ${minG}–${maxG} g (10–30% av mjölet)`,
    starterHydration: 'Surdeg hydrering (%)',
    hintStarterHydration: 'Typiskt: 80–125%',
    timeUntilOven: 'Tid till ugnen (timmar)',
    roomTemperature: 'Rumstemperatur (\u00b0C)',
    calculate: 'Beräkna',
    infoDough:
        'Ange antal bröd och målvikt per boll. Slutvikten per boll är ungefärlig eftersom den slutliga degvikten beror på avrundning.',
    infoYeast:
        'Välj jästtyp. Kalkylatorn uppskattar mängden utifrån total tid till ugnen, rumstemperatur, mängd surdeg och surdegens hydrering.',
    infoPercentages:
        'Hydrering är total vätska delat med totalt mjöl, inklusive mjölet och vattnet i surdegen. Salt krävs. Socker och olja är valfria. Mjölk ersätter en del av det tillsatta vattnet.',
    infoStarter:
        'Surdegens totalvikt är hela mängden surdeg i gram. Surdegens hydrering är förhållandet vatten-till-mjöl i surdegen. Till exempel, 100% hydrering innebär lika delar vatten och mjöl i vikt.',
    infoProofing:
        'Ange den totala tiden tills degen ska in i ugnen och rumstemperaturen. Kalkylatorn delar upp detta i blandning, bulkjäsning, formning, slutjäsning och förvärmning.',
    totalDoughWeight: 'Total degvikt',
    actualPerBall: 'Faktisk per boll',
    starterFlourShare: 'Förjäst mjöl',
    waterTemperature: 'Vattentemperatur',
    ingredients: 'Ingredienser',
    flourToAdd: 'Mjöl att tillsätta',
    waterToAdd: 'Vatten att tillsätta',
    milkToAdd: 'Mjölk att tillsätta',
    saltIngredient: 'Salt',
    sugarIngredient: 'Socker',
    oilIngredient: 'Olja',
    supportStarterCalc: (hydPct: number, flourG: number, waterG: number) =>
        `Surdegen beräknas med ${hydPct}% hydrering, vilket innebär ungefär ${flourG} g mjöl och ${waterG} g vatten i surdegen.`,
    supportYeastEstimated: (label: string, hoursStr: string, tempStr: string) =>
        `${label} uppskattas utifrån ${hoursStr} h, ${tempStr}\u00b0C, total mängd surdeg och surdegens hydrering.`,
    supportHeuristic: 'Detta är en praktisk bakheuristik, inte en exakt jäsningsmodell.',
    stepMix: 'Blanda',
    stepBulk: 'Bulkjäsning',
    stepDivide: 'Dela och förforma',
    stepBenchRest: 'Bänkvila',
    stepFinalShape: 'Slutformning',
    stepFinalProof: 'Slutjäsning',
    stepPreheat: 'Förvärm ugnen',
    stepBake: 'Grädda',

    // Manual mixing steps
    stepMixLiquids: 'Blanda vätskor',
    stepAddFlour: 'Tillsätt mjöl',
    stepRest: 'Vila',
    stepAddSaltEtc: 'Tillsätt salt & tillbehör',
    stepDevelopByHand: 'Bearbeta för hand',

    // Machine mixing steps
    stepInitialMix: 'Grundblandning',
    stepMachineRest: 'Vila',
    stepIncorporate: 'Tillsätt salt & tillbehör',
    stepDevelopMachine: 'Bearbeta i maskin',

    // Mixing method
    mixingMethod: 'Blandningsmetod',
    manual: 'För hand',
    machine: 'Köksmaskin',
    mixerSpeedLow: 'Låg hastighet',
    mixerSpeedLowMedium: 'Låg till medelhastighet',
    mixerSpeedMedium: 'Medelhastighet',
    yourMixer: 'din maskin',

    bodyMix: (starterG, waterG, milkPart, yeastPart, flourG, saltG, sugarPart, oilPart) =>
        `Blanda ${starterG} g surdeg, ${waterG} g vatten${milkPart}${yeastPart}. Tillsätt ${flourG} g mjöl och blanda tills inget torrt mjöl finns kvar. Vila ca 20 minuter, tillsätt sedan ${saltG} g salt${sugarPart}${oilPart}. Blanda tills degen är slät, elastisk och lite kladdig.`,
    bodyBulk: (temp, duration, fold1, fold2) =>
        `Jäs vid ca ${temp}\u00b0C i ungefär ${duration}. Gör en vikning vid ungefär ${fold1} och en till vid ungefär ${fold2}. Degen ska kännas lättare och puffigare i slutet.`,
    bodyDivide: (count, weight) => `Dela i ${count} bitar om ca ${weight} g. Förforma försiktigt.`,
    bodyBenchRest: (duration) =>
        `Vila övertäckt i ${duration} så degen slappnar av före slutformning.`,
    bodyFinalShape:
        'Forma till rundstycken eller rustika rutor. Bygg tillräckligt med ytspänning för höjd utan att trycka ut för mycket gas.',
    bodyFinalProof: (temp, duration) =>
        `Jäs vid ca ${temp}\u00b0C i ungefär ${duration}. Ett fingeravtryck ska fjädra tillbaka långsamt, inte direkt.`,
    bodyPreheat: (duration, tempLow, tempHigh) =>
        `Förvärm till ${tempLow}\u2013${tempHigh}\u00b0C under de sista ${duration} av slutjäsningen.`,
    bodyBake: (duration) =>
        `Grädda med ånga om möjligt. Börja på hög temperatur och sänk vid behov. Grädda ca ${duration} tills gyllenbruna och fasta.`,
    ovenTempGuide:
        'Högre temp (240\u00b0C+) ger krispigare skorpa och snabbare bryning. Lägre temp (200\u2013210\u00b0C) ger mjukare skorpa och jämnare gräddning. Större bröd behöver lägre temp och längre tid.',

    // Manual instruction body templates
    bodyMixLiquids: (ingredientList) =>
        `Blanda ${ingredientList} i en skål. Rör tills allt är upplöst.`,
    bodyDisperseStarter: (ingredientList) =>
        `Blanda ${ingredientList} i en skål. Rör tills surdegen är upplöst och jämnt fördelad.`,
    bodyAddFlour: (ingredientList) =>
        `Tillsätt ${ingredientList} och blanda för hand tills inget torrt mjöl finns kvar. Knåda inte ännu.`,
    bodyAddFlourWithDryYeast: (flourList, yeastPhrase) =>
        `Blanda ${yeastPhrase} i ${flourList}, häll sedan i skålen och blanda för hand tills inget torrt mjöl finns kvar. Knåda inte ännu.`,
    bodyAddFlourWithSwedishYeast: (flourList, yeastPhrase) =>
        `Blanda ${yeastPhrase} i ${flourList} och låt stå i ca 10 minuter. Blanda sedan med surdegsblandningen för hand tills inget torrt mjöl finns kvar.`,
    bodyHydrateDryYeast: (yeastPhrase) =>
        ` Lös upp ${yeastPhrase} i lite varmt vatten i en separat kopp och tillsätt sedan till skålen.`,
    bodyRest: (duration) =>
        `Täck och vila i ${duration}. Mjölet absorberar vattnet och glutenet börjar bildas.`,
    bodyAddSaltEtc: (extras) => `Tillsätt ${extras} i degen. Nyp och vik tills allt är inarbetat.`,
    bodyDevelopByHand: (duration) =>
        `Knåda eller arbeta degen med sträck-och-vik i ca ${duration} tills den är slät, elastisk och lite kladdig.`,

    // Machine instruction body templates
    bodyInitialMix: (liquidsList, flourList, speedPhrase) =>
        `Lägg ${liquidsList} i maskinens skål. Tillsätt ${flourList} och kör på ${speedPhrase} tills inget torrt mjöl finns kvar.`,
    bodyDisperseStarterMachine: (ingredientList, speedPhrase) =>
        `Lägg ${ingredientList} i maskinens skål. Kör kort på ${speedPhrase} tills surdegen är upplöst och jämnt fördelad.`,
    bodyAddFlourMachine: (flourList, speedPhrase) =>
        `Tillsätt ${flourList} och kör på ${speedPhrase} tills inget torrt mjöl finns kvar.`,
    bodyAddFlourWithDryYeastMachine: (flourList, yeastPhrase, speedPhrase) =>
        `Tillsätt ${flourList} blandat med ${yeastPhrase} och kör på ${speedPhrase} tills inget torrt mjöl finns kvar.`,
    bodyAddFlourWithSwedishYeastMachine: (flourList, yeastPhrase, speedPhrase) =>
        `Blanda ${yeastPhrase} i ${flourList} och låt stå i ca 10 minuter. Lägg i skålen och kör på ${speedPhrase} tills inget torrt mjöl finns kvar.`,
    bodyHydrateDryYeastMachine: (yeastPhrase) =>
        ` Lös upp ${yeastPhrase} i lite varmt vatten i en separat kopp och tillsätt sedan i maskinens skål.`,
    bodyMachineRest: (duration) =>
        `Stoppa maskinen, täck och vila i ${duration}. Mjölet hydreras och glutenet börjar utvecklas.`,
    bodyIncorporate: (extras, speedPhrase) =>
        `Tillsätt ${extras}. Kör på ${speedPhrase} tills allt är inarbetat.`,
    bodyDevelopMachine: (duration, speedPhrase) =>
        `Öka till ${speedPhrase} och kör i ungefär ${duration}. Degen ska börja släppa från skålens kanter, kännas slät, elastisk och lätt klibbig men inte lös.`,

    startTimer: 'Starta timer',
    editTimer: 'Ändra tid',
    estimatedTime: 'Uppskattad tid',
    extendTimer: '+5 min',
    pause: 'Pausa',
    resume: 'Fortsätt',
    reset: 'Återställ',
    finished: 'klar.',
    running: 'Pågår',
    paused: 'Pausad',
    stopped: 'Stoppad.',
    bulkPhaseRest: 'Vila',
    bulkPhaseFold1: 'Första vikningen',
    bulkPhaseFold2: 'Andra vikningen',
    bulkPhaseFinal: 'Bulkjäsning klar',
    phaseLabel: (current, total) => `Fas ${current}/${total}`,
    splashTitle: 'Välkommen till Degkalkylatorn',
    splashSubtitle: 'Allt du behöver för att baka fantastiskt bröd',
    splashFeature1: 'Beräkna deg för valfritt antal bröd',
    splashFeature2: 'Automatisk jästuppskattning baserad på tid och temperatur',
    splashFeature3: 'Steg-för-steg instruktioner med inbyggda timers',
    splashFeature4: 'Justerbar hydrering, salt, socker, olja & mjölk',
    splashFeature5: 'Fungerar på engelska och svenska',
    splashGetStarted: 'Kom igång',
    water: 'vatten',
    flour: 'mjöl',
    milk: 'mjölk',
    and: 'och',
    flourBlend: 'Mjölblandning',
    infoFlourBlend:
        'Skapa en egen mjölblandning för att automatiskt justera hydreringen. Blandningen ska bli 100%. Spara blandningar som förinställningar.',
    preset: 'Förinställning',
    loadPreset: 'Ladda',
    savePreset: 'Spara som ny',
    updatePreset: 'Uppdatera',
    deletePreset: 'Ta bort',
    newPreset: 'Ny',
    addFlour: 'Lägg till mjöl',
    removeFlour: 'Ta bort',
    flourType: 'Mjöltyp',
    share: 'Andel',
    totalPct: 'Totalt',
    blendMustBe100: 'Mjölblandningen måste bli 100%.',
    duplicateFlour: 'Dubblett av mjöltyp.',
    presetName: 'Namn',
    presetNotes: 'Anteckningar',
    customAdjustment: 'Egen justering',
    builtIn: 'Inbyggd',
    myPreset: 'Min förinställning',
    baseHydration: 'Bashydrering',
    flourAdjustment: 'Mjöljustering',
    presetAdjustment: 'Förinställningsjustering',
    effectiveHydration: 'Effektiv hydrering',
    hydrationWarning: 'Effektiv hydrering är utanför normalt intervall.',
    flourBlendAbsorptionNote:
        'Denna mjölblandning tenderar att absorbera mer vatten än en neutral blandning. Degen kan kännas lite fast tidigt och slappna av efter vila.',
    hydrationAdjustedNote: (adj) =>
        `Hydreringen har justerats (${adj} pp) utifrån mjölblandningen. Om du använder andra mjölsorter, börja med bashydreringen och justera efter känsla.`,
    enterPresetName: 'Ange ett förinställningsnamn.',
    confirmDeletePreset: 'Ta bort denna förinställning?',
    noPresets: 'Inga förinställningar ännu.',
    cancel: 'Avbryt',
    save: 'Spara',
    calculator: 'Kalkylator',
    sessions: 'Bakningar',
    loginToViewSessions: 'Logga in för att se dina bakningar',
    bakeSaved: 'Bakningen sparad!',
    viewSessions: 'Visa bakningar →',
    switchLanguage: 'Byt språk',
    toggleTheme: 'Växla mörkt/ljust läge/systeminställning',
    scrollToTop: 'Scrolla upp',
    decrease: 'Minska',
    increase: 'Öka',
    markComplete: (title: string) => `Markera ${title} som klar`,
    markIncomplete: (title: string) => `Markera ${title} som ej klar`,
    validationError: 'Ange giltiga värden. Salt måste vara större än noll.',
    recipeError:
        'Dessa värden ger inget giltigt recept. Prova att öka målvikten eller minska surdegen.',
    recipes: 'Recept',
    selectRecipe: 'Välj ett recept…',
    saveRecipe: 'Spara recept',
    loadRecipe: 'Ladda',
    deleteRecipe: 'Ta bort',
    updateRecipe: 'Uppdatera',
    recipeName: 'Receptnamn',
    enterRecipeName: 'Ange ett receptnamn.',
    confirmDeleteRecipe: 'Ta bort detta recept?',
    savedRecipes: 'Sparade recept',
    noSavedRecipes: 'Inga sparade recept ännu.',
    recipeNeapolitanPizza: 'Napolitansk pizza',
    recipeEverydayBread: 'Vardagsbröd',
    recipeSaved: 'Recept sparat.',
    recipeLoaded: 'Recept laddat.',

    // Auth
    loginWithGoogle: 'Logga in med Google',
    logout: 'Logga ut',
    loggedInAs: 'Inloggad som',

    // Saved bakes
    myBakes: 'Mina bakningar',
    saveBakeTitle: 'Spara bakning',
    saveThisBake: 'Spara denna bakning',
    bakingNotes: 'Anteckningar',
    bakeTitle: 'Titel',
    bakingRating: 'Betyg',
    bakedOn: 'Bakad den',
    noBakes: 'Inga bakningar ännu.',
    confirmDeleteBake: 'Ta bort denna bakning?',
    uploadPhoto: 'Ladda upp bild',
    deletePhoto: 'Ta bort bild',
    maxPhotos: 'Maximalt 3 bilder per bakning.',
    viewBake: 'Visa bakning',
    showRecipe: 'Visa recept',
    hideRecipe: 'Dölj recept',
    adjustValues: 'Justera värden',
    addPhotos: 'Lägg till bilder',
    pendingPhotos: 'bilder valda',
    noPhotos: 'Inga bilder ännu',
    photoOf: (current, total) => `${current} av ${total}`,

    // Compare
    compareBakes: 'Jämför bakningar',
    selectBakeA: 'Bakning A',
    selectBakeB: 'Bakning B',
    difference: 'Skillnad',
    noChange: 'Ingen skillnad',
    higher: 'högre',
    lower: 'lägre',
    yeastIngredient: 'Jäst',
    milkIngredient: 'Mjölk',
    sugarAmount: 'Socker',
    oilAmount: 'Olja',
    deleteBake: 'Ta bort bakning',
    bakeAgain: 'Baka denna igen',
    editBake: 'Redigera',
    shareBake: 'Dela bakning',
    stopSharing: 'Sluta dela',
    linkCopied: 'L\u00e4nk kopierad!',
    sharedByUser: (name: string) => `Delad av ${name}`,
    bakeNotFound: 'Denna bakning \u00e4r inte tillg\u00e4nglig.',
    noBakesYet: 'Inga bakningar ännu.',
    compareNeedTwo: 'Spara minst två bakningar för att kunna jämföra.',

    // Sync
    uploadLocalRecipesTitle: 'Ladda upp lokala recept?',
    uploadLocalRecipesBody: (count: number) =>
        `Du har ${count} recept sparade på den här enheten. Vill du ladda upp dem till ditt konto?`,
    uploadButton: 'Ladda upp',
    keepLocalButton: 'Behåll lokalt',
    uploadToCloud: 'Ladda upp till molnet',
};

const translations: Record<Lang, Translations> = { en, sv };

@Injectable({ providedIn: 'root' })
export class I18nService {
    private readonly lang = signal<Lang>(this.loadLang());

    readonly currentLang = this.lang.asReadonly();
    readonly t = computed(() => translations[this.lang()]);

    private loadLang(): Lang {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved === 'sv' || saved === 'en') return saved;
        } catch {
            /* noop */
        }
        try {
            const browserLang = navigator.language || navigator.languages?.[0] || '';
            if (browserLang.startsWith('sv')) return 'sv';
        } catch {
            /* noop */
        }
        return 'en';
    }

    setLang(lang: Lang): void {
        this.lang.set(lang);
        try {
            localStorage.setItem(STORAGE_KEY, lang);
        } catch {
            /* noop */
        }
    }

    toggleLang(): void {
        this.setLang(this.lang() === 'en' ? 'sv' : 'en');
    }
}
