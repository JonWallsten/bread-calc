import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { TestBed } from "@angular/core/testing";
import { FlourBlendService } from "./flour-blend.service";
import { ApiService } from "./api.service";
import { AuthService } from "./auth.service";
import { FLOUR_DEFINITIONS, BUILT_IN_PRESETS } from "./flour.config";

describe("FlourBlendService", () => {
  let service: FlourBlendService;
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
    service = TestBed.inject(FlourBlendService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("should start with empty blend rows", () => {
    expect(service.blendRows()).toEqual([]);
    expect(service.blendActive()).toBe(false);
  });

  it("should have blendTotal 0 when empty", () => {
    expect(service.blendTotal()).toBe(0);
  });

  it("should have blendValid true when empty (no blend = valid)", () => {
    expect(service.blendValid()).toBe(true);
  });

  describe("addRow", () => {
    it("should add a flour row", () => {
      service.addRow();
      expect(service.blendRows().length).toBe(1);
      expect(service.blendActive()).toBe(true);
    });

    it("should select an available flour", () => {
      service.addRow();
      const row = service.blendRows()[0];
      expect(FLOUR_DEFINITIONS.some((f) => f.id === row.flourId)).toBe(true);
    });

    it("should add rows with percent 0", () => {
      service.addRow();
      expect(service.blendRows()[0].percent).toBe(0);
    });
  });

  describe("removeRow", () => {
    it("should remove a row by index", () => {
      service.addRow();
      service.addRow();
      expect(service.blendRows().length).toBe(2);
      service.removeRow(0);
      expect(service.blendRows().length).toBe(1);
    });
  });

  describe("updateRowFlour", () => {
    it("should change the flour ID at index", () => {
      service.addRow();
      const differentFlour = FLOUR_DEFINITIONS.find(
        (f) => f.id !== service.blendRows()[0].flourId,
      );
      if (differentFlour) {
        service.updateRowFlour(0, differentFlour.id);
        expect(service.blendRows()[0].flourId).toBe(differentFlour.id);
      }
    });
  });

  describe("updateRowPercent", () => {
    it("should update percent at index", () => {
      service.addRow();
      service.updateRowPercent(0, 50);
      expect(service.blendRows()[0].percent).toBe(50);
    });
  });

  describe("blendTotal", () => {
    it("should sum all row percentages", () => {
      service.addRow();
      service.addRow();
      service.updateRowPercent(0, 60);
      service.updateRowPercent(1, 40);
      expect(service.blendTotal()).toBe(100);
    });
  });

  describe("blendValid", () => {
    it("should be true when total is 100 and no duplicates", () => {
      service.addRow();
      service.updateRowPercent(0, 100);
      expect(service.blendValid()).toBe(true);
    });

    it("should be false when total is not 100", () => {
      service.addRow();
      service.updateRowPercent(0, 50);
      expect(service.blendValid()).toBe(false);
    });
  });

  describe("clearBlend", () => {
    it("should reset all blend state", () => {
      service.addRow();
      service.updateRowPercent(0, 100);
      expect(service.blendActive()).toBe(true);

      service.clearBlend();
      expect(service.blendRows()).toEqual([]);
      expect(service.blendActive()).toBe(false);
      expect(service.selectedPresetId()).toBeNull();
      expect(service.customHydrationAdjustment()).toBe(0);
    });
  });

  describe("presets", () => {
    it("should load a built-in preset", () => {
      if (BUILT_IN_PRESETS.length === 0) return;
      const preset = BUILT_IN_PRESETS[0];
      service.loadPreset(preset.id);
      expect(service.blendRows().length).toBe(preset.flours.length);
      expect(service.selectedPresetId()).toBe(preset.id);
      expect(service.isBuiltinPreset()).toBe(true);
    });

    it("should save a new user preset", () => {
      service.addRow();
      service.updateRowPercent(0, 100);
      service.saveAsNewPreset("My Blend", "Some notes");
      expect(service.userPresets().length).toBe(1);
      expect(service.userPresets()[0].name).toBe("My Blend");
      expect(service.selectedPresetId()).toBe(service.userPresets()[0].id);
    });

    it("should not save preset with empty name", () => {
      service.addRow();
      service.saveAsNewPreset("", "");
      expect(service.userPresets().length).toBe(0);
    });

    it("should delete a user preset", () => {
      service.addRow();
      service.updateRowPercent(0, 100);
      service.saveAsNewPreset("Delete Me", "");
      const id = service.userPresets()[0].id;
      service.deletePreset(id);
      expect(service.userPresets().length).toBe(0);
    });

    it("should update an existing user preset", () => {
      service.addRow();
      service.updateRowPercent(0, 100);
      service.saveAsNewPreset("Updatable", "");
      // Change the blend
      service.updateRowPercent(0, 80);
      service.updatePreset();
      expect(service.userPresets()[0].flours[0].percent).toBe(80);
    });

    it("should persist presets to localStorage", () => {
      service.addRow();
      service.updateRowPercent(0, 100);
      service.saveAsNewPreset("Stored", "");
      const stored = localStorage.getItem("breadCalcUserFlourPresets");
      expect(stored).toBeTruthy();
      expect(JSON.parse(stored!)[0].name).toBe("Stored");
    });
  });

  describe("syncToCloud", () => {
    it("should not sync when not logged in", async () => {
      const getSpy = vi.spyOn(apiService, "get");
      await service.syncToCloud();
      expect(getSpy).not.toHaveBeenCalled();
    });

    it("should merge cloud and local presets on sync", async () => {
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

      // Add a local preset
      service.addRow();
      service.updateRowPercent(0, 100);
      service.saveAsNewPreset("Local Blend", "notes");

      // Mock API responses
      vi.spyOn(apiService, "get").mockResolvedValue({
        flour_blends: [
          {
            id: 5,
            name: "Cloud Blend",
            notes: "",
            flours: [{ flourId: "bread", percent: 100 }],
            custom_hydration_adjustment: 0,
          },
        ],
      });
      vi.spyOn(apiService, "post").mockResolvedValue({
        flour_blend: { id: 15 },
      });

      await service.syncToCloud();

      const presets = service.userPresets();
      expect(presets.some((p) => p.name === "Cloud Blend")).toBe(true);
      expect(presets.some((p) => p.id.startsWith("cloud-"))).toBe(true);
    });
  });
});
