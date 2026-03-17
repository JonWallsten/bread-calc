import { Injectable, inject, signal, computed } from '@angular/core';
import {
    FlourBlendRow,
    UserFlourPreset,
    BUILT_IN_PRESETS,
    FLOUR_DEFINITIONS,
    calculateFlourBlendAdjustment,
    getFlourDefinitionById,
} from './flour.config';
import { AuthService } from './auth.service';
import { ApiService } from './api.service';
import { PendingDelete } from './recipe.service';

const STORAGE_KEY = 'breadCalcUserFlourPresets';
const BLEND_STORAGE_KEY = 'breadCalcFlourBlend';
const SELECTED_PRESET_KEY = 'breadCalcSelectedPreset';
const PENDING_DELETES_KEY = 'breadCalcPendingDeletes';

interface ApiFlourBlend {
    id: number;
    name: string;
    notes: string | null;
    flours: FlourBlendRow[];
    custom_hydration_adjustment: number;
    updated_at?: string;
}

@Injectable({ providedIn: 'root' })
export class FlourBlendService {
    private readonly auth = inject(AuthService);
    private readonly api = inject(ApiService);

    readonly blendRows = signal<FlourBlendRow[]>(this.loadBlend());
    readonly userPresets = signal<UserFlourPreset[]>(this.loadPresets());
    readonly selectedPresetId = signal<string | null>(this.loadSelectedPresetId());
    readonly customHydrationAdjustment = signal(0);
    private syncing = false;

    readonly blendTotal = computed(() => this.blendRows().reduce((sum, r) => sum + r.percent, 0));

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

    /** True when there are local-only presets that haven't been skipped */
    readonly hasUploadablePresets = computed(() =>
        this.userPresets().some(
            (p) =>
                !p.id.startsWith('cloud-') &&
                !(p as UserFlourPreset & { skipUpload?: boolean }).skipUpload,
        ),
    );

    // ── Row operations ───────────────────────────────────

    addRow(): void {
        const usedIds = new Set(this.blendRows().map((r) => r.flourId));
        const available = FLOUR_DEFINITIONS.find((f) => !usedIds.has(f.id));
        if (!available) return;
        this.blendRows.update((rows) => [...rows, { flourId: available.id, percent: 0 }]);
        this.saveBlend();
    }

    removeRow(index: number): void {
        this.blendRows.update((rows) => rows.filter((_, i) => i !== index));
        this.saveBlend();
    }

    updateRowFlour(index: number, flourId: string): void {
        this.blendRows.update((rows) => rows.map((r, i) => (i === index ? { ...r, flourId } : r)));
        this.saveBlend();
    }

    updateRowPercent(index: number, percent: number): void {
        this.blendRows.update((rows) => rows.map((r, i) => (i === index ? { ...r, percent } : r)));
        this.saveBlend();
    }

    clearBlend(): void {
        this.blendRows.set([]);
        this.selectedPresetId.set(null);
        this.customHydrationAdjustment.set(0);
        this.saveBlend();
        this.persistSelectedPresetId();
    }

    // ── Preset operations ────────────────────────────────

    loadPreset(presetId: string): void {
        const builtin = BUILT_IN_PRESETS.find((p) => p.id === presetId);
        if (builtin) {
            this.blendRows.set(builtin.flours.map((f) => ({ ...f })));
            this.customHydrationAdjustment.set(builtin.customHydrationAdjustment);
            this.selectedPresetId.set(presetId);
            this.saveBlend();
            this.persistSelectedPresetId();
            return;
        }
        const user = this.userPresets().find((p) => p.id === presetId);
        if (user) {
            this.blendRows.set(user.flours.map((f) => ({ ...f })));
            this.customHydrationAdjustment.set(user.customHydrationAdjustment);
            this.selectedPresetId.set(presetId);
            this.saveBlend();
            this.persistSelectedPresetId();
        }
    }

    saveAsNewPreset(name: string, notes: string): void {
        if (!name.trim()) return;
        const now = new Date().toISOString();
        const preset: UserFlourPreset = {
            id: `preset_${Date.now()}`,
            name: name.trim(),
            flours: this.blendRows().map((f) => ({ ...f })),
            customHydrationAdjustment: this.customHydrationAdjustment(),
            notes,
            createdAt: now,
            updatedAt: now,
        };
        this.userPresets.update((p) => [...p, preset]);
        this.selectedPresetId.set(preset.id);
        this.savePresets();
        this.persistSelectedPresetId();

        if (this.auth.isLoggedIn()) {
            this.api
                .post<{ flour_blend: { id: number } }>('/flour-blends', {
                    name: preset.name,
                    notes: preset.notes,
                    flours: preset.flours,
                    custom_hydration_adjustment: preset.customHydrationAdjustment,
                })
                .then(
                    (res) => {
                        if (!res?.flour_blend?.id) return;
                        const cloudId = `cloud-${res.flour_blend.id}`;
                        this.userPresets.update((list) =>
                            list.map((p) => (p.id === preset.id ? { ...p, id: cloudId } : p)),
                        );
                        if (this.selectedPresetId() === preset.id) {
                            this.selectedPresetId.set(cloudId);
                            this.persistSelectedPresetId();
                        }
                        this.savePresets();
                    },
                    () => {
                        /* fallback to local */
                    },
                );
        }
    }

    updatePreset(): void {
        const id = this.selectedPresetId();
        if (!id || this.isBuiltinPreset()) return;
        const now = new Date().toISOString();
        this.userPresets.update((presets) =>
            presets.map((p) =>
                p.id === id
                    ? {
                          ...p,
                          flours: this.blendRows().map((f) => ({ ...f })),
                          customHydrationAdjustment: this.customHydrationAdjustment(),
                          updatedAt: now,
                      }
                    : p,
            ),
        );
        this.savePresets();

        if (this.auth.isLoggedIn() && id.startsWith('cloud-')) {
            const cloudId = parseInt(id.replace('cloud-', ''), 10);
            const preset = this.userPresets().find((p) => p.id === id);
            if (preset) {
                this.api
                    .put(`/flour-blends/${cloudId}`, {
                        name: preset.name,
                        notes: preset.notes,
                        flours: preset.flours,
                        custom_hydration_adjustment: preset.customHydrationAdjustment,
                    })
                    .catch(() => {});
            }
        }
    }

    deletePreset(id: string): void {
        this.userPresets.update((p) => p.filter((pr) => pr.id !== id));
        if (this.selectedPresetId() === id) {
            this.selectedPresetId.set(null);
            this.persistSelectedPresetId();
        }
        this.savePresets();

        if (id.startsWith('cloud-')) {
            const cloudId = parseInt(id.replace('cloud-', ''), 10);
            if (this.auth.isLoggedIn()) {
                this.api.delete(`/flour-blends/${cloudId}`).catch(() => {
                    this.queuePendingDelete('flour-blend', cloudId);
                });
            } else {
                this.queuePendingDelete('flour-blend', cloudId);
            }
        }
    }

    getPresetName(id: string, lang: 'en' | 'sv'): string {
        const builtin = BUILT_IN_PRESETS.find((p) => p.id === id);
        if (builtin) return lang === 'sv' ? builtin.nameSv : builtin.nameEn;
        const user = this.userPresets().find((p) => p.id === id);
        return user?.name ?? '';
    }

    /** Upload a single local preset to cloud */
    async uploadPreset(id: string): Promise<void> {
        if (!this.auth.isLoggedIn() || id.startsWith('cloud-')) return;
        const preset = this.userPresets().find((p) => p.id === id);
        if (!preset) return;

        try {
            const res = await this.api.post<{ flour_blend: { id: number } }>('/flour-blends', {
                name: preset.name,
                notes: preset.notes,
                flours: preset.flours,
                custom_hydration_adjustment: preset.customHydrationAdjustment,
            });
            const cloudId = `cloud-${res.flour_blend.id}`;
            const now = new Date().toISOString();
            this.userPresets.update((list) =>
                list.map((p) => (p.id === id ? { ...p, id: cloudId, updatedAt: now } : p)),
            );
            if (this.selectedPresetId() === id) {
                this.selectedPresetId.set(cloudId);
                this.persistSelectedPresetId();
            }
            this.savePresets();
        } catch {
            /* keep local */
        }
    }

    /** Mark local presets as skipUpload */
    skipUploadForLocalPresets(): void {
        this.userPresets.update(
            (list) =>
                list.map((p) =>
                    !p.id.startsWith('cloud-') ? { ...p, skipUpload: true } : p,
                ) as UserFlourPreset[],
        );
        this.savePresets();
    }

    /** Remove all cloud presets on logout */
    clearCloudPresets(): void {
        const selectedId = this.selectedPresetId();
        this.userPresets.update((list) => list.filter((p) => !p.id.startsWith('cloud-')));
        if (selectedId?.startsWith('cloud-')) {
            this.selectedPresetId.set(null);
            this.persistSelectedPresetId();
        }
        this.savePresets();
    }

    // ── Pending deletes ──────────────────────────────────

    private loadPendingDeletes(): PendingDelete[] {
        try {
            const raw = localStorage.getItem(PENDING_DELETES_KEY);
            if (!raw) return [];
            return JSON.parse(raw);
        } catch {
            return [];
        }
    }

    private savePendingDeletes(deletes: PendingDelete[]): void {
        try {
            if (deletes.length === 0) {
                localStorage.removeItem(PENDING_DELETES_KEY);
            } else {
                localStorage.setItem(PENDING_DELETES_KEY, JSON.stringify(deletes));
            }
        } catch {
            /* noop */
        }
    }

    clearPendingDeletes(): void {
        const queue = this.loadPendingDeletes();
        const nonBlend = queue.filter((d) => d.type !== 'flour-blend');
        this.savePendingDeletes(nonBlend);
    }

    private queuePendingDelete(type: 'recipe' | 'flour-blend', cloudId: number): void {
        const queue = this.loadPendingDeletes();
        if (!queue.some((d) => d.type === type && d.cloudId === cloudId)) {
            queue.push({ type, cloudId, deletedAt: new Date().toISOString() });
            this.savePendingDeletes(queue);
        }
    }

    private async replayPendingDeletes(): Promise<void> {
        const queue = this.loadPendingDeletes();
        const remaining: PendingDelete[] = [];

        for (const item of queue) {
            if (item.type !== 'flour-blend') {
                remaining.push(item);
                continue;
            }
            try {
                await this.api.delete(`/flour-blends/${item.cloudId}`);
            } catch {
                remaining.push(item);
            }
        }

        this.savePendingDeletes(remaining);
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

    private loadSelectedPresetId(): string | null {
        try {
            return localStorage.getItem(SELECTED_PRESET_KEY);
        } catch {
            return null;
        }
    }

    private persistSelectedPresetId(): void {
        try {
            const id = this.selectedPresetId();
            if (id) {
                localStorage.setItem(SELECTED_PRESET_KEY, id);
            } else {
                localStorage.removeItem(SELECTED_PRESET_KEY);
            }
        } catch {
            /* noop */
        }
    }

    /** Sync local flour blend presets to cloud — last-write-wins */
    async syncToCloud(uploadLocal = true): Promise<void> {
        if (!this.auth.isLoggedIn() || this.syncing) return;
        this.syncing = true;

        try {
            // 1. Replay pending deletes
            await this.replayPendingDeletes();

            // 2. Fetch cloud list
            const cloudList = await this.api.get<ApiFlourBlend[]>('/flour-blends');

            // Build cloud map
            const cloudMap = new Map<string, { preset: UserFlourPreset; apiUpdatedAt: string }>();
            for (const b of cloudList) {
                const key = `cloud-${b.id}`;
                cloudMap.set(key, {
                    preset: {
                        id: key,
                        name: b.name,
                        flours: b.flours,
                        customHydrationAdjustment: b.custom_hydration_adjustment,
                        notes: b.notes ?? '',
                        createdAt: b.updated_at ?? new Date(0).toISOString(),
                        updatedAt: b.updated_at ?? new Date(0).toISOString(),
                    },
                    apiUpdatedAt: b.updated_at ?? new Date(0).toISOString(),
                });
            }

            const merged: UserFlourPreset[] = [];
            const processedCloudIds = new Set<string>();
            const selectedId = this.selectedPresetId();
            let newSelectedId: string | null = null;

            // 3. Process local presets
            for (const local of this.userPresets()) {
                if (local.id.startsWith('cloud-')) {
                    const cloud = cloudMap.get(local.id);
                    processedCloudIds.add(local.id);

                    if (!cloud) {
                        // Deleted on server
                        if (selectedId === local.id) newSelectedId = null;
                        continue;
                    }

                    // Last-write-wins
                    const localTime = new Date(local.updatedAt).getTime();
                    const cloudTime = new Date(cloud.apiUpdatedAt).getTime();

                    if (localTime > cloudTime) {
                        const cloudIdNum = parseInt(local.id.replace('cloud-', ''), 10);
                        try {
                            await this.api.put(`/flour-blends/${cloudIdNum}`, {
                                name: local.name,
                                notes: local.notes,
                                flours: local.flours,
                                custom_hydration_adjustment: local.customHydrationAdjustment,
                            });
                        } catch {
                            /* keep local version regardless */
                        }
                        merged.push(local);
                    } else {
                        merged.push(cloud.preset);
                    }

                    if (selectedId === local.id) newSelectedId = local.id;
                } else {
                    // Local-only preset
                    const skipUpload = (local as UserFlourPreset & { skipUpload?: boolean })
                        .skipUpload;
                    if (!uploadLocal || skipUpload) {
                        merged.push(local);
                        if (selectedId === local.id) newSelectedId = local.id;
                        continue;
                    }
                    try {
                        const res = await this.api.post<{ flour_blend: { id: number } }>(
                            '/flour-blends',
                            {
                                name: local.name,
                                notes: local.notes,
                                flours: local.flours,
                                custom_hydration_adjustment: local.customHydrationAdjustment,
                            },
                        );
                        const cloudId = `cloud-${res.flour_blend.id}`;
                        merged.push({ ...local, id: cloudId });
                        if (selectedId === local.id) newSelectedId = cloudId;
                    } catch {
                        merged.push(local);
                        if (selectedId === local.id) newSelectedId = local.id;
                    }
                }
            }

            // 4. Add cloud-only presets
            for (const [key, entry] of cloudMap) {
                if (!processedCloudIds.has(key)) {
                    merged.push(entry.preset);
                    if (selectedId === key) newSelectedId = key;
                }
            }

            // 5. Apply
            this.userPresets.set(merged);
            if (newSelectedId) {
                this.selectedPresetId.set(newSelectedId);
            } else if (selectedId && !merged.some((p) => p.id === selectedId)) {
                this.selectedPresetId.set(null);
            }
            this.savePresets();
            this.persistSelectedPresetId();
        } catch {
            // Network error — keep local state
        } finally {
            this.syncing = false;
        }
    }
}
