import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { I18nService } from '../i18n.service';
import { AuthService } from '../auth.service';
import {
    BakingSessionService,
    BakingSessionSummary,
    BakingSessionDetail,
} from '../baking-session.service';
import { CalcResult } from '../calc.service';
import { getFlourDefinitionById } from '../flour.config';
import { SelectComponent } from '../select/select';

interface CompareRow {
    label: string;
    valueA: string;
    valueB: string;
    diff: string;
    diffClass: string;
    divider?: boolean;
}

@Component({
    selector: 'app-compare',
    templateUrl: './compare.html',
    styleUrl: './compare.scss',
    imports: [SelectComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CompareComponent {
    readonly i18n = inject(I18nService);
    readonly auth = inject(AuthService);
    private readonly sessionService = inject(BakingSessionService);

    readonly sessionIdA = signal<string>('');
    readonly sessionIdB = signal<string>('');
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
            divider?: boolean;
        }> = [
            { label: t.hydration, key: 'hydrationPct', unit: '%' },
            { label: t.salt, key: 'saltPct', unit: '%', decimals: 1 },
            { label: t.sugar, key: 'sugarPct', unit: '%', decimals: 1 },
            { label: t.oil, key: 'oilPct', unit: '%', decimals: 1 },
            { label: t.totalDoughWeight, key: 'finalDoughWeight', unit: ' g', divider: true },
            { label: t.actualPerBall, key: 'actualPerBall', unit: ' g' },
            { label: t.flourToAdd, key: 'flourToAdd', unit: ' g' },
            { label: t.waterToAdd, key: 'waterToAdd', unit: ' g' },
            { label: t.saltIngredient, key: 'saltToAdd', unit: ' g' },
            { label: t.yeastIngredient, key: 'yeastToAdd', unit: ' g', decimals: 1 },
            { label: t.milkIngredient, key: 'milkToAdd', unit: ' g' },
            { label: t.sugarAmount, key: 'sugarToAdd', unit: ' g' },
            { label: t.oilAmount, key: 'oilToAdd', unit: ' g' },
        ];

        return fields.map((f) => {
            const va = a[f.key] as number;
            const vb = b[f.key] as number;
            const dec = f.decimals ?? 0;
            const d = vb - va;
            let diff = t.noChange;
            let diffClass = '';
            if (Math.abs(d) > 0.05) {
                const sign = d > 0 ? '+' : '';
                diff = `${sign}${d.toFixed(dec)}${f.unit}`;
                diffClass = d > 0 ? 'diff-higher' : 'diff-lower';
            }
            return {
                label: f.label,
                valueA: `${va.toFixed(dec)}${f.unit}`,
                valueB: `${vb.toFixed(dec)}${f.unit}`,
                diff,
                diffClass,
                divider: f.divider,
            };
        });
    });

    readonly blendRows = computed<CompareRow[]>(() => {
        const a = this.resultA();
        const b = this.resultB();
        if (!a && !b) return [];
        const rowsA = a?.flourBlendRows ?? [];
        const rowsB = b?.flourBlendRows ?? [];
        if (!rowsA.length && !rowsB.length) return [];

        const lang = this.i18n.currentLang();
        const mapA = new Map(rowsA.map((r) => [r.flourId, r.percent]));
        const mapB = new Map(rowsB.map((r) => [r.flourId, r.percent]));
        const allIds = [...new Set([...mapA.keys(), ...mapB.keys()])];

        return allIds.map((id) => {
            const def = getFlourDefinitionById(id);
            const name = def ? (lang === 'sv' ? def.nameSv : def.nameEn) : id;
            const pA = mapA.get(id);
            const pB = mapB.get(id);
            const valueA = pA != null ? `${pA}%` : '–';
            const valueB = pB != null ? `${pB}%` : '–';
            let diff = '';
            let diffClass = '';
            if (pA != null && pB != null) {
                const d = pB - pA;
                if (Math.abs(d) > 0.05) {
                    diff = `${d > 0 ? '+' : ''}${d.toFixed(0)}%`;
                    diffClass = d > 0 ? 'diff-higher' : 'diff-lower';
                } else {
                    diff = this.i18n.t().noChange;
                }
            }
            return { label: name, valueA, valueB, diff, diffClass };
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
        const parts = [date];
        if (s.title) parts.push(s.title);
        if (s.recipe_name) parts.push(s.recipe_name);
        return parts.join(' — ');
    }
}
