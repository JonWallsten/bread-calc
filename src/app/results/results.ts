import { Component, computed, inject, input, signal } from "@angular/core";
import { CalcResult, CalcService } from "../calc.service";
import { I18nService } from "../i18n.service";
import { FlourBlendService } from "../flour-blend.service";
import { getFlourDefinitionById } from "../flour.config";

@Component({
  selector: "app-results",
  templateUrl: "./results.html",
  styleUrl: "./results.css",
})
export class ResultsComponent {
  private readonly calc = inject(CalcService);
  readonly i18n = inject(I18nService);
  private readonly blend = inject(FlourBlendService);
  readonly data = input.required<CalcResult>();
  protected readonly recipeCopied = signal(false);

  private yeastLabel(yeastType: string): string {
    const t = this.i18n.t();
    const labels: Record<string, string> = {
      fresh: t.freshYeast,
      swedishDry: t.swedishDryYeast,
      activeDry: t.activeDryYeast,
      instant: t.instantYeast,
    };
    return labels[yeastType] ?? yeastType;
  }

  protected readonly stats = computed(() => {
    const d = this.data();
    const t = this.i18n.t();
    const hasBlend =
      d.flourBlendAdjustment !== 0 || d.customHydrationAdjustment !== 0;
    const hydrationDisplay = hasBlend
      ? `${this.calc.round1(d.effectiveHydrationPct)}%`
      : `${this.calc.round1(d.hydrationPct)}%`;
    const hydrationLabel = hasBlend ? t.effectiveHydration : t.hydration;
    return [
      {
        value: `${Math.round(d.finalDoughWeight)} g`,
        label: t.totalDoughWeight,
      },
      { value: `${Math.round(d.actualPerBall)} g`, label: t.actualPerBall },
      { value: hydrationDisplay, label: hydrationLabel },
      {
        value: `${this.calc.round1(d.yeastToAdd)} g`,
        label: this.yeastLabel(d.yeastType),
      },
      {
        value: `${this.calc.round1(d.prefermentedFlourPct)}%`,
        label: t.starterFlourShare,
      },
      {
        value: this.calc.waterTempRange(d.roomTemp),
        label: t.waterTemperature,
      },
    ];
  });

  protected readonly ingredients = computed(() => {
    const d = this.data();
    const t = this.i18n.t();
    const rows: [string, string][] = [];

    // Flour — expand into per-type rows when blend is active and valid
    const blendRows = this.blend.blendRows();
    if (blendRows.length > 0 && this.blend.blendValid()) {
      const lang = this.i18n.currentLang();
      rows.push([t.flourToAdd, `${Math.round(d.flourToAdd)} g`]);
      for (const br of blendRows) {
        const def = getFlourDefinitionById(br.flourId);
        const name = def
          ? lang === "sv"
            ? def.nameSv
            : def.nameEn
          : br.flourId;
        const amount = Math.round((d.flourToAdd * br.percent) / 100);
        rows.push([`↳ ${name}`, `${amount} g`]);
      }
    } else {
      rows.push([t.flourToAdd, `${Math.round(d.flourToAdd)} g`]);
    }

    rows.push([t.starter, `${Math.round(d.starterWeight)} g`]);
    rows.push([t.waterToAdd, `${Math.round(d.waterToAdd)} g`]);
    if (d.milkToAdd > 0) {
      rows.push([t.milkToAdd, `${Math.round(d.milkToAdd)} g`]);
    }
    rows.push([t.saltIngredient, `${Math.round(d.saltToAdd)} g`]);
    if (d.sugarToAdd > 0) {
      rows.push([t.sugarIngredient, `${Math.round(d.sugarToAdd)} g`]);
    }
    if (d.oilToAdd > 0) {
      rows.push([t.oilIngredient, `${Math.round(d.oilToAdd)} g`]);
    }
    rows.push([
      this.yeastLabel(d.yeastType),
      `${this.calc.round1(d.yeastToAdd)} g`,
    ]);
    return rows;
  });

  protected readonly supportText = computed(() => {
    const d = this.data();
    const t = this.i18n.t();
    const hoursStr =
      d.totalHours % 1 === 0
        ? `${d.totalHours}`
        : `${this.calc.round1(d.totalHours)}`;
    const tempStr =
      d.roomTemp % 1 === 0
        ? `${d.roomTemp}`
        : `${this.calc.round1(d.roomTemp)}`;
    return `${t.supportStarterCalc(Math.round(d.starterHydrationPct), Math.round(d.starterFlour), Math.round(d.starterWater))} ${t.supportYeastEstimated(this.yeastLabel(d.yeastType), hoursStr, tempStr)} ${t.supportHeuristic}`;
  });

  async copyRecipe(): Promise<void> {
    const t = this.i18n.t();
    const lines = [
      `${t.results}`,
      "",
      ...this.stats().map((s) => `${s.label}: ${s.value}`),
      "",
      `${t.ingredients}`,
      ...this.ingredients().map((r) => `${r[0]}: ${r[1]}`),
    ];
    await navigator.clipboard.writeText(lines.join("\n"));
    this.recipeCopied.set(true);
    setTimeout(() => this.recipeCopied.set(false), 2000);
  }
}
