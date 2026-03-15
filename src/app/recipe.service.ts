import { Injectable, signal, computed } from "@angular/core";
import { Recipe, BUILT_IN_RECIPES } from "./recipe-presets";
import { CalcInputs } from "./calc.service";

const STORAGE_KEY = "breadCalcUserRecipes";
const ACTIVE_KEY = "breadCalcActiveRecipe";

@Injectable({ providedIn: "root" })
export class RecipeService {
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
    return recipe;
  }

  updateRecipe(id: string, inputs: CalcInputs): void {
    this.userRecipes.update((list) =>
      list.map((r) => (r.id === id ? { ...r, inputs: { ...inputs } } : r)),
    );
    this.persistUserRecipes();
  }

  deleteRecipe(id: string): void {
    this.userRecipes.update((list) => list.filter((r) => r.id !== id));
    if (this.activeRecipeId() === id) {
      this.activeRecipeId.set(null);
    }
    this.persistUserRecipes();
    this.persistActiveId();
  }

  renameRecipe(id: string, name: string): void {
    this.userRecipes.update((list) =>
      list.map((r) => (r.id === id ? { ...r, name } : r)),
    );
    this.persistUserRecipes();
  }

  clearActive(): void {
    this.activeRecipeId.set(null);
    this.persistActiveId();
  }
}
