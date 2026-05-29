import { describe, it, expect } from "vitest";
import { erosionalVelocity } from "../../src/calcs/flow/erosionalVelocity";

describe("erosionalVelocity", () => {
  it("API RP 14E: ρm=3 lb/ft³, C=100 → Ve≈17.6 m/s", () => {
    const res = erosionalVelocity.run({
      inputs: { mixtureDensity: { value: 3, unit: "lbm/ft^3" } },
    });
    expect(res.result.unit).toBe("m/s");
    expect(res.result.value).toBeCloseTo(17.6, 1);
    expect(res.trustTier).toBe("validated");
    expect(res.reference).toContain("14E");
    const fts = res.steps.find((s) => s.label.includes("ft/s"));
    expect(fts?.result?.value).toBeCloseTo(57.74, 1);
  });

  it("accepts SI mixture density and uses intermittent C=125 override", () => {
    const res = erosionalVelocity.run({
      inputs: { mixtureDensity: { value: 48.0554, unit: "kg/m^3" } }, // = 3 lb/ft³
      assumptionOverrides: { C: { value: 125, unit: "" } },
    });
    // Ve = 125/√3 ft/s = 72.17 ft/s = 22.0 m/s
    expect(res.result.value).toBeCloseTo(22.0, 1);
  });

  it("throws on non-positive density", () => {
    expect(() => erosionalVelocity.run({ inputs: { mixtureDensity: { value: 0, unit: "kg/m^3" } } })).toThrow();
  });
});
