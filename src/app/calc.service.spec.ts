import { describe, it, expect } from "vitest";
import { CalcService, CalcInputs, CalcResult } from "./calc.service";
import { DEFAULT_INPUTS } from "./config";

const service = new CalcService();

const calc = (
  overrides: Partial<CalcInputs> = {},
): CalcResult & { error?: string } => {
  return service.calculate({ ...DEFAULT_INPUTS, ...overrides }) as any;
};

const approx = (a: number, b: number, tol = 0.5): boolean =>
  Math.abs(a - b) <= tol;

describe("Helper functions", () => {
  it("clamp: within range", () => expect(service.clamp(5, 1, 10)).toBe(5));
  it("clamp: below min", () => expect(service.clamp(-1, 0, 10)).toBe(0));
  it("clamp: above max", () => expect(service.clamp(20, 0, 10)).toBe(10));
  it("round1: 3.14159 → 3.1", () => expect(service.round1(3.14159)).toBe(3.1));
  it("round1: 2.05 → 2.1", () => expect(service.round1(2.05)).toBe(2.1));
  it("round1: 0 → 0", () => expect(service.round1(0)).toBe(0));
});

describe("Yeast baseline", () => {
  it("2h → 2.8%", () => expect(service.yeastBaseline(2)).toBe(2.8));
  it("3h → 2.8%", () => expect(service.yeastBaseline(3)).toBe(2.8));
  it("4h → 2.0%", () => expect(service.yeastBaseline(4)).toBe(2.0));
  it("5h → 1.5%", () => expect(service.yeastBaseline(5)).toBe(1.5));
  it("6h → 1.1%", () => expect(service.yeastBaseline(6)).toBe(1.1));
  it("7h → 0.85%", () => expect(service.yeastBaseline(7)).toBe(0.85));
  it("8h → 0.65%", () => expect(service.yeastBaseline(8)).toBe(0.65));
  it("9h → 0.5%", () => expect(service.yeastBaseline(9)).toBe(0.5));
  it("10h → 0.4%", () => expect(service.yeastBaseline(10)).toBe(0.4));
  it("12h → 0.3%", () => expect(service.yeastBaseline(12)).toBe(0.3));
  it("15h → 0.2%", () => expect(service.yeastBaseline(15)).toBe(0.2));
  it("24h → 0.2%", () => expect(service.yeastBaseline(24)).toBe(0.2));
});

describe("Water temperature", () => {
  it("30°C → 12–14", () => expect(service.waterTempRange(30)).toBe("12–14 °C"));
  it("27°C → 12–14", () => expect(service.waterTempRange(27)).toBe("12–14 °C"));
  it("25°C → 14–16", () => expect(service.waterTempRange(25)).toBe("14–16 °C"));
  it("22°C → 16–18", () => expect(service.waterTempRange(22)).toBe("16–18 °C"));
  it("19°C → 18–20", () => expect(service.waterTempRange(19)).toBe("18–20 °C"));
  it("15°C → 20–22", () => expect(service.waterTempRange(15)).toBe("20–22 °C"));
});

describe("Starter breakdown", () => {
  it("100% hydration: flour ≈ 190", () => {
    const r = calc({ starterWeight: 380 });
    expect(approx(r.starterFlour, 190, 0.01)).toBe(true);
  });
  it("100% hydration: water ≈ 190", () => {
    const r = calc({ starterWeight: 380 });
    expect(approx(r.starterWater, 190, 0.01)).toBe(true);
  });
  it("80% hydration: flour ≈ 211.11", () => {
    const r = calc({ starterWeight: 380, starterHydrationPct: 80 });
    expect(approx(r.starterFlour, 211.11, 0.1)).toBe(true);
  });
  it("80% hydration: water ≈ 168.89", () => {
    const r = calc({ starterWeight: 380, starterHydrationPct: 80 });
    expect(approx(r.starterWater, 168.89, 0.1)).toBe(true);
  });
});

describe("Default calculation", () => {
  it("no error on defaults", () => expect(calc().error).toBeUndefined());
  it("targetDoughWeight = 540", () =>
    expect(calc().targetDoughWeight).toBe(540));
  it("flourToAdd > 0", () => expect(calc().flourToAdd).toBeGreaterThan(0));
  it("totalFlour > 0", () => expect(calc().totalFlour).toBeGreaterThan(0));
  it("waterToAdd >= 0", () =>
    expect(calc().waterToAdd).toBeGreaterThanOrEqual(0));
  it("finalDoughWeight ≈ 540", () =>
    expect(approx(calc().finalDoughWeight, 540, 2)).toBe(true));
  it("actualPerBall ≈ 90", () =>
    expect(approx(calc().actualPerBall, 90, 1)).toBe(true));
  it("hydrationPct = 66", () => expect(calc().hydrationPct).toBe(66));
  it("yeastTypeLabel = Fresh yeast", () =>
    expect(calc().yeastTypeLabel).toBe("Fresh yeast"));
  it("yeastToAdd > 0", () => expect(calc().yeastToAdd).toBeGreaterThan(0));
  it("prefermented in range with starter", () => {
    const r = calc({ starterWeight: 380 });
    expect(r.prefermentedFlourPct).toBeGreaterThan(0);
    expect(r.prefermentedFlourPct).toBeLessThan(100);
  });
  it("prefermented = 0 with no starter", () => {
    expect(calc({ starterWeight: 0 }).prefermentedFlourPct).toBe(0);
  });
});

describe("Yeast type conversions", () => {
  it("fresh label", () =>
    expect(calc({ yeastType: "fresh" }).yeastTypeLabel).toBe("Fresh yeast"));
  it("activeDry label", () =>
    expect(calc({ yeastType: "activeDry" }).yeastTypeLabel).toBe(
      "Active dry yeast",
    ));
  it("instant label", () =>
    expect(calc({ yeastType: "instant" }).yeastTypeLabel).toBe(
      "Instant yeast",
    ));
  it("swedishDry label", () =>
    expect(calc({ yeastType: "swedishDry" }).yeastTypeLabel).toBe(
      "Swedish dry yeast",
    ));

  it("fresh% > activeDry%", () => {
    expect(calc({ yeastType: "fresh" }).chosenYeastPct).toBeGreaterThan(
      calc({ yeastType: "activeDry" }).chosenYeastPct,
    );
  });
  it("activeDry% > instant%", () => {
    expect(calc({ yeastType: "activeDry" }).chosenYeastPct).toBeGreaterThan(
      calc({ yeastType: "instant" }).chosenYeastPct,
    );
  });
  it("swedishDry% = instant%", () => {
    expect(calc({ yeastType: "swedishDry" }).chosenYeastPct).toBe(
      calc({ yeastType: "instant" }).chosenYeastPct,
    );
  });
  it("fresh/activeDry ≈ 2.5", () => {
    const ratio =
      calc({ yeastType: "fresh" }).chosenYeastPct /
      calc({ yeastType: "activeDry" }).chosenYeastPct;
    expect(approx(ratio, 2.5, 0.01)).toBe(true);
  });
  it("fresh/instant ≈ 3.0", () => {
    const ratio =
      calc({ yeastType: "fresh" }).chosenYeastPct /
      calc({ yeastType: "instant" }).chosenYeastPct;
    expect(approx(ratio, 3.0, 0.01)).toBe(true);
  });
  it("fresh/swedishDry ≈ 3.0", () => {
    const ratio =
      calc({ yeastType: "fresh" }).chosenYeastPct /
      calc({ yeastType: "swedishDry" }).chosenYeastPct;
    expect(approx(ratio, 3.0, 0.01)).toBe(true);
  });
});

describe("Milk handling", () => {
  it("no milk: milkToAdd = 0", () =>
    expect(calc({ milkPctOfWater: 0 }).milkToAdd).toBe(0));
  it("20% milk: milkToAdd > 0", () =>
    expect(calc({ milkPctOfWater: 20 }).milkToAdd).toBeGreaterThan(0));
  it("milk reduces water", () => {
    expect(calc({ milkPctOfWater: 20 }).waterToAdd).toBeLessThan(
      calc({ milkPctOfWater: 0 }).waterToAdd,
    );
  });
  it("milk is 20% of added liquid", () => {
    const r = calc({ milkPctOfWater: 20 });
    const total = r.waterToAdd + r.milkToAdd;
    expect(approx(r.milkToAdd / total, 0.2, 0.001)).toBe(true);
  });
});

describe("Sugar and oil", () => {
  it("sugarToAdd > 0 (default 2%)", () =>
    expect(calc().sugarToAdd).toBeGreaterThan(0));
  it("oilToAdd > 0 (default 2%)", () =>
    expect(calc().oilToAdd).toBeGreaterThan(0));
  it("sugar added", () =>
    expect(calc({ sugarPct: 5, oilPct: 3 }).sugarToAdd).toBeGreaterThan(0));
  it("oil added", () =>
    expect(calc({ sugarPct: 5, oilPct: 3 }).oilToAdd).toBeGreaterThan(0));
  it("dough weight valid with extras", () => {
    expect(calc({ sugarPct: 5, oilPct: 3 }).finalDoughWeight).toBeGreaterThan(
      0,
    );
  });
});

describe("Zero starter", () => {
  it("no error with starter = 0", () =>
    expect(calc({ starterWeight: 0 }).error).toBeUndefined());
  it("starterFlour = 0", () =>
    expect(calc({ starterWeight: 0 }).starterFlour).toBe(0));
  it("starterWater = 0", () =>
    expect(calc({ starterWeight: 0 }).starterWater).toBe(0));
  it("still produces flour", () =>
    expect(calc({ starterWeight: 0 }).flourToAdd).toBeGreaterThan(0));
  it("dough weight still ≈ 540", () => {
    expect(approx(calc({ starterWeight: 0 }).finalDoughWeight, 540, 2)).toBe(
      true,
    );
  });
});

describe("Temperature adjustment", () => {
  it("cold room needs more yeast", () => {
    expect(calc({ roomTemp: 18 }).freshPctFinal).toBeGreaterThan(
      calc({ roomTemp: 28 }).freshPctFinal,
    );
  });
});

describe("Time allocation", () => {
  it("mix = 35 min", () => expect(calc().mixMinutes).toBe(35));
  it("bench rest = 15 min", () => expect(calc().benchRestMinutes).toBe(15));
  it("preheat = 45 min", () => expect(calc().preheatMinutes).toBe(45));
  it("bake = 15 min", () => expect(calc().bakeMinutes).toBe(15));
  it("bulk in [135, 360]", () => {
    const r = calc();
    expect(r.bulkMinutes).toBeGreaterThanOrEqual(135);
    expect(r.bulkMinutes).toBeLessThanOrEqual(360);
  });
  it("divide > 0 and reasonable", () => {
    const r = calc();
    expect(r.divideAndShapeMinutes).toBeGreaterThan(0);
    expect(r.divideAndShapeMinutes).toBeLessThanOrEqual(55);
  });
  it("final proof >= 50", () =>
    expect(calc().finalProofMinutes).toBeGreaterThanOrEqual(50));
  it("fold1 within bulk", () => {
    const r = calc();
    expect(r.fold1).toBeGreaterThan(0);
    expect(r.fold1).toBeLessThan(r.bulkMinutes);
  });
  it("fold2 after fold1 within bulk", () => {
    const r = calc();
    expect(r.fold2).toBeGreaterThan(r.fold1);
    expect(r.fold2).toBeLessThan(r.bulkMinutes);
  });
  it("total steps >= input time", () => {
    const r = calc();
    const total =
      r.mixMinutes +
      r.bulkMinutes +
      r.divideAndShapeMinutes +
      r.benchRestMinutes +
      r.finalProofMinutes +
      r.preheatMinutes +
      r.bakeMinutes;
    expect(total).toBeGreaterThanOrEqual(r.totalHours * 60);
  });
});

describe("Validation", () => {
  it("breadCount=0 → error", () =>
    expect(calc({ breadCount: 0 }).error).toBeDefined());
  it("saltPct=0 → error", () =>
    expect(calc({ saltPct: 0 }).error).toBeDefined());
  it("totalHours=0 → error", () =>
    expect(calc({ totalHours: 0 }).error).toBeDefined());
  it("starterHydrationPct=0 → error", () =>
    expect(calc({ starterHydrationPct: 0 }).error).toBeDefined());
  it("hydrationPct=0 → error", () =>
    expect(calc({ hydrationPct: 0 }).error).toBeDefined());
});

describe("Impossible recipe", () => {
  it("huge starter → error", () => {
    const r = calc({ starterWeight: 5000, targetBallWeight: 50 });
    expect(r.error).toBeDefined();
    expect(r.error).toBe("recipe");
  });
});

describe("Edge cases", () => {
  it("2h: no error", () =>
    expect(calc({ totalHours: 2 }).error).toBeUndefined());
  it("2h: bulk clamped to 135", () =>
    expect(calc({ totalHours: 2 }).bulkMinutes).toBe(135));
  it("2h: proof clamped to 50", () =>
    expect(calc({ totalHours: 2 }).finalProofMinutes).toBe(50));
  it("24h: no error", () =>
    expect(calc({ totalHours: 24 }).error).toBeUndefined());
  it("24h: bulk clamped to 360", () =>
    expect(calc({ totalHours: 24 }).bulkMinutes).toBe(360));
  it("24h: proof >= 50", () =>
    expect(calc({ totalHours: 24 }).finalProofMinutes).toBeGreaterThanOrEqual(
      50,
    ));
  it("24h: proof <= 180", () =>
    expect(calc({ totalHours: 24 }).finalProofMinutes).toBeLessThanOrEqual(
      180,
    ));
  it("50 breads: no error", () =>
    expect(calc({ breadCount: 50 }).error).toBeUndefined());
  it("50 breads: divide at upper bound (round5 of 48 = 50)", () =>
    expect(calc({ breadCount: 50 }).divideAndShapeMinutes).toBe(50));
});

describe("Dough weight identity", () => {
  const configs: Partial<CalcInputs>[] = [
    {},
    { sugarPct: 5, oilPct: 3 },
    { milkPctOfWater: 30 },
    { starterHydrationPct: 80 },
    { yeastType: "instant", totalHours: 4, roomTemp: 28 },
  ];

  for (const cfg of configs) {
    it(`ingredient sum ≈ finalDoughWeight (${JSON.stringify(cfg)})`, () => {
      const r = calc(cfg);
      if (r.error) return;
      const sum =
        r.flourToAdd +
        r.starterWeight +
        r.waterToAdd +
        r.milkToAdd +
        r.saltToAdd +
        r.sugarToAdd +
        r.oilToAdd +
        r.yeastToAdd;
      expect(approx(sum, r.finalDoughWeight, 0.01)).toBe(true);
    });
  }
});

describe("Flour blend adjustment", () => {
  it("no adjustment: effectiveHydrationPct = hydrationPct", () => {
    const r = calc();
    expect(r.effectiveHydrationPct).toBe(r.hydrationPct);
  });

  it("flourBlendAdjustment = 0 by default", () => {
    expect(calc().flourBlendAdjustment).toBe(0);
  });

  it("customHydrationAdjustment = 0 by default", () => {
    expect(calc().customHydrationAdjustment).toBe(0);
  });

  it("positive flourBlendAdjustment raises effectiveHydrationPct", () => {
    const r = calc({ flourBlendAdjustment: 2 });
    expect(r.effectiveHydrationPct).toBe(r.hydrationPct + 2);
  });

  it("negative flourBlendAdjustment lowers effectiveHydrationPct", () => {
    const r = calc({ flourBlendAdjustment: -1 });
    expect(r.effectiveHydrationPct).toBe(r.hydrationPct - 1);
  });

  it("customHydrationAdjustment adds on top of flourBlendAdjustment", () => {
    const r = calc({ flourBlendAdjustment: 2, customHydrationAdjustment: 0.5 });
    expect(r.effectiveHydrationPct).toBe(r.hydrationPct + 2.5);
  });

  it("positive blend adjustment increases waterToAdd", () => {
    const base = calc();
    const blended = calc({ flourBlendAdjustment: 3 });
    expect(blended.waterToAdd).toBeGreaterThan(base.waterToAdd);
  });

  it("negative blend adjustment decreases waterToAdd", () => {
    const base = calc();
    const blended = calc({ flourBlendAdjustment: -2 });
    expect(blended.waterToAdd).toBeLessThan(base.waterToAdd);
  });

  it("blend fields passed through to result", () => {
    const r = calc({
      flourBlendAdjustment: 1.5,
      customHydrationAdjustment: 0.5,
    });
    expect(r.flourBlendAdjustment).toBe(1.5);
    expect(r.customHydrationAdjustment).toBe(0.5);
  });

  it("dough weight identity holds with blend adjustment", () => {
    const r = calc({ flourBlendAdjustment: 2 });
    if (r.error) return;
    const sum =
      r.flourToAdd +
      r.starterWeight +
      r.waterToAdd +
      r.milkToAdd +
      r.saltToAdd +
      r.sugarToAdd +
      r.oilToAdd +
      r.yeastToAdd;
    expect(approx(sum, r.finalDoughWeight, 0.01)).toBe(true);
  });
});

describe("Mixing method", () => {
  it("default is manual", () => {
    expect(calc().mixingMethod).toBe("manual");
  });

  it("manual: initialMixMinutes = 5", () => {
    expect(calc().initialMixMinutes).toBe(5);
  });

  it("manual: autolyseMinutes = 20", () => {
    expect(calc().autolyseMinutes).toBe(20);
  });

  it("manual: incorporationMinutes = 0", () => {
    expect(calc().incorporationMinutes).toBe(0);
  });

  it("manual: developmentMinutes = 10", () => {
    expect(calc().developmentMinutes).toBe(10);
  });

  it("manual: mixMinutes = 35 (5 + 20 + 0 + 10)", () => {
    expect(calc().mixMinutes).toBe(35);
  });

  it("machine: initialMixMinutes = 4", () => {
    expect(calc({ mixingMethod: "machine" }).initialMixMinutes).toBe(4);
  });

  it("machine: autolyseMinutes = 20", () => {
    expect(calc({ mixingMethod: "machine" }).autolyseMinutes).toBe(20);
  });

  it("machine: incorporationMinutes = 2", () => {
    expect(calc({ mixingMethod: "machine" }).incorporationMinutes).toBe(2);
  });

  it("machine: developmentMinutes = 6", () => {
    expect(calc({ mixingMethod: "machine" }).developmentMinutes).toBe(6);
  });

  it("machine: mixMinutes = 32 (4 + 20 + 2 + 6)", () => {
    expect(calc({ mixingMethod: "machine" }).mixMinutes).toBe(32);
  });

  it("mixer speed labels passed through", () => {
    const r = calc({
      mixingMethod: "machine",
      mixerSpeedLow: "S1",
      mixerSpeedLowMedium: "S2",
      mixerSpeedMedium: "S3",
    });
    expect(r.mixerSpeedLow).toBe("S1");
    expect(r.mixerSpeedLowMedium).toBe("S2");
    expect(r.mixerSpeedMedium).toBe("S3");
  });

  it("mixer speed defaults when not specified", () => {
    const r = calc({ mixingMethod: "machine" });
    expect(r.mixerSpeedLow).toBe("1");
    expect(r.mixerSpeedLowMedium).toBe("2–3");
    expect(r.mixerSpeedMedium).toBe("3–4");
  });

  it("manual total steps >= input time", () => {
    const r = calc({ mixingMethod: "manual" });
    const total =
      r.mixMinutes +
      r.bulkMinutes +
      r.divideAndShapeMinutes +
      r.benchRestMinutes +
      r.finalProofMinutes +
      r.preheatMinutes +
      r.bakeMinutes;
    expect(total).toBeGreaterThanOrEqual(r.totalHours * 60);
  });

  it("machine total steps >= input time", () => {
    const r = calc({ mixingMethod: "machine" });
    const total =
      r.mixMinutes +
      r.bulkMinutes +
      r.divideAndShapeMinutes +
      r.benchRestMinutes +
      r.finalProofMinutes +
      r.preheatMinutes +
      r.bakeMinutes;
    expect(total).toBeGreaterThanOrEqual(r.totalHours * 60);
  });
});

describe("formatWeight", () => {
  it("rounds general ingredient to whole grams", () => {
    expect(service.formatWeight(16.1)).toBe("16");
  });
  it("rounds general ingredient 0.4 down", () => {
    expect(service.formatWeight(99.4)).toBe("99");
  });
  it("yeast < 10 gets 1 decimal", () => {
    expect(service.formatWeight(1.3, true)).toBe("1.3");
  });
  it("yeast >= 10 rounds to whole", () => {
    expect(service.formatWeight(12.7, true)).toBe("13");
  });
  it("yeast exactly 10 rounds to whole", () => {
    expect(service.formatWeight(10, true)).toBe("10");
  });
  it("yeast 9.99 gets 1 decimal", () => {
    expect(service.formatWeight(9.99, true)).toBe("10");
  });
});
