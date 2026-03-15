import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { I18nService } from "../i18n.service";
import { AuthService } from "../auth.service";
import { ApiService } from "../api.service";
import { RecipeService } from "../recipe.service";
import {
  CalcService,
  CalcInputs,
  CalcResult,
  CalcOutput,
} from "../calc.service";

interface CompareRow {
  label: string;
  valueA: string;
  valueB: string;
  diff: string;
  diffClass: string;
}

@Component({
  selector: "app-compare",
  templateUrl: "./compare.html",
  styleUrl: "./compare.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompareComponent {
  readonly i18n = inject(I18nService);
  readonly auth = inject(AuthService);
  readonly recipes = inject(RecipeService);
  private readonly calc = inject(CalcService);
  private readonly api = inject(ApiService);

  readonly recipeIdA = signal<string>("");
  readonly recipeIdB = signal<string>("");
  readonly resultA = signal<CalcResult | null>(null);
  readonly resultB = signal<CalcResult | null>(null);

  readonly allRecipes = this.recipes.allRecipes;

  readonly rows = computed<CompareRow[]>(() => {
    const a = this.resultA();
    const b = this.resultB();
    if (!a || !b) return [];

    const t = this.i18n.t();
    const fields: Array<{
      label: string;
      key: keyof CalcResult;
      unit: string;
      decimals?: number;
    }> = [
      { label: t.hydration, key: "hydrationPct", unit: "%" },
      { label: t.salt, key: "saltPct", unit: "%", decimals: 1 },
      { label: t.sugar, key: "sugarPct", unit: "%", decimals: 1 },
      { label: t.oil, key: "oilPct", unit: "%", decimals: 1 },
      { label: t.totalDoughWeight, key: "finalDoughWeight", unit: " g" },
      { label: t.actualPerBall, key: "actualPerBall", unit: " g" },
      { label: t.flourToAdd, key: "flourToAdd", unit: " g" },
      { label: t.waterToAdd, key: "waterToAdd", unit: " g" },
      { label: t.saltIngredient, key: "saltToAdd", unit: " g" },
    ];

    return fields.map((f) => {
      const va = a[f.key] as number;
      const vb = b[f.key] as number;
      const dec = f.decimals ?? 0;
      const d = vb - va;
      let diff = t.noChange;
      let diffClass = "";
      if (Math.abs(d) > 0.05) {
        const sign = d > 0 ? "+" : "";
        diff = `${sign}${d.toFixed(dec)}${f.unit}`;
        diffClass = d > 0 ? "diff-higher" : "diff-lower";
      }
      return {
        label: f.label,
        valueA: `${va.toFixed(dec)}${f.unit}`,
        valueB: `${vb.toFixed(dec)}${f.unit}`,
        diff,
        diffClass,
      };
    });
  });

  onSelectA(id: string): void {
    this.recipeIdA.set(id);
    this.recalculate();
  }

  onSelectB(id: string): void {
    this.recipeIdB.set(id);
    this.recalculate();
  }

  private recalculate(): void {
    const a = this.findRecipe(this.recipeIdA());
    const b = this.findRecipe(this.recipeIdB());

    if (a) {
      const out = this.calc.calculate(a.inputs);
      this.resultA.set("error" in out ? null : out);
    } else {
      this.resultA.set(null);
    }

    if (b) {
      const out = this.calc.calculate(b.inputs);
      this.resultB.set("error" in out ? null : out);
    } else {
      this.resultB.set(null);
    }
  }

  private findRecipe(id: string) {
    return this.allRecipes().find((r) => r.id === id) ?? null;
  }

  recipeName(recipe: { nameKey?: string; name: string }): string {
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
