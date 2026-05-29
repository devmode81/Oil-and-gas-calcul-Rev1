import { describe, it, expect } from "vitest";
import { ecd } from "../../src/calcs/drilling/ecd";

describe("ecd", () => {
  it("benchmark: MW=10 ppg, ΔP=200 psi, TVD=10000 ft → 10.385 ppg", () => {
    const res = ecd.run({
      inputs: {
        mudWeight: { value: 10, unit: "ppg" },
        annularPressureLoss: { value: 200, unit: "psi" },
        tvd: { value: 10000, unit: "ft" },
      },
    });
    expect(res.result.unit).toBe("ppg");
    // SI-exact: ECD = 1198.264 + 46.133 = 1244.397 kg/m³ = 10.385 ppg
    expect(res.result.value).toBeCloseTo(10.385, 2);
    expect(res.trustTier).toBe("validated");
    expect(res.reference).toContain("IADC");
  });

  it("accepts inputs in SI: mudWeight kg/m^3, tvd m, annularPressureLoss Pa", () => {
    // Same scenario in SI: MW=1198.26 kg/m³, ΔP=200 psi=1378951.5 Pa, TVD=3048 m
    const res = ecd.run({
      inputs: {
        mudWeight: { value: 1198.26, unit: "kg/m^3" },
        annularPressureLoss: { value: 1378951.5, unit: "Pa" },
        tvd: { value: 3048, unit: "m" },
      },
    });
    expect(res.result.value).toBeCloseTo(10.385, 2);
  });

  it("throws on non-positive tvd", () => {
    expect(() =>
      ecd.run({
        inputs: {
          mudWeight: { value: 10, unit: "ppg" },
          annularPressureLoss: { value: 200, unit: "psi" },
          tvd: { value: 0, unit: "ft" },
        },
      })
    ).toThrow();
  });
});
