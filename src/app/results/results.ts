import { Component, computed, inject, input } from "@angular/core";
import { CalcResult, CalcService } from "../calc.service";
import { I18nService } from "../i18n.service";

@Component({
  selector: "app-results",
  templateUrl: "./results.html",
  styleUrl: "./results.css",
})
export class ResultsComponent {
  private readonly calc = inject(CalcService);
  readonly i18n = inject(I18nService);
  readonly data = input.required<CalcResult>();

  protected readonly stats = computed(() => {
    const d = this.data();
    const t = this.i18n.t();
    return [
      {
        value: `${Math.round(d.finalDoughWeight)} g`,
        label: t.totalDoughWeight,
      },
      { value: `${Math.round(d.actualPerBall)} g`, label: t.actualPerBall },
      { value: `${this.calc.round1(d.hydrationPct)}%`, label: t.hydration },
      { value: `${this.calc.round1(d.yeastToAdd)} g`, label: d.yeastTypeLabel },
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
    const rows: [string, string][] = [
      [t.flourToAdd, `${Math.round(d.flourToAdd)} g`],
      [t.starter, `${Math.round(d.starterWeight)} g`],
      [t.waterToAdd, `${Math.round(d.waterToAdd)} g`],
    ];
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
    rows.push([d.yeastTypeLabel, `${Math.round(d.yeastToAdd)} g`]);
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
    return `${t.supportStarterCalc(Math.round(d.starterHydrationPct), Math.round(d.starterFlour), Math.round(d.starterWater))} ${t.supportYeastEstimated(d.yeastTypeLabel, hoursStr, tempStr)} ${t.supportHeuristic}`;
  });
}
