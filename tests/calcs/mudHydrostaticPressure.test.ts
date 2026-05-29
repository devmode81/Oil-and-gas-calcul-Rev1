import { describe, it, expect } from "vitest";
import { mudHydrostaticPressure } from "../../src/calcs/drilling/mudHydrostaticPressure";

describe("mudHydrostaticPressure", () => {
  it("benchmark: 10 ppg, 10000 ft → 5195 psi", () => {
    const res = mudHydrostaticPressure.run({
      inputs: {
        mudWeight: { value: 10, unit: "ppg" },
        tvd: { value: 10000, unit: "ft" },
      },
    });
    expect(res.result.unit).toBe("psi");
    expect(res.result.value).toBeCloseTo(5195, 0);
    expect(res.trustTier).toBe("computed");
  });

  it("same inputs in SI units → same result", () => {
    // 10 ppg = 1198.26 kg/m^3, 10000 ft = 3048 m
    const res = mudHydrostaticPressure.run({
      inputs: {
        mudWeight: { value: 1198.26, unit: "kg/m^3" },
        tvd: { value: 3048, unit: "m" },
      },
    });
    expect(res.result.value).toBeCloseTo(5195, 0);
  });

  it("throws on non-positive mud weight", () => {
    expect(() =>
      mudHydrostaticPressure.run({
        inputs: {
          mudWeight: { value: 0, unit: "ppg" },
          tvd: { value: 10000, unit: "ft" },
        },
      })
    ).toThrow();
  });
});
