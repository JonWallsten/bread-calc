import { Component, computed, inject, input } from '@angular/core';
import { CalcResult, CalcService } from '../calc.service';

@Component({
  selector: 'app-results',
  templateUrl: './results.html',
  styleUrl: './results.css',
})
export class ResultsComponent {
  private readonly calc = inject(CalcService);
  readonly data = input.required<CalcResult>();

  protected readonly stats = computed(() => {
    const d = this.data();
    return [
      { value: `${Math.round(d.finalDoughWeight)} g`, label: 'Total dough weight' },
      { value: `${Math.round(d.actualPerBall)} g`, label: 'Actual per ball' },
      { value: `${this.calc.round1(d.hydrationPct)}%`, label: 'Hydration' },
      { value: `${this.calc.round1(d.yeastToAdd)} g`, label: d.yeastTypeLabel },
      { value: `${this.calc.round1(d.prefermentedFlourPct)}%`, label: 'Starter flour share' },
      { value: this.calc.waterTempRange(d.roomTemp), label: 'Water temperature' },
    ];
  });

  protected readonly ingredients = computed(() => {
    const d = this.data();
    const rows: [string, string][] = [
      ['Flour to add', `${Math.round(d.flourToAdd)} g`],
      ['Starter', `${Math.round(d.starterWeight)} g`],
      ['Water to add', `${Math.round(d.waterToAdd)} g`],
    ];
    if (d.milkToAdd > 0) {
      rows.push(['Milk to add', `${Math.round(d.milkToAdd)} g`]);
    }
    rows.push(['Salt', `${Math.round(d.saltToAdd)} g`]);
    if (d.sugarToAdd > 0) {
      rows.push(['Sugar', `${Math.round(d.sugarToAdd)} g`]);
    }
    if (d.oilToAdd > 0) {
      rows.push(['Oil', `${Math.round(d.oilToAdd)} g`]);
    }
    rows.push([d.yeastTypeLabel, `${Math.round(d.yeastToAdd)} g`]);
    return rows;
  });

  protected readonly supportText = computed(() => {
    const d = this.data();
    const hoursStr =
      d.totalHours % 1 === 0 ? `${d.totalHours}` : `${this.calc.round1(d.totalHours)}`;
    const tempStr = d.roomTemp % 1 === 0 ? `${d.roomTemp}` : `${this.calc.round1(d.roomTemp)}`;
    return `Starter is calculated at ${Math.round(d.starterHydrationPct)}% hydration, which means roughly ${Math.round(d.starterFlour)} g flour and ${Math.round(d.starterWater)} g water inside the starter. ${d.yeastTypeLabel} is estimated from ${hoursStr} h, ${tempStr}°C, total starter amount, and starter hydration. This is a practical baking heuristic, not an exact fermentation model.`;
  });
}
