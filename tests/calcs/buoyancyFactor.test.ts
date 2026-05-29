import { describe, it, expect } from "vitest";
import { buoyancyFactor } from "../../src/calcs/drilling/buoyancyFactor";

describe("buoyancyFactor", () => {
  it("benchmark: MW=10 ppg, steel 7850 kg/m³ → BF=0.8474", () => {
    const res = buoyancyFactor.run({
      inputs: {
        mudWeight: { value: 10, unit: "ppg" },
      },
    });
    expect(res.result.unit).toBe("");
    expect(res.result.value).toBeCloseTo(0.8474, 3);
    expect(res.trustTier).toBe("computed");
  });

  it("accepts mudWeight in kg/m^3", () => {
    const res = buoyancyFactor.run({
      inputs: {
        mudWeight: { value: 1198.264, unit: "kg/m^3" },
      },
    });
    expect(res.result.value).toBeCloseTo(0.8474, 3);
  });

  it("throws on non-positive mud weight", () => {
    expect(() =>
      buoyancyFactor.run({
        inputs: {
          mudWeight: { value: 0, unit: "ppg" },
        },
      })
    ).toThrow();
  });
});
