import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { TestBed } from "@angular/core/testing";
import { FlourBlendService } from "./flour-blend.service";
import { ApiService } from "./api.service";
import { AuthService } from "./auth.service";
import { FLOUR_DEFINITIONS, BUILT_IN_PRESETS } from "./flour.config";

async function loginUser(authService: AuthService): Promise<void> {
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            token: "jwt",
            user: { id: 1, email: "a@b.com", name: "A", picture_url: null },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        ),
      ),
    ),
  );
  await authService.loginWithGoogle("token");
}

describe("FlourBlendService", () => {
  let service: FlourBlendService;
  let authService: AuthService;
  let apiService: ApiService;

  function resetServices(): void {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({});
    authService = TestBed.inject(AuthService);
    apiService = TestBed.inject(ApiService);
    service = TestBed.inject(FlourBlendService);
  }

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

    it("should persist selectedPresetId to localStorage", () => {
      service.addRow();
      service.updateRowPercent(0, 100);
      service.saveAsNewPreset("Persist ID", "");
      const stored = localStorage.getItem("breadCalcSelectedPreset");
      expect(stored).toBe(service.selectedPresetId());
    });
  });

  describe("CRUD with API (logged in)", () => {
    it("saveAsNewPreset should call POST when logged in", async () => {
      await loginUser(authService);

      const postSpy = vi.spyOn(apiService, "post").mockResolvedValue({
        flour_blend: { id: 30 },
      });

      service.addRow();
      service.updateRowPercent(0, 100);
      service.saveAsNewPreset("API Blend", "notes");

      // Wait for the fire-and-forget promise
      await vi.waitFor(() => expect(postSpy).toHaveBeenCalled());

      expect(postSpy).toHaveBeenCalledWith(
        "/flour-blends",
        expect.objectContaining({ name: "API Blend" }),
      );
    });

    it("updatePreset should call PUT for cloud preset when logged in", async () => {
      // Seed a cloud preset
      localStorage.setItem(
        "breadCalcUserFlourPresets",
        JSON.stringify([
          {
            id: "cloud-20",
            name: "Cloud P",
            flours: [{ flourId: "tipo_00", percent: 100 }],
            customHydrationAdjustment: 0,
            notes: "",
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-01-01T00:00:00Z",
          },
        ]),
      );
      localStorage.setItem("breadCalcSelectedPreset", "cloud-20");
      resetServices();
      await loginUser(authService);

      // Load the preset and change it
      service.loadPreset("cloud-20");
      service.updateRowPercent(0, 80);

      const putSpy = vi.spyOn(apiService, "put").mockResolvedValue({});
      service.updatePreset();

      expect(putSpy).toHaveBeenCalledWith(
        "/flour-blends/20",
        expect.objectContaining({ name: "Cloud P" }),
      );
    });

    it("deletePreset should call DELETE for cloud preset when logged in", async () => {
      localStorage.setItem(
        "breadCalcUserFlourPresets",
        JSON.stringify([
          {
            id: "cloud-25",
            name: "Del Cloud",
            flours: [],
            customHydrationAdjustment: 0,
            notes: "",
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-01-01T00:00:00Z",
          },
        ]),
      );
      resetServices();
      await loginUser(authService);

      const deleteSpy = vi
        .spyOn(apiService, "delete")
        .mockResolvedValue(undefined);
      service.deletePreset("cloud-25");

      expect(deleteSpy).toHaveBeenCalledWith("/flour-blends/25");
    });

    it("deletePreset should queue pending delete when offline", () => {
      // Not logged in — delete a cloud preset
      localStorage.setItem(
        "breadCalcUserFlourPresets",
        JSON.stringify([
          {
            id: "cloud-30",
            name: "Offline Del",
            flours: [],
            customHydrationAdjustment: 0,
            notes: "",
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-01-01T00:00:00Z",
          },
        ]),
      );
      resetServices();

      service.deletePreset("cloud-30");

      const pending = JSON.parse(
        localStorage.getItem("breadCalcPendingDeletes") ?? "[]",
      );
      expect(
        pending.some(
          (d: { type: string; cloudId: number }) =>
            d.type === "flour-blend" && d.cloudId === 30,
        ),
      ).toBe(true);
    });
  });

  describe("clearCloudPresets", () => {
    it("should remove cloud presets and keep local ones", () => {
      service.addRow();
      service.updateRowPercent(0, 100);
      service.saveAsNewPreset("Local P", "");

      localStorage.setItem(
        "breadCalcUserFlourPresets",
        JSON.stringify([
          ...service.userPresets(),
          {
            id: "cloud-40",
            name: "Cloud P",
            flours: [],
            customHydrationAdjustment: 0,
            notes: "",
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-01-01T00:00:00Z",
          },
        ]),
      );
      resetServices();

      service.clearCloudPresets();

      expect(service.userPresets().some((p) => p.name === "Local P")).toBe(
        true,
      );
      expect(service.userPresets().some((p) => p.id.startsWith("cloud-"))).toBe(
        false,
      );
    });

    it("should clear selectedPresetId if it was cloud", () => {
      localStorage.setItem(
        "breadCalcUserFlourPresets",
        JSON.stringify([
          {
            id: "cloud-40",
            name: "Cloud P",
            flours: [],
            customHydrationAdjustment: 0,
            notes: "",
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-01-01T00:00:00Z",
          },
        ]),
      );
      localStorage.setItem("breadCalcSelectedPreset", "cloud-40");
      resetServices();

      service.clearCloudPresets();
      expect(service.selectedPresetId()).toBeNull();
    });
  });

  describe("syncToCloud", () => {
    it("should not sync when not logged in", async () => {
      const getSpy = vi.spyOn(apiService, "get");
      await service.syncToCloud();
      expect(getSpy).not.toHaveBeenCalled();
    });

    it("should merge cloud and local presets on sync", async () => {
      service.addRow();
      service.updateRowPercent(0, 100);
      service.saveAsNewPreset("Local Blend", "notes");

      await loginUser(authService);

      vi.spyOn(apiService, "get").mockResolvedValue([
        {
          id: 5,
          name: "Cloud Blend",
          notes: "",
          flours: [{ flourId: "bread", percent: 100 }],
          custom_hydration_adjustment: 0,
          updated_at: "2025-01-01T00:00:00Z",
        },
      ]);
      vi.spyOn(apiService, "post").mockResolvedValue({
        flour_blend: { id: 15 },
      });

      await service.syncToCloud();

      const presets = service.userPresets();
      expect(presets.some((p) => p.name === "Cloud Blend")).toBe(true);
      expect(presets.some((p) => p.id.startsWith("cloud-"))).toBe(true);
    });

    it("should keep local presets if upload fails", async () => {
      service.addRow();
      service.updateRowPercent(0, 100);
      service.saveAsNewPreset("Offline Blend", "notes");

      await loginUser(authService);

      vi.spyOn(apiService, "get").mockResolvedValue([]);
      vi.spyOn(apiService, "post").mockRejectedValue(new Error("Network"));

      await service.syncToCloud();

      const presets = service.userPresets();
      expect(presets.some((p) => p.name === "Offline Blend")).toBe(true);
    });

    it("should not duplicate cloud presets on repeated sync", async () => {
      await loginUser(authService);

      vi.spyOn(apiService, "get").mockResolvedValue([
        {
          id: 5,
          name: "Cloud Blend",
          notes: "",
          flours: [{ flourId: "bread", percent: 100 }],
          custom_hydration_adjustment: 0,
        },
      ]);

      await service.syncToCloud();
      await service.syncToCloud();

      const presets = service.userPresets();
      const cloudOnes = presets.filter((p) => p.name === "Cloud Blend");
      expect(cloudOnes.length).toBe(1);
    });

    it("should use last-write-wins: local newer pushes to cloud", async () => {
      localStorage.setItem(
        "breadCalcUserFlourPresets",
        JSON.stringify([
          {
            id: "cloud-10",
            name: "Local Version",
            flours: [{ flourId: "tipo_00", percent: 100 }],
            customHydrationAdjustment: 1,
            notes: "local",
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-06-01T00:00:00.000Z",
          },
        ]),
      );
      resetServices();
      await loginUser(authService);

      vi.spyOn(apiService, "get").mockResolvedValue([
        {
          id: 10,
          name: "Cloud Version",
          notes: "cloud",
          flours: [{ flourId: "strong_bread", percent: 100 }],
          custom_hydration_adjustment: 0,
          updated_at: "2025-01-01T00:00:00.000Z",
        },
      ]);
      const putSpy = vi.spyOn(apiService, "put").mockResolvedValue({});

      await service.syncToCloud();

      expect(putSpy).toHaveBeenCalledWith(
        "/flour-blends/10",
        expect.objectContaining({ name: "Local Version" }),
      );
      const preset = service.userPresets().find((p) => p.id === "cloud-10");
      expect(preset?.name).toBe("Local Version");
    });

    it("should use last-write-wins: cloud newer replaces local", async () => {
      localStorage.setItem(
        "breadCalcUserFlourPresets",
        JSON.stringify([
          {
            id: "cloud-10",
            name: "Old Local",
            flours: [{ flourId: "tipo_00", percent: 100 }],
            customHydrationAdjustment: 0,
            notes: "",
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-01-01T00:00:00.000Z",
          },
        ]),
      );
      resetServices();
      await loginUser(authService);

      vi.spyOn(apiService, "get").mockResolvedValue([
        {
          id: 10,
          name: "Newer Cloud",
          notes: "updated",
          flours: [{ flourId: "rye_flour", percent: 100 }],
          custom_hydration_adjustment: 2,
          updated_at: "2025-06-01T00:00:00.000Z",
        },
      ]);

      await service.syncToCloud();

      const preset = service.userPresets().find((p) => p.id === "cloud-10");
      expect(preset?.name).toBe("Newer Cloud");
    });

    it("should remove locally if preset deleted on server", async () => {
      localStorage.setItem(
        "breadCalcUserFlourPresets",
        JSON.stringify([
          {
            id: "cloud-10",
            name: "Server Deleted",
            flours: [],
            customHydrationAdjustment: 0,
            notes: "",
            createdAt: "2025-01-01T00:00:00Z",
            updatedAt: "2025-01-01T00:00:00Z",
          },
        ]),
      );
      resetServices();
      await loginUser(authService);

      vi.spyOn(apiService, "get").mockResolvedValue([]);

      await service.syncToCloud();

      expect(service.userPresets().length).toBe(0);
    });

    it("should replay pending deletes at start of sync", async () => {
      localStorage.setItem(
        "breadCalcPendingDeletes",
        JSON.stringify([
          {
            type: "flour-blend",
            cloudId: 77,
            deletedAt: "2025-01-01T00:00:00Z",
          },
        ]),
      );
      await loginUser(authService);

      const deleteSpy = vi
        .spyOn(apiService, "delete")
        .mockResolvedValue(undefined);
      vi.spyOn(apiService, "get").mockResolvedValue([]);

      await service.syncToCloud();

      expect(deleteSpy).toHaveBeenCalledWith("/flour-blends/77");
      const pending = JSON.parse(
        localStorage.getItem("breadCalcPendingDeletes") ?? "[]",
      );
      expect(pending.some((d: { cloudId: number }) => d.cloudId === 77)).toBe(
        false,
      );
    });

    it("should not upload presets when uploadLocal is false", async () => {
      service.addRow();
      service.updateRowPercent(0, 100);
      service.saveAsNewPreset("Keep Local", "");

      await loginUser(authService);

      vi.spyOn(apiService, "get").mockResolvedValue([]);
      const postSpy = vi.spyOn(apiService, "post");

      await service.syncToCloud(false);

      expect(postSpy).not.toHaveBeenCalled();
      expect(service.userPresets()[0].id).toMatch(/^preset_/);
    });

    it("should not re-enter sync while already syncing", async () => {
      await loginUser(authService);

      let getCallCount = 0;
      vi.spyOn(apiService, "get").mockImplementation(async () => {
        getCallCount++;
        await new Promise((r) => setTimeout(r, 50));
        return [];
      });

      const p1 = service.syncToCloud();
      const p2 = service.syncToCloud();
      await Promise.all([p1, p2]);

      expect(getCallCount).toBe(1);
    });
  });

  describe("uploadPreset", () => {
    it("should upload a local preset to cloud", async () => {
      service.addRow();
      service.updateRowPercent(0, 100);
      service.saveAsNewPreset("Upload Me", "");
      const presetId = service.userPresets()[0].id;

      await loginUser(authService);

      vi.spyOn(apiService, "post").mockResolvedValue({
        flour_blend: { id: 50 },
      });

      await service.uploadPreset(presetId);

      const uploaded = service.userPresets().find((p) => p.id === "cloud-50");
      expect(uploaded?.name).toBe("Upload Me");
    });

    it("should not upload if already a cloud preset", async () => {
      await loginUser(authService);

      const postSpy = vi.spyOn(apiService, "post");
      await service.uploadPreset("cloud-10");
      expect(postSpy).not.toHaveBeenCalled();
    });
  });
});
