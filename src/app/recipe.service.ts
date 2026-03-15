import { Injectable, signal, computed, inject } from "@angular/core";
import { Recipe, BUILT_IN_RECIPES } from "./recipe-presets";
import { CalcInputs } from "./calc.service";
import { AuthService } from "./auth.service";
import { ApiService } from "./api.service";

const STORAGE_KEY = "breadCalcUserRecipes";
const ACTIVE_KEY = "breadCalcActiveRecipe";

interface ApiRecipe {
  id: number;
  name: string;
  inputs: CalcInputs;
  is_default: number;
}

@Injectable({ providedIn: "root" })
export class RecipeService {
  private readonly auth = inject(AuthService);
  private readonly api = inject(ApiService);

  private readonly userRecipes = signal<Recipe[]>(this.loadUserRecipes());
  private readonly activeRecipeId = signal<string | null>(this.loadActiveId());

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

  setActive(id: string | null): void {
    this.activeRecipeId.set(id);
    this.persistActiveId();
  }

  saveRecipe(name: string, inputs: CalcInputs): Recipe {
    const recipe: Recipe = {
      id: `user-${Date.now()}`,
      name,
      builtIn: false,
      inputs: { ...inputs },
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
            list.map((r) => (r.id === recipe.id ? { ...r, id: cloudId } : r)),
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
    this.userRecipes.update((list) =>
      list.map((r) => (r.id === id ? { ...r, inputs: { ...inputs } } : r)),
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

    if (this.auth.isLoggedIn() && id.startsWith("cloud-")) {
      const cloudId = parseInt(id.replace("cloud-", ""), 10);
      this.api.delete(`/recipes/${cloudId}`).catch(() => {});
    }
  }

  renameRecipe(id: string, name: string): void {
    this.userRecipes.update((list) =>
      list.map((r) => (r.id === id ? { ...r, name } : r)),
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

  /** Sync local recipes to cloud on login */
  async syncToCloud(): Promise<void> {
    if (!this.auth.isLoggedIn()) return;

    try {
      const data = await this.api.get<{ recipes: ApiRecipe[] }>("/recipes");
      const cloudRecipes: Recipe[] = data.recipes.map((r) => ({
        id: `cloud-${r.id}`,
        name: r.name,
        builtIn: false,
        inputs: r.inputs,
      }));

      // Upload any local-only recipes
      const localOnly = this.userRecipes().filter(
        (r) => !r.id.startsWith("cloud-"),
      );
      for (const local of localOnly) {
        try {
          const res = await this.api.post<{ recipe: ApiRecipe }>("/recipes", {
            name: local.name,
            inputs: local.inputs,
          });
          cloudRecipes.push({
            id: `cloud-${res.recipe.id}`,
            name: local.name,
            builtIn: false,
            inputs: local.inputs,
          });
        } catch {
          cloudRecipes.push(local);
        }
      }

      this.userRecipes.set(cloudRecipes);
      this.persistUserRecipes();
    } catch {
      // Network error — keep local state
    }
  }
}
