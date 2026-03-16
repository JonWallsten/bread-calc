import { Injectable, signal, computed, inject } from "@angular/core";
import { Recipe, BUILT_IN_RECIPES } from "./recipe-presets";
import { CalcInputs } from "./calc.service";
import { AuthService } from "./auth.service";
import { ApiService } from "./api.service";

const STORAGE_KEY = "breadCalcUserRecipes";
const ACTIVE_KEY = "breadCalcActiveRecipe";
const PENDING_DELETES_KEY = "breadCalcPendingDeletes";

interface ApiRecipe {
  id: number;
  name: string;
  inputs: CalcInputs;
  is_default: number;
  updated_at?: string;
}

export interface PendingDelete {
  type: "recipe" | "flour-blend";
  cloudId: number;
  deletedAt: string;
}

@Injectable({ providedIn: "root" })
export class RecipeService {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);

  private readonly userRecipes = signal<Recipe[]>(this.loadUserRecipes());
  private readonly activeRecipeId = signal<string | null>(this.loadActiveId());
  private syncing = false;

  readonly allRecipes = computed(() => [
    ...BUILT_IN_RECIPES,
    ...this.userRecipes(),
  ]);

  readonly activeId = this.activeRecipeId.asReadonly();

  readonly activeRecipe = computed(() => {
    const id = this.activeRecipeId();
    if (!id) return null;
    return this.allRecipes().find((r) => r.id === id) ?? null;
  });

  /** True when there are local-only recipes that haven't been skipped */
  readonly hasUploadableRecipes = computed(() =>
    this.userRecipes().some((r) => !r.id.startsWith("cloud-") && !r.skipUpload),
  );

  /** Count of uploadable local-only recipes */
  readonly uploadableRecipeCount = computed(
    () =>
      this.userRecipes().filter(
        (r) => !r.id.startsWith("cloud-") && !r.skipUpload,
      ).length,
  );

  private loadUserRecipes(): Recipe[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch {
      return [];
    }
  }

  private loadActiveId(): string | null {
    try {
      return localStorage.getItem(ACTIVE_KEY);
    } catch {
      return null;
    }
  }

  private persistUserRecipes(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.userRecipes()));
    } catch {
      /* storage full or unavailable */
    }
  }

  private persistActiveId(): void {
    try {
      const id = this.activeRecipeId();
      if (id) {
        localStorage.setItem(ACTIVE_KEY, id);
      } else {
        localStorage.removeItem(ACTIVE_KEY);
      }
    } catch {
      /* noop */
    }
  }

  // ── Pending deletes queue ────────────────────────────

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
    this.savePendingDeletes([]);
  }

  // ── CRUD methods ─────────────────────────────────────

  setActive(id: string | null): void {
    this.activeRecipeId.set(id);
    this.persistActiveId();
  }

  saveRecipe(name: string, inputs: CalcInputs): Recipe {
    const now = new Date().toISOString();
    const recipe: Recipe = {
      id: `user-${Date.now()}`,
      name,
      builtIn: false,
      inputs: { ...inputs },
      updatedAt: now,
    };
    this.userRecipes.update((list) => [...list, recipe]);
    this.activeRecipeId.set(recipe.id);
    this.persistUserRecipes();
    this.persistActiveId();

    if (this.auth.isLoggedIn()) {
      this.api.post<{ recipe: ApiRecipe }>("/recipes", { name, inputs }).then(
        (res) => {
          const cloudId = `cloud-${res.recipe.id}`;
          this.userRecipes.update((list) =>
            list.map((r) =>
              r.id === recipe.id ? { ...r, id: cloudId, updatedAt: now } : r,
            ),
          );
          if (this.activeRecipeId() === recipe.id) {
            this.activeRecipeId.set(cloudId);
            this.persistActiveId();
          }
          this.persistUserRecipes();
        },
        () => {
          /* fallback to local */
        },
      );
    }

    return recipe;
  }

  updateRecipe(id: string, inputs: CalcInputs): void {
    const now = new Date().toISOString();
    this.userRecipes.update((list) =>
      list.map((r) =>
        r.id === id ? { ...r, inputs: { ...inputs }, updatedAt: now } : r,
      ),
    );
    this.persistUserRecipes();

    if (this.auth.isLoggedIn() && id.startsWith("cloud-")) {
      const cloudId = parseInt(id.replace("cloud-", ""), 10);
      this.api.put(`/recipes/${cloudId}`, { inputs }).catch(() => {});
    }
  }

  deleteRecipe(id: string): void {
    this.userRecipes.update((list) => list.filter((r) => r.id !== id));
    if (this.activeRecipeId() === id) {
      this.activeRecipeId.set(null);
    }
    this.persistUserRecipes();
    this.persistActiveId();

    if (id.startsWith("cloud-")) {
      const cloudId = parseInt(id.replace("cloud-", ""), 10);
      if (this.auth.isLoggedIn()) {
        this.api.delete(`/recipes/${cloudId}`).catch(() => {
          this.queuePendingDelete("recipe", cloudId);
        });
      } else {
        this.queuePendingDelete("recipe", cloudId);
      }
    }
  }

  renameRecipe(id: string, name: string): void {
    const now = new Date().toISOString();
    this.userRecipes.update((list) =>
      list.map((r) => (r.id === id ? { ...r, name, updatedAt: now } : r)),
    );
    this.persistUserRecipes();

    if (this.auth.isLoggedIn() && id.startsWith("cloud-")) {
      const cloudId = parseInt(id.replace("cloud-", ""), 10);
      this.api.put(`/recipes/${cloudId}`, { name }).catch(() => {});
    }
  }

  clearActive(): void {
    this.activeRecipeId.set(null);
    this.persistActiveId();
  }

  /** Upload a single local recipe to cloud */
  async uploadRecipe(id: string): Promise<void> {
    if (!this.auth.isLoggedIn() || id.startsWith("cloud-")) return;
    const recipe = this.userRecipes().find((r) => r.id === id);
    if (!recipe) return;

    try {
      const res = await this.api.post<{ recipe: ApiRecipe }>("/recipes", {
        name: recipe.name,
        inputs: recipe.inputs,
      });
      const cloudId = `cloud-${res.recipe.id}`;
      const now = new Date().toISOString();
      this.userRecipes.update((list) =>
        list.map((r) =>
          r.id === id
            ? { ...r, id: cloudId, updatedAt: now, skipUpload: undefined }
            : r,
        ),
      );
      if (this.activeRecipeId() === id) {
        this.activeRecipeId.set(cloudId);
        this.persistActiveId();
      }
      this.persistUserRecipes();
    } catch {
      /* keep local */
    }
  }

  /** Mark local recipes as skipUpload so they won't be prompted again */
  skipUploadForLocalRecipes(): void {
    this.userRecipes.update((list) =>
      list.map((r) =>
        !r.id.startsWith("cloud-") && !r.skipUpload
          ? { ...r, skipUpload: true }
          : r,
      ),
    );
    this.persistUserRecipes();
  }

  /** Remove all cloud recipes on logout */
  clearCloudRecipes(): void {
    const activeId = this.activeRecipeId();
    this.userRecipes.update((list) =>
      list.filter((r) => !r.id.startsWith("cloud-")),
    );
    if (activeId?.startsWith("cloud-")) {
      this.activeRecipeId.set(null);
    }
    this.persistUserRecipes();
    this.persistActiveId();
  }

  // ── Sync ─────────────────────────────────────────────

  private queuePendingDelete(
    type: "recipe" | "flour-blend",
    cloudId: number,
  ): void {
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
      if (item.type !== "recipe") {
        remaining.push(item);
        continue;
      }
      try {
        await this.api.delete(`/recipes/${item.cloudId}`);
      } catch {
        remaining.push(item);
      }
    }

    this.savePendingDeletes(remaining);
  }

  /** Sync local recipes to cloud — last-write-wins by updatedAt */
  async syncToCloud(uploadLocal = true): Promise<void> {
    if (!this.auth.isLoggedIn() || this.syncing) return;
    this.syncing = true;

    try {
      // 1. Replay pending deletes
      await this.replayPendingDeletes();

      // 2. Fetch cloud list
      const cloudList = await this.api.get<ApiRecipe[]>("/recipes");

      const activeId = this.activeRecipeId();
      let newActiveId: string | null = null;

      // Build a map of cloud recipes by their cloud-{id} key
      const cloudMap = new Map<
        string,
        { recipe: Recipe; apiUpdatedAt: string }
      >();
      for (const cr of cloudList) {
        const key = `cloud-${cr.id}`;
        cloudMap.set(key, {
          recipe: {
            id: key,
            name: cr.name,
            builtIn: false,
            inputs: cr.inputs,
            updatedAt: cr.updated_at ?? new Date(0).toISOString(),
          },
          apiUpdatedAt: cr.updated_at ?? new Date(0).toISOString(),
        });
      }

      const merged: Recipe[] = [];
      const processedCloudIds = new Set<string>();

      // 3. Process local recipes
      for (const local of this.userRecipes()) {
        if (local.id.startsWith("cloud-")) {
          // Existing cloud recipe — check for conflict
          const cloud = cloudMap.get(local.id);
          processedCloudIds.add(local.id);

          if (!cloud) {
            // Deleted on server — remove locally
            if (activeId === local.id) newActiveId = null;
            continue;
          }

          // Last-write-wins
          const localTime = new Date(
            local.updatedAt ?? new Date(0).toISOString(),
          ).getTime();
          const cloudTime = new Date(cloud.apiUpdatedAt).getTime();

          if (localTime > cloudTime) {
            // Local is newer — push to cloud
            const cloudIdNum = parseInt(local.id.replace("cloud-", ""), 10);
            try {
              await this.api.put(`/recipes/${cloudIdNum}`, {
                name: local.name,
                inputs: local.inputs,
              });
            } catch {
              /* keep local version regardless */
            }
            merged.push(local);
          } else {
            // Cloud is newer or equal — use cloud version
            merged.push(cloud.recipe);
          }

          if (activeId === local.id) newActiveId = local.id;
        } else {
          // Local-only recipe
          if (!uploadLocal || local.skipUpload) {
            // Keep as-is
            merged.push(local);
            if (activeId === local.id) newActiveId = local.id;
            continue;
          }
          // Try uploading
          try {
            const res = await this.api.post<{ recipe: ApiRecipe }>("/recipes", {
              name: local.name,
              inputs: local.inputs,
            });
            const cloudId = `cloud-${res.recipe.id}`;
            merged.push({
              ...local,
              id: cloudId,
              updatedAt: new Date().toISOString(),
              skipUpload: undefined,
            });
            if (activeId === local.id) newActiveId = cloudId;
          } catch {
            merged.push(local);
            if (activeId === local.id) newActiveId = local.id;
          }
        }
      }

      // 4. Add cloud-only recipes (not already processed)
      for (const [key, entry] of cloudMap) {
        if (!processedCloudIds.has(key)) {
          merged.push(entry.recipe);
          if (activeId === key) newActiveId = key;
        }
      }

      // 5. Apply merged state
      this.userRecipes.set(merged);

      // Preserve active selection
      if (newActiveId) {
        this.activeRecipeId.set(newActiveId);
      } else if (activeId && !merged.some((r) => r.id === activeId)) {
        // Active recipe was removed during sync
        this.activeRecipeId.set(null);
      }

      this.persistUserRecipes();
      this.persistActiveId();
    } catch {
      // Network error — keep local state
    } finally {
      this.syncing = false;
    }
  }
}
