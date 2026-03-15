import { Injectable, signal, computed } from "@angular/core";

export type Lang = "en" | "sv";

const STORAGE_KEY = "breadCalcLang";

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

  // Dough fields
  numberOfBreads: string;
  ballWeight: string;

  // Yeast fields
  yeastType: string;
  freshYeast: string;
  activeDryYeast: string;
  instantYeast: string;
  yeastRecommendationPending: string;

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
  starterHydration: string;

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
  supportStarterCalc: (
    hydPct: number,
    flourG: number,
    waterG: number,
  ) => string;
  supportYeastEstimated: (
    label: string,
    hoursStr: string,
    tempStr: string,
  ) => string;
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
  bodyBulk: (
    temp: number,
    duration: string,
    fold1: string,
    fold2: string,
  ) => string;
  bodyDivide: (count: number, weight: number) => string;
  bodyBenchRest: (duration: string) => string;
  bodyFinalShape: string;
  bodyFinalProof: (temp: number, duration: string) => string;
  bodyPreheat: (duration: string) => string;
  bodyBake: (duration: string) => string;
  // Timer
  startTimer: string;
  pause: string;
  resume: string;
  reset: string;
  finished: string;
  running: string;
  paused: string;
  stopped: string;

  // Short words / connectors
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
  enterPresetName: string;
  confirmDeletePreset: string;
  noPresets: string;
  cancel: string;
  save: string;

  // Aria-labels
  switchLanguage: string;
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
}

const en: Translations = {
  appTitle: "Bread Dough Calculator",
  dough: "Dough",
  yeast: "Yeast",
  percentages: "Percentages",
  starter: "Starter",
  proofing: "Proofing",
  results: "Results",
  instructions: "Instructions",
  numberOfBreads: "Number of breads",
  ballWeight: "Ball weight (g)",
  yeastType: "Yeast type",
  freshYeast: "Fresh yeast",
  activeDryYeast: "Active dry yeast",
  instantYeast: "Instant yeast",
  yeastRecommendationPending: "Estimated yeast will appear after calculate.",
  advancedSettings: "Advanced settings",
  hydration: "Hydration",
  hintHydration: "Typical: 60–80%",
  salt: "Salt",
  hintSalt: "Typical: 1.8–2.2%",
  sugar: "Sugar",
  hintSugar: "Optional, 0–5%",
  oil: "Oil",
  hintOil: "Optional, 0–5%",
  milkAsPctOfWater: "Milk as % of added water",
  hintMilk: "Optional, 0–50%",
  starterTotalWeight: "Starter total weight (g)",
  starterHydration: "Starter hydration (%)",
  timeUntilOven: "Time until oven (hours)",
  roomTemperature: "Room temperature (\u00b0C)",
  calculate: "Calculate",
  infoDough:
    "Enter how many breads you want and the target weight per ball. Final weight per ball is approximate because the final dough weight depends on rounding.",
  infoYeast:
    "Choose the yeast type. The calculator estimates the amount from total time until oven, room temperature, starter amount, and starter hydration.",
  infoPercentages:
    "Hydration is total liquid divided by total flour, including the flour and water inside the starter. Salt is required. Sugar and oil are optional. Milk replaces part of the added water.",
  infoStarter:
    "Starter total weight is the full starter amount in grams. Starter hydration is the water-to-flour ratio inside the starter. For example, 100% hydration means equal parts water and flour by weight.",
  infoProofing:
    "Enter the total time until the dough should go into the oven and the room temperature. The calculator splits this into mixing, bulk fermentation, shaping, final proof, and preheating.",
  totalDoughWeight: "Total dough weight",
  actualPerBall: "Actual per ball",
  starterFlourShare: "Pre-fermented flour",
  waterTemperature: "Water temperature",
  ingredients: "Ingredients",
  flourToAdd: "Flour to add",
  waterToAdd: "Water to add",
  milkToAdd: "Milk to add",
  saltIngredient: "Salt",
  sugarIngredient: "Sugar",
  oilIngredient: "Oil",
  supportStarterCalc: (hydPct: number, flourG: number, waterG: number) =>
    `Starter is calculated at ${hydPct}% hydration, which means roughly ${flourG} g flour and ${waterG} g water inside the starter.`,
  supportYeastEstimated: (label: string, hoursStr: string, tempStr: string) =>
    `${label} is estimated from ${hoursStr} h, ${tempStr}\u00b0C, total starter amount, and starter hydration.`,
  supportHeuristic:
    "This is a practical baking heuristic, not an exact fermentation model.",
  stepMix: "1. Mix",
  stepBulk: "2. Bulk fermentation",
  stepDivide: "3. Divide and pre-shape",
  stepBenchRest: "4. Bench rest",
  stepFinalShape: "5. Final shape",
  stepFinalProof: "6. Final proof",
  stepPreheat: "7. Preheat oven",
  stepBake: "8. Bake",
  bodyMix: (
    starterG,
    waterG,
    milkPart,
    yeastPart,
    flourG,
    saltG,
    sugarPart,
    oilPart,
  ) =>
    `Mix ${starterG} g starter, ${waterG} g water${milkPart}${yeastPart}. Add ${flourG} g flour and mix until no dry flour remains. Rest about 20 minutes, then add ${saltG} g salt${sugarPart}${oilPart}. Mix until smooth, elastic, and slightly tacky.`,
  bodyBulk: (temp, duration, fold1, fold2) =>
    `Ferment around ${temp}\u00b0C for about ${duration}. Give one fold at about ${fold1} and another at about ${fold2}. Dough should feel lighter and puffier by the end.`,
  bodyDivide: (count, weight) =>
    `Divide into ${count} pieces. Actual dough weight per piece is about ${weight} g. Pre-shape gently.`,
  bodyBenchRest: (duration) =>
    `Rest covered for ${duration} so the dough relaxes before final shaping.`,
  bodyFinalShape:
    "Shape into rolls or rustic squares. Build enough surface tension for height without squeezing out too much gas.",
  bodyFinalProof: (temp, duration) =>
    `Proof at about ${temp}\u00b0C for around ${duration}. A fingertip dent should spring back slowly, not immediately.`,
  bodyPreheat: (duration) =>
    `Preheat during the last ${duration} of final proof. For rolls, 230\u2013240\u00b0C is a strong starting point.`,
  bodyBake: (duration) =>
    `Bake with steam if possible. Start hot, then reduce slightly if needed. Bake about ${duration} until golden and set.`,
  startTimer: "Start timer",
  pause: "Pause",
  resume: "Resume",
  reset: "Reset",
  finished: "finished.",
  running: "Running",
  paused: "Paused",
  stopped: "Stopped.",
  splashTitle: "Welcome to Bread Dough Calculator",
  splashSubtitle: "Everything you need to bake great bread",
  splashFeature1: "Calculate dough for any number of breads",
  splashFeature2: "Automatic yeast estimation based on time and temperature",
  splashFeature3: "Step-by-step instructions with built-in timers",
  splashFeature4: "Adjustable hydration, salt, sugar, oil & milk",
  splashFeature5: "Works in English and Swedish",
  splashGetStarted: "Get started",
  milk: "milk",
  and: "and",
  flourBlend: "Flour blend",
  infoFlourBlend:
    "Build a custom flour blend to automatically adjust hydration. The blend should total 100%. Save blends as presets for quick access.",
  preset: "Preset",
  loadPreset: "Load",
  savePreset: "Save as new",
  updatePreset: "Update",
  deletePreset: "Delete",
  newPreset: "New",
  addFlour: "Add flour",
  removeFlour: "Remove",
  flourType: "Flour type",
  share: "Share",
  totalPct: "Total",
  blendMustBe100: "Flour blend must total 100%.",
  duplicateFlour: "Duplicate flour type.",
  presetName: "Preset name",
  presetNotes: "Notes",
  customAdjustment: "Custom adjustment",
  builtIn: "Built-in",
  myPreset: "My preset",
  baseHydration: "Base hydration",
  flourAdjustment: "Flour adjustment",
  presetAdjustment: "Preset adjustment",
  effectiveHydration: "Effective hydration",
  hydrationWarning: "Effective hydration is outside the typical range.",
  flourBlendAbsorptionNote:
    "This flour blend tends to absorb more water than a neutral mix. Dough may feel slightly firm early and relax after resting.",
  enterPresetName: "Enter a preset name.",
  confirmDeletePreset: "Delete this preset?",
  noPresets: "No presets yet.",
  cancel: "Cancel",
  save: "Save",
  switchLanguage: "Switch language",
  scrollToTop: "Scroll to top",
  decrease: "Decrease",
  increase: "Increase",
  markComplete: (title: string) => `Mark ${title} complete`,
  markIncomplete: (title: string) => `Mark ${title} incomplete`,
  validationError: "Please enter valid values. Salt must be greater than zero.",
  recipeError:
    "These inputs do not produce a valid recipe. Try increasing target weight or reducing starter.",
  recipes: "Recipes",
  saveRecipe: "Save recipe",
  loadRecipe: "Load",
  deleteRecipe: "Delete",
  updateRecipe: "Update",
  recipeName: "Recipe name",
  enterRecipeName: "Enter a recipe name.",
  confirmDeleteRecipe: "Delete this recipe?",
  savedRecipes: "Saved recipes",
  noSavedRecipes: "No saved recipes yet.",
  recipeNeapolitanPizza: "Neapolitan Pizza",
  recipeEverydayBread: "Everyday Bread",
  recipeSaved: "Recipe saved.",
  recipeLoaded: "Recipe loaded.",
};

const sv: Translations = {
  appTitle: "Degkalkylator",
  dough: "Deg",
  yeast: "Jäst",
  percentages: "Procent",
  starter: "Surdeg",
  proofing: "Jäsning",
  results: "Resultat",
  instructions: "Instruktioner",
  numberOfBreads: "Antal bröd",
  ballWeight: "Bollvikt (g)",
  yeastType: "Jästtyp",
  freshYeast: "Färsk jäst",
  activeDryYeast: "Aktiv torrjäst",
  instantYeast: "Snabbjäst",
  yeastRecommendationPending: "Beräknad jäst visas efter beräkning.",
  advancedSettings: "Avancerade inställningar",
  hydration: "Hydrering",
  hintHydration: "Typiskt: 60–80%",
  salt: "Salt",
  hintSalt: "Typiskt: 1,8–2,2%",
  sugar: "Socker",
  hintSugar: "Valfritt, 0–5%",
  oil: "Olja",
  hintOil: "Valfritt, 0–5%",
  milkAsPctOfWater: "Mjölk som % av tillsatt vatten",
  hintMilk: "Valfritt, 0–50%",
  starterTotalWeight: "Surdeg totalvikt (g)",
  starterHydration: "Surdeg hydrering (%)",
  timeUntilOven: "Tid till ugnen (timmar)",
  roomTemperature: "Rumstemperatur (\u00b0C)",
  calculate: "Beräkna",
  infoDough:
    "Ange antal bröd och målvikt per boll. Slutvikten per boll är ungefärlig eftersom den slutliga degvikten beror på avrundning.",
  infoYeast:
    "Välj jästtyp. Kalkylatorn uppskattar mängden utifrån total tid till ugnen, rumstemperatur, mängd surdeg och surdegens hydrering.",
  infoPercentages:
    "Hydrering är total vätska delat med totalt mjöl, inklusive mjölet och vattnet i surdegen. Salt krävs. Socker och olja är valfria. Mjölk ersätter en del av det tillsatta vattnet.",
  infoStarter:
    "Surdegens totalvikt är hela mängden surdeg i gram. Surdegens hydrering är förhållandet vatten-till-mjöl i surdegen. Till exempel, 100% hydrering innebär lika delar vatten och mjöl i vikt.",
  infoProofing:
    "Ange den totala tiden tills degen ska in i ugnen och rumstemperaturen. Kalkylatorn delar upp detta i blandning, bulkjäsning, formning, slutjäsning och förvärmning.",
  totalDoughWeight: "Total degvikt",
  actualPerBall: "Faktisk per boll",
  starterFlourShare: "Förjäst mjöl",
  waterTemperature: "Vattentemperatur",
  ingredients: "Ingredienser",
  flourToAdd: "Mjöl att tillsätta",
  waterToAdd: "Vatten att tillsätta",
  milkToAdd: "Mjölk att tillsätta",
  saltIngredient: "Salt",
  sugarIngredient: "Socker",
  oilIngredient: "Olja",
  supportStarterCalc: (hydPct: number, flourG: number, waterG: number) =>
    `Surdegen beräknas med ${hydPct}% hydrering, vilket innebär ungefär ${flourG} g mjöl och ${waterG} g vatten i surdegen.`,
  supportYeastEstimated: (label: string, hoursStr: string, tempStr: string) =>
    `${label} uppskattas utifrån ${hoursStr} h, ${tempStr}\u00b0C, total mängd surdeg och surdegens hydrering.`,
  supportHeuristic:
    "Detta är en praktisk bakheuristik, inte en exakt jäsningsmodell.",
  stepMix: "1. Blanda",
  stepBulk: "2. Bulkjäsning",
  stepDivide: "3. Dela och förforma",
  stepBenchRest: "4. Bänkvila",
  stepFinalShape: "5. Slutformning",
  stepFinalProof: "6. Slutjäsning",
  stepPreheat: "7. Förvärm ugnen",
  stepBake: "8. Grädda",
  bodyMix: (
    starterG,
    waterG,
    milkPart,
    yeastPart,
    flourG,
    saltG,
    sugarPart,
    oilPart,
  ) =>
    `Blanda ${starterG} g surdeg, ${waterG} g vatten${milkPart}${yeastPart}. Tillsätt ${flourG} g mjöl och blanda tills inget torrt mjöl finns kvar. Vila ca 20 minuter, tillsätt sedan ${saltG} g salt${sugarPart}${oilPart}. Blanda tills degen är slät, elastisk och lite kladdig.`,
  bodyBulk: (temp, duration, fold1, fold2) =>
    `Jäs vid ca ${temp}\u00b0C i ungefär ${duration}. Gör en vikning vid ungefär ${fold1} och en till vid ungefär ${fold2}. Degen ska kännas lättare och puffigare i slutet.`,
  bodyDivide: (count, weight) =>
    `Dela i ${count} bitar. Faktisk degvikt per bit är ca ${weight} g. Förforma försiktigt.`,
  bodyBenchRest: (duration) =>
    `Vila övertäckt i ${duration} så degen slappnar av före slutformning.`,
  bodyFinalShape:
    "Forma till rundstycken eller rustika rutor. Bygg tillräckligt med ytspänning för höjd utan att trycka ut för mycket gas.",
  bodyFinalProof: (temp, duration) =>
    `Jäs vid ca ${temp}\u00b0C i ungefär ${duration}. Ett fingeravtryck ska fjädra tillbaka långsamt, inte direkt.`,
  bodyPreheat: (duration) =>
    `Förvärm under de sista ${duration} av slutjäsningen. För rundstycken, 230\u2013240\u00b0C är en bra startpunkt.`,
  bodyBake: (duration) =>
    `Grädda med ånga om möjligt. Starta varmt, sänk sedan om det behövs. Grädda ca ${duration} tills gyllenbruna och fasta.`,
  startTimer: "Starta timer",
  pause: "Pausa",
  resume: "Fortsätt",
  reset: "Återställ",
  finished: "klar.",
  running: "Pågår",
  paused: "Pausad",
  stopped: "Stoppad.",
  splashTitle: "Välkommen till Degkalkylatorn",
  splashSubtitle: "Allt du behöver för att baka fantastiskt bröd",
  splashFeature1: "Beräkna deg för valfritt antal bröd",
  splashFeature2: "Automatisk jästuppskattning baserad på tid och temperatur",
  splashFeature3: "Steg-för-steg instruktioner med inbyggda timers",
  splashFeature4: "Justerbar hydrering, salt, socker, olja & mjölk",
  splashFeature5: "Fungerar på engelska och svenska",
  splashGetStarted: "Kom igång",
  milk: "mjölk",
  and: "och",
  flourBlend: "Mjölblandning",
  infoFlourBlend:
    "Skapa en egen mjölblandning för att automatiskt justera hydreringen. Blandningen ska bli 100%. Spara blandningar som förinställningar.",
  preset: "Förinställning",
  loadPreset: "Ladda",
  savePreset: "Spara som ny",
  updatePreset: "Uppdatera",
  deletePreset: "Ta bort",
  newPreset: "Ny",
  addFlour: "Lägg till mjöl",
  removeFlour: "Ta bort",
  flourType: "Mjöltyp",
  share: "Andel",
  totalPct: "Totalt",
  blendMustBe100: "Mjölblandningen måste bli 100%.",
  duplicateFlour: "Dubblett av mjöltyp.",
  presetName: "Namn",
  presetNotes: "Anteckningar",
  customAdjustment: "Egen justering",
  builtIn: "Inbyggd",
  myPreset: "Min förinställning",
  baseHydration: "Bashydrering",
  flourAdjustment: "Mjöljustering",
  presetAdjustment: "Förinställningsjustering",
  effectiveHydration: "Effektiv hydrering",
  hydrationWarning: "Effektiv hydrering är utanför normalt intervall.",
  flourBlendAbsorptionNote:
    "Denna mjölblandning tenderar att absorbera mer vatten än en neutral blandning. Degen kan kännas lite fast tidigt och slappna av efter vila.",
  enterPresetName: "Ange ett förinställningsnamn.",
  confirmDeletePreset: "Ta bort denna förinställning?",
  noPresets: "Inga förinställningar ännu.",
  cancel: "Avbryt",
  save: "Spara",
  switchLanguage: "Byt språk",
  scrollToTop: "Scrolla upp",
  decrease: "Minska",
  increase: "Öka",
  markComplete: (title: string) => `Markera ${title} som klar`,
  markIncomplete: (title: string) => `Markera ${title} som ej klar`,
  validationError: "Ange giltiga värden. Salt måste vara större än noll.",
  recipeError:
    "Dessa värden ger inget giltigt recept. Prova att öka målvikten eller minska surdegen.",
  recipes: "Recept",
  saveRecipe: "Spara recept",
  loadRecipe: "Ladda",
  deleteRecipe: "Ta bort",
  updateRecipe: "Uppdatera",
  recipeName: "Receptnamn",
  enterRecipeName: "Ange ett receptnamn.",
  confirmDeleteRecipe: "Ta bort detta recept?",
  savedRecipes: "Sparade recept",
  noSavedRecipes: "Inga sparade recept ännu.",
  recipeNeapolitanPizza: "Napolitansk pizza",
  recipeEverydayBread: "Vardagsbröd",
  recipeSaved: "Recept sparat.",
  recipeLoaded: "Recept laddat.",
};

const translations: Record<Lang, Translations> = { en, sv };

@Injectable({ providedIn: "root" })
export class I18nService {
  private readonly lang = signal<Lang>(this.loadLang());

  readonly currentLang = this.lang.asReadonly();
  readonly t = computed(() => translations[this.lang()]);

  private loadLang(): Lang {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "sv" || saved === "en") return saved;
    } catch {
      /* noop */
    }
    try {
      const browserLang = navigator.language || navigator.languages?.[0] || "";
      if (browserLang.startsWith("sv")) return "sv";
    } catch {
      /* noop */
    }
    return "en";
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
    this.setLang(this.lang() === "en" ? "sv" : "en");
  }
}
