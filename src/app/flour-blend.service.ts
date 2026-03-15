import { Injectable, inject, signal, computed } from "@angular/core";
import {
  FlourBlendRow,
  UserFlourPreset,
  BUILT_IN_PRESETS,
  FLOUR_DEFINITIONS,
  calculateFlourBlendAdjustment,
  getFlourDefinitionById,
} from "./flour.config";
import { AuthService } from "./auth.service";
import { ApiService } from "./api.service";

const STORAGE_KEY = "breadCalcUserFlourPresets";
const BLEND_STORAGE_KEY = "breadCalcFlourBlend";

@Injectable({ providedIn: "root" })
export class FlourBlendService {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);

  readonly blendRows = signal<FlourBlendRow[]>(this.loadBlend());
  readonly userPresets = signal<UserFlourPreset[]>(this.loadPresets());
  readonly selectedPresetId = signal<string | null>(null);
  readonly customHydrationAdjustment = signal(0);

  readonly blendTotal = computed(() =>
    this.blendRows().reduce((sum, r) => sum + r.percent, 0),
  );

  readonly blendValid = computed(() => {
    const rows = this.blendRows();
    if (rows.length === 0) return true; // no blend = valid (no adjustment)
    return this.blendTotal() === 100 && !this.hasDuplicates();
  });

  readonly blendActive = computed(() => this.blendRows().length > 0);

  readonly flourBlendAdjustment = computed(() => {
    const rows = this.blendRows();
    if (rows.length === 0 || !this.blendValid()) return 0;
    return Math.round(calculateFlourBlendAdjustment(rows) * 10) / 10;
  });

  readonly effectiveHydrationOffset = computed(
    () => this.flourBlendAdjustment() + this.customHydrationAdjustment(),
  );

  private hasDuplicates(): boolean {
    const ids = this.blendRows().map((r) => r.flourId);
    return new Set(ids).size !== ids.length;
  }

  readonly duplicateIds = computed(() => {
    const ids = this.blendRows().map((r) => r.flourId);
    const seen = new Set<string>();
    const dupes = new Set<string>();
    for (const id of ids) {
      if (seen.has(id)) dupes.add(id);
      seen.add(id);
    }
    return dupes;
  });

  readonly isBuiltinPreset = computed(() => {
    const id = this.selectedPresetId();
    return id ? BUILT_IN_PRESETS.some((p) => p.id === id) : false;
  });

  // ── Row operations ───────────────────────────────────

  addRow(): void {
    const usedIds = new Set(this.blendRows().map((r) => r.flourId));
    const available = FLOUR_DEFINITIONS.find((f) => !usedIds.has(f.id));
    if (!available) return;
    this.blendRows.update((rows) => [
      ...rows,
      { flourId: available.id, percent: 0 },
    ]);
    this.saveBlend();
  }

  removeRow(index: number): void {
    this.blendRows.update((rows) => rows.filter((_, i) => i !== index));
    this.saveBlend();
  }

  updateRowFlour(index: number, flourId: string): void {
    this.blendRows.update((rows) =>
      rows.map((r, i) => (i === index ? { ...r, flourId } : r)),
    );
    this.saveBlend();
  }

  updateRowPercent(index: number, percent: number): void {
    this.blendRows.update((rows) =>
      rows.map((r, i) => (i === index ? { ...r, percent } : r)),
    );
    this.saveBlend();
  }

  clearBlend(): void {
    this.blendRows.set([]);
    this.selectedPresetId.set(null);
    this.customHydrationAdjustment.set(0);
    this.saveBlend();
  }

  // ── Preset operations ────────────────────────────────

  loadPreset(presetId: string): void {
    const builtin = BUILT_IN_PRESETS.find((p) => p.id === presetId);
    if (builtin) {
      this.blendRows.set(builtin.flours.map((f) => ({ ...f })));
      this.customHydrationAdjustment.set(builtin.customHydrationAdjustment);
      this.selectedPresetId.set(presetId);
      this.saveBlend();
      return;
    }
    const user = this.userPresets().find((p) => p.id === presetId);
    if (user) {
      this.blendRows.set(user.flours.map((f) => ({ ...f })));
      this.customHydrationAdjustment.set(user.customHydrationAdjustment);
      this.selectedPresetId.set(presetId);
      this.saveBlend();
    }
  }

  saveAsNewPreset(name: string, notes: string): void {
    if (!name.trim()) return;
    const preset: UserFlourPreset = {
      id: `preset_${Date.now()}`,
      name: name.trim(),
      flours: this.blendRows().map((f) => ({ ...f })),
      customHydrationAdjustment: this.customHydrationAdjustment(),
      notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.userPresets.update((p) => [...p, preset]);
    this.selectedPresetId.set(preset.id);
    this.savePresets();
  }

  updatePreset(): void {
    const id = this.selectedPresetId();
    if (!id || this.isBuiltinPreset()) return;
    this.userPresets.update((presets) =>
      presets.map((p) =>
        p.id === id
          ? {
              ...p,
              flours: this.blendRows().map((f) => ({ ...f })),
              customHydrationAdjustment: this.customHydrationAdjustment(),
              updatedAt: new Date().toISOString(),
            }
          : p,
      ),
    );
    this.savePresets();
  }

  deletePreset(id: string): void {
    this.userPresets.update((p) => p.filter((pr) => pr.id !== id));
    if (this.selectedPresetId() === id) {
      this.selectedPresetId.set(null);
    }
    this.savePresets();
  }

  getPresetName(id: string, lang: "en" | "sv"): string {
    const builtin = BUILT_IN_PRESETS.find((p) => p.id === id);
    if (builtin) return lang === "sv" ? builtin.nameSv : builtin.nameEn;
    const user = this.userPresets().find((p) => p.id === id);
    return user?.name ?? "";
  }

  // ── Persistence ──────────────────────────────────────

  private loadPresets(): UserFlourPreset[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private savePresets(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.userPresets()));
    } catch {
      /* noop */
    }
  }

  private loadBlend(): FlourBlendRow[] {
    try {
      const raw = localStorage.getItem(BLEND_STORAGE_KEY);
      if (!raw) return [];
      return JSON.parse(raw);
    } catch {
      return [];
    }
  }

  private saveBlend(): void {
    try {
      localStorage.setItem(BLEND_STORAGE_KEY, JSON.stringify(this.blendRows()));
    } catch {
      /* noop */
    }
  }

  /** Sync local flour blend presets to cloud on login */
  async syncToCloud(): Promise<void> {
    if (!this.auth.isLoggedIn()) return;

    try {
      const data = await this.api.get<{
        flour_blends: Array<{
          id: number;
          name: string;
          notes: string | null;
          flours: FlourBlendRow[];
          custom_hydration_adjustment: number;
        }>;
      }>("/flour-blends");

      const cloudPresets: UserFlourPreset[] = data.flour_blends.map((b) => ({
        id: `cloud-${b.id}`,
        name: b.name,
        flours: b.flours,
        customHydrationAdjustment: b.custom_hydration_adjustment,
        notes: b.notes ?? "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));

      // Upload any local-only presets
      const localOnly = this.userPresets().filter(
        (p) => !p.id.startsWith("cloud-"),
      );
      for (const local of localOnly) {
        try {
          const res = await this.api.post<{ flour_blend: { id: number } }>(
            "/flour-blends",
            {
              name: local.name,
              notes: local.notes,
              flours: local.flours,
              custom_hydration_adjustment: local.customHydrationAdjustment,
            },
          );
          cloudPresets.push({
            ...local,
            id: `cloud-${res.flour_blend.id}`,
          });
        } catch {
          cloudPresets.push(local);
        }
      }

      this.userPresets.set(cloudPresets);
      this.savePresets();
    } catch {
      // Network error — keep local state
    }
  }
}
