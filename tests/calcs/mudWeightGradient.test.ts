import { describe, it, expect } from "vitest";
import { mudWeightGradient } from "../../src/calcs/drilling/mudWeightGradient";

describe("mudWeightGradient", () => {
  it("benchmark: 10 ppg → 0.5195 psi/ft", () => {
    const res = mudWeightGradient.run({
      inputs: {
        mudWeight: { value: 10, unit: "ppg" },
      },
    });
    expect(res.result.unit).toBe("psi/ft");
    expect(res.result.value).toBeCloseTo(0.5195, 3);
    expect(res.trustTier).toBe("computed");
  });

  it("accepts mudWeight in kg/m^3", () => {
    // 1198.26 kg/m^3 ≈ 10 ppg
    const res = mudWeightGradient.run({
      inputs: {
        mudWeight: { value: 1198.26, unit: "kg/m^3" },
      },
    });
    expect(res.result.value).toBeCloseTo(0.5195, 3);
  });

  it("throws on non-positive mud weight", () => {
    expect(() =>
      mudWeightGradient.run({
        inputs: { mudWeight: { value: -1, unit: "ppg" } },
      })
    ).toThrow();
  });
});
