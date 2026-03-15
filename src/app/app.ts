import {
  Component,
  inject,
  signal,
  computed,
  viewChild,
  OnInit,
  HostListener,
  effect,
} from "@angular/core";
import { Title } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";
import {
  CalcService,
  CalcInputs,
  CalcResult,
  CalcOutput,
} from "./calc.service";
import { DEFAULT_INPUTS, YEAST_LABELS, FIELD_RANGES } from "./config";
import { I18nService } from "./i18n.service";
import { StorageService } from "./storage.service";
import { StepperComponent } from "./stepper/stepper";
import { ResultsComponent } from "./results/results";
import { InstructionsComponent } from "./instructions/instructions";
import { TooltipDirective } from "./tooltip.directive";
import { SplashComponent } from "./splash/splash";
import { FlourBlendComponent } from "./flour-blend/flour-blend";
import { FlourBlendService } from "./flour-blend.service";
import { RecipeService } from "./recipe.service";
import { Recipe } from "./recipe-presets";
import { AuthService } from "./auth.service";
import { BakingSessionComponent } from "./baking-session/baking-session";
import { CompareComponent } from "./compare/compare";

const INFO_MESSAGES: Record<string, string> = {};

@Component({
  selector: "app-root",
  imports: [
    FormsModule,
    StepperComponent,
    ResultsComponent,
    InstructionsComponent,
    TooltipDirective,
    SplashComponent,
    FlourBlendComponent,
    BakingSessionComponent,
    CompareComponent,
  ],
  templateUrl: "./app.html",
  styleUrl: "./app.css",
})
export class App implements OnInit {
  private readonly calc = inject(CalcService);
  private readonly storage = inject(StorageService);
  private readonly blend = inject(FlourBlendService);
  readonly recipes = inject(RecipeService);
  readonly auth = inject(AuthService);
  private readonly instructionsRef = viewChild(InstructionsComponent);
  private readonly titleService = inject(Title);
  readonly i18n = inject(I18nService);

  private yeastLabel(yeastType: string): string {
    const t = this.i18n.t();
    const labels: Record<string, string> = {
      fresh: t.freshYeast,
      activeDry: t.activeDryYeast,
      instant: t.instantYeast,
    };
    return labels[yeastType] ?? yeastType;
  }

  constructor() {
    effect(() => {
      this.titleService.setTitle(this.i18n.t().appTitle);
    });
  }

  readonly INFO = INFO_MESSAGES;

  // Auth state
  readonly showProfileMenu = signal(false);

  // Input signals
  readonly breadCount = signal(DEFAULT_INPUTS.breadCount);
  readonly targetBallWeight = signal(DEFAULT_INPUTS.targetBallWeight);
  readonly yeastType = signal<CalcInputs["yeastType"]>(
    DEFAULT_INPUTS.yeastType,
  );
  readonly hydrationPct = signal(DEFAULT_INPUTS.hydrationPct);
  readonly saltPct = signal(DEFAULT_INPUTS.saltPct);
  readonly sugarPct = signal(DEFAULT_INPUTS.sugarPct);
  readonly oilPct = signal(DEFAULT_INPUTS.oilPct);
  readonly milkPctOfWater = signal(DEFAULT_INPUTS.milkPctOfWater);
  readonly starterWeight = signal(DEFAULT_INPUTS.starterWeight);
  readonly starterHydrationPct = signal(DEFAULT_INPUTS.starterHydrationPct);
  readonly totalHours = signal(DEFAULT_INPUTS.totalHours);
  readonly roomTemp = signal(DEFAULT_INPUTS.roomTemp);

  // UI state
  readonly advancedOpen = signal(false);
  readonly resultsVisible = signal(false);
  readonly validationError = signal<string | null>(null);
  readonly result = signal<CalcResult | null>(null);
  readonly showScrollTop = signal(false);
  readonly showSplash = signal(SplashComponent.shouldShow());

  // Recipe UI state
  readonly showSaveDialog = signal(false);
  readonly saveRecipeName = signal("");

  // Active recipe cloud id for baking session
  readonly activeRecipeCloudId = computed(() => {
    const id = this.recipes.activeId();
    if (!id || !id.startsWith("cloud-")) return null;
    return parseInt(id.replace("cloud-", ""), 10);
  });

  // Yeast recommendation text
  readonly yeastRecommendation = computed(() => {
    const r = this.result();
    const t = this.i18n.t();
    if (!r) return t.yeastRecommendationPending;
    const pct = r.chosenYeastPct * 100;
    const label = this.yeastLabel(r.yeastType);
    return `${label}: ${this.calc.round1(r.yeastToAdd)} g (${this.calc.round1(pct)}% of total flour).`;
  });

  readonly yeastOptions = computed(() => {
    const t = this.i18n.t();
    return [
      { value: "fresh", label: t.freshYeast },
      { value: "activeDry", label: t.activeDryYeast },
      { value: "instant", label: t.instantYeast },
    ];
  });

  // Field validation states: 'ok' | 'warn' | 'error'
  readonly hydrationState = computed(() =>
    this.fieldState(this.hydrationPct(), FIELD_RANGES["hydration"]),
  );
  readonly saltState = computed(() =>
    this.fieldState(this.saltPct(), FIELD_RANGES["salt"]),
  );
  readonly sugarState = computed(() =>
    this.fieldState(this.sugarPct(), FIELD_RANGES["sugar"]),
  );
  readonly oilState = computed(() =>
    this.fieldState(this.oilPct(), FIELD_RANGES["oil"]),
  );
  readonly milkState = computed(() =>
    this.fieldState(this.milkPctOfWater(), FIELD_RANGES["milk"]),
  );

  private fieldState(
    value: number,
    range: (typeof FIELD_RANGES)[string],
  ): "ok" | "warn" | "error" {
    if (value < range.error.min || value > range.error.max) return "error";
    if (value < range.warn.min || value > range.warn.max) return "warn";
    return "ok";
  }

  ngOnInit(): void {
    const saved = this.storage.load();
    this.breadCount.set(saved.breadCount);
    this.targetBallWeight.set(saved.targetBallWeight);
    this.yeastType.set(saved.yeastType);
    this.hydrationPct.set(saved.hydrationPct);
    this.saltPct.set(saved.saltPct);
    this.sugarPct.set(saved.sugarPct);
    this.oilPct.set(saved.oilPct);
    this.milkPctOfWater.set(saved.milkPctOfWater);
    this.starterWeight.set(saved.starterWeight);
    this.starterHydrationPct.set(saved.starterHydrationPct);
    this.totalHours.set(saved.totalHours);
    this.roomTemp.set(saved.roomTemp);
    this.runCalculation();
    this.initGoogleSignIn();
  }

  // ── Google Sign-In ──────────────────────────────────

  private initGoogleSignIn(): void {
    const tryInit = () => {
      const google = (window as unknown as Record<string, unknown>)[
        "google"
      ] as
        | {
            accounts?: {
              id?: { initialize: Function; renderButton: Function };
            };
          }
        | undefined;
      if (!google?.accounts?.id) {
        setTimeout(tryInit, 200);
        return;
      }
      google.accounts.id.initialize({
        client_id: this.getGoogleClientId(),
        callback: (response: { credential: string }) => {
          this.handleGoogleResponse(response.credential);
        },
      });
      const btnEl = document.getElementById("google-signin-btn");
      if (btnEl) {
        google.accounts.id.renderButton(btnEl, {
          theme: "outline",
          size: "medium",
          shape: "pill",
        });
      }
    };
    tryInit();
  }

  private getGoogleClientId(): string {
    return "389010640560-4b3ha79fg8om1qq0d4pdfsmf6hjclf6o.apps.googleusercontent.com";
  }

  private async handleGoogleResponse(credential: string): Promise<void> {
    const ok = await this.auth.loginWithGoogle(credential);
    if (ok) {
      await this.recipes.syncToCloud();
      await this.blend.syncToCloud();
    }
  }

  doLogout(): void {
    this.auth.logout();
    this.showProfileMenu.set(false);
  }

  toggleProfileMenu(): void {
    this.showProfileMenu.update((v) => !v);
  }

  @HostListener("window:scroll")
  onScroll(): void {
    this.showScrollTop.set(window.scrollY > 300);
  }

  getInputs(): CalcInputs {
    return {
      breadCount: this.breadCount(),
      targetBallWeight: this.targetBallWeight(),
      yeastType: this.yeastType(),
      hydrationPct: this.hydrationPct(),
      saltPct: this.saltPct(),
      sugarPct: this.sugarPct(),
      oilPct: this.oilPct(),
      milkPctOfWater: this.milkPctOfWater(),
      starterWeight: this.starterWeight(),
      starterHydrationPct: this.starterHydrationPct(),
      totalHours: this.totalHours(),
      roomTemp: this.roomTemp(),
      flourBlendAdjustment: this.blend.blendValid()
        ? this.blend.flourBlendAdjustment()
        : 0,
      customHydrationAdjustment: this.blend.blendValid()
        ? this.blend.customHydrationAdjustment()
        : 0,
    };
  }

  private saveInputs(): void {
    this.storage.save(this.getInputs());
  }

  runCalculation(): void {
    this.validationError.set(null);
    this.saveInputs();
    const output: CalcOutput = this.calc.calculate(this.getInputs());
    if ("error" in output) {
      const t = this.i18n.t();
      const msg =
        output.error === "validation" ? t.validationError : t.recipeError;
      this.validationError.set(msg);
      this.resultsVisible.set(false);
      this.result.set(null);
      return;
    }
    this.result.set(output);
    this.resultsVisible.set(true);
  }

  onYeastTypeChange(value: string): void {
    this.yeastType.set(value as CalcInputs["yeastType"]);
    this.saveInputs();
    if (this.resultsVisible()) {
      this.runCalculation();
    }
  }

  onStepperChange(): void {
    this.saveInputs();
  }

  toggleAdvanced(): void {
    this.advancedOpen.update((v) => !v);
  }

  reset(): void {
    const inst = this.instructionsRef();
    if (inst) inst.stopActiveTimer(false);

    this.breadCount.set(DEFAULT_INPUTS.breadCount);
    this.targetBallWeight.set(DEFAULT_INPUTS.targetBallWeight);
    this.yeastType.set(DEFAULT_INPUTS.yeastType);
    this.hydrationPct.set(DEFAULT_INPUTS.hydrationPct);
    this.saltPct.set(DEFAULT_INPUTS.saltPct);
    this.sugarPct.set(DEFAULT_INPUTS.sugarPct);
    this.oilPct.set(DEFAULT_INPUTS.oilPct);
    this.milkPctOfWater.set(DEFAULT_INPUTS.milkPctOfWater);
    this.starterWeight.set(DEFAULT_INPUTS.starterWeight);
    this.starterHydrationPct.set(DEFAULT_INPUTS.starterHydrationPct);
    this.totalHours.set(DEFAULT_INPUTS.totalHours);
    this.roomTemp.set(DEFAULT_INPUTS.roomTemp);

    this.validationError.set(null);
    this.resultsVisible.set(false);
    this.result.set(null);
    this.blend.clearBlend();
    this.storage.clear();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // ── Recipe methods ──────────────────────────────────

  private applyInputs(inputs: Recipe["inputs"]): void {
    this.breadCount.set(inputs.breadCount);
    this.targetBallWeight.set(inputs.targetBallWeight);
    this.yeastType.set(inputs.yeastType);
    this.hydrationPct.set(inputs.hydrationPct);
    this.saltPct.set(inputs.saltPct);
    this.sugarPct.set(inputs.sugarPct);
    this.oilPct.set(inputs.oilPct);
    this.milkPctOfWater.set(inputs.milkPctOfWater);
    this.starterWeight.set(inputs.starterWeight);
    this.starterHydrationPct.set(inputs.starterHydrationPct);
    this.totalHours.set(inputs.totalHours);
    this.roomTemp.set(inputs.roomTemp);
  }

  loadRecipe(recipe: Recipe): void {
    this.applyInputs(recipe.inputs);
    this.recipes.setActive(recipe.id);
    this.saveInputs();
    this.runCalculation();
  }

  onRecipeSelect(id: string): void {
    if (!id) {
      this.recipes.clearActive();
      return;
    }
    const recipe = this.recipes.allRecipes().find((r) => r.id === id);
    if (recipe) this.loadRecipe(recipe);
  }

  openSaveDialog(): void {
    this.saveRecipeName.set("");
    this.showSaveDialog.set(true);
  }

  closeSaveDialog(): void {
    this.showSaveDialog.set(false);
  }

  confirmSaveRecipe(): void {
    const name = this.saveRecipeName().trim();
    if (!name) return;
    const inputs = this.getInputs();
    this.recipes.saveRecipe(name, inputs);
    this.showSaveDialog.set(false);
  }

  updateActiveRecipe(): void {
    const active = this.recipes.activeRecipe();
    if (!active || active.builtIn) return;
    this.recipes.updateRecipe(active.id, this.getInputs());
  }

  deleteActiveRecipe(): void {
    const active = this.recipes.activeRecipe();
    if (!active || active.builtIn) return;
    if (!confirm(this.i18n.t().confirmDeleteRecipe)) return;
    this.recipes.deleteRecipe(active.id);
  }

  recipeName(recipe: Recipe): string {
    if (recipe.nameKey) {
      const t = this.i18n.t();
      return (
        ((t as unknown as Record<string, unknown>)[recipe.nameKey] as string) ??
        recipe.name
      );
    }
    return recipe.name;
  }
}
