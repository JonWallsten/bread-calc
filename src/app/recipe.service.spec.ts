import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { TestBed } from "@angular/core/testing";
import { RecipeService } from "./recipe.service";
import { ApiService } from "./api.service";
import { AuthService } from "./auth.service";
import { DEFAULT_INPUTS } from "./config";

describe("RecipeService", () => {
  let service: RecipeService;
  let authService: AuthService;
  let apiService: ApiService;

  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.resolve(new Response(null, { status: 401 }))),
    );

    TestBed.configureTestingModule({});
    authService = TestBed.inject(AuthService);
    apiService = TestBed.inject(ApiService);
    service = TestBed.inject(RecipeService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("should include built-in recipes", () => {
    expect(service.allRecipes().length).toBeGreaterThan(0);
    expect(service.allRecipes().some((r) => r.builtIn)).toBe(true);
  });

  it("should start with no active recipe", () => {
    expect(service.activeId()).toBeNull();
    expect(service.activeRecipe()).toBeNull();
  });

  describe("saveRecipe", () => {
    it("should add a new user recipe", () => {
      const before = service.allRecipes().length;
      service.saveRecipe("My Recipe", { ...DEFAULT_INPUTS });
      expect(service.allRecipes().length).toBe(before + 1);
    });

    it("should set the new recipe as active", () => {
      const recipe = service.saveRecipe("Active Test", { ...DEFAULT_INPUTS });
      expect(service.activeId()).toBe(recipe.id);
      expect(service.activeRecipe()?.name).toBe("Active Test");
    });

    it("should persist to localStorage", () => {
      service.saveRecipe("Persist Test", { ...DEFAULT_INPUTS });
      const stored = localStorage.getItem("breadCalcUserRecipes");
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored!);
      expect(
        parsed.some((r: { name: string }) => r.name === "Persist Test"),
      ).toBe(true);
    });

    it("should give user recipe a user- prefixed id", () => {
      const recipe = service.saveRecipe("ID Test", { ...DEFAULT_INPUTS });
      expect(recipe.id).toMatch(/^user-/);
    });
  });

  describe("updateRecipe", () => {
    it("should update recipe inputs", () => {
      const recipe = service.saveRecipe("Update Test", { ...DEFAULT_INPUTS });
      const newInputs = { ...DEFAULT_INPUTS, hydrationPct: 70 };
      service.updateRecipe(recipe.id, newInputs);

      const updated = service.allRecipes().find((r) => r.id === recipe.id);
      expect(updated?.inputs.hydrationPct).toBe(70);
    });
  });

  describe("deleteRecipe", () => {
    it("should remove recipe from list", () => {
      const recipe = service.saveRecipe("Delete Test", { ...DEFAULT_INPUTS });
      const beforeCount = service.allRecipes().length;
      service.deleteRecipe(recipe.id);
      expect(service.allRecipes().length).toBe(beforeCount - 1);
    });

    it("should clear active if deleted recipe was active", () => {
      const recipe = service.saveRecipe("Active Del", { ...DEFAULT_INPUTS });
      expect(service.activeId()).toBe(recipe.id);
      service.deleteRecipe(recipe.id);
      expect(service.activeId()).toBeNull();
    });
  });

  describe("renameRecipe", () => {
    it("should update recipe name", () => {
      const recipe = service.saveRecipe("Old Name", { ...DEFAULT_INPUTS });
      service.renameRecipe(recipe.id, "New Name");
      const updated = service.allRecipes().find((r) => r.id === recipe.id);
      expect(updated?.name).toBe("New Name");
    });
  });

  describe("setActive / clearActive", () => {
    it("should change active recipe", () => {
      const recipe = service.saveRecipe("Set Active", { ...DEFAULT_INPUTS });
      service.clearActive();
      expect(service.activeId()).toBeNull();
      service.setActive(recipe.id);
      expect(service.activeId()).toBe(recipe.id);
    });

    it("should persist active id", () => {
      const recipe = service.saveRecipe("Persist Active", {
        ...DEFAULT_INPUTS,
      });
      service.setActive(recipe.id);
      expect(localStorage.getItem("breadCalcActiveRecipe")).toBe(recipe.id);
    });
  });

  describe("syncToCloud", () => {
    it("should not sync when not logged in", async () => {
      const getSpy = vi.spyOn(apiService, "get");
      await service.syncToCloud();
      expect(getSpy).not.toHaveBeenCalled();
    });

    it("should fetch recipes and merge when logged in", async () => {
      // Login
      vi.stubGlobal(
        "fetch",
        vi.fn(() =>
          Promise.resolve(
            new Response(
              JSON.stringify({
                token: "jwt",
                user: {
                  id: 1,
                  email: "a@b.com",
                  name: "A",
                  picture_url: null,
                },
              }),
              { status: 200, headers: { "Content-Type": "application/json" } },
            ),
          ),
        ),
      );
      await authService.loginWithGoogle("token");

      // Mock API to return cloud recipes
      vi.spyOn(apiService, "get").mockResolvedValue({
        recipes: [
          {
            id: 10,
            name: "Cloud Recipe",
            inputs: DEFAULT_INPUTS,
            is_default: 0,
          },
        ],
      });
      vi.spyOn(apiService, "post").mockResolvedValue({
        recipe: {
          id: 20,
          name: "Uploaded",
          inputs: DEFAULT_INPUTS,
          is_default: 0,
        },
      });

      // Add a local recipe before sync
      service.saveRecipe("Local Only", { ...DEFAULT_INPUTS });

      await service.syncToCloud();

      const userRecipes = service.allRecipes().filter((r) => !r.builtIn);
      // Should have cloud recipe + uploaded local
      expect(userRecipes.some((r) => r.name === "Cloud Recipe")).toBe(true);
      expect(userRecipes.some((r) => r.id.startsWith("cloud-"))).toBe(true);
    });
  });
});
