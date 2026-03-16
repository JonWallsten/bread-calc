import {
  Component,
  inject,
  signal,
  computed,
  ChangeDetectionStrategy,
} from "@angular/core";
import { I18nService } from "../i18n.service";
import { AuthService } from "../auth.service";
import {
  BakingSessionService,
  BakingSessionSummary,
  BakingSessionDetail,
} from "../baking-session.service";
import { CalcResult } from "../calc.service";

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
  styleUrl: "./compare.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompareComponent {
  readonly i18n = inject(I18nService);
  readonly auth = inject(AuthService);
  private readonly sessionService = inject(BakingSessionService);

  readonly sessionIdA = signal<string>("");
  readonly sessionIdB = signal<string>("");
  readonly resultA = signal<CalcResult | null>(null);
  readonly resultB = signal<CalcResult | null>(null);

  readonly allSessions = this.sessionService.sessions;

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
      { label: t.yeastIngredient, key: "yeastToAdd", unit: " g", decimals: 1 },
      { label: t.milkIngredient, key: "milkToAdd", unit: " g" },
      { label: t.sugarAmount, key: "sugarToAdd", unit: " g" },
      { label: t.oilAmount, key: "oilToAdd", unit: " g" },
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

  async onSelectA(id: string): Promise<void> {
    this.sessionIdA.set(id);
    await this.loadResult(id, this.resultA);
  }

  async onSelectB(id: string): Promise<void> {
    this.sessionIdB.set(id);
    await this.loadResult(id, this.resultB);
  }

  private async loadResult(
    id: string,
    target: ReturnType<typeof signal<CalcResult | null>>,
  ): Promise<void> {
    if (!id) {
      target.set(null);
      return;
    }
    const detail = await this.sessionService.getSession(Number(id));
    target.set(detail?.results_snapshot ?? null);
  }

  sessionLabel(s: BakingSessionSummary): string {
    const date = new Date(s.baked_at).toLocaleDateString();
    return s.recipe_name ? `${date} — ${s.recipe_name}` : date;
  }
}
