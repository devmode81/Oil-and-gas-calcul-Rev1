import { describe, it, expect } from "vitest";
import { killMudWeight } from "../../src/calcs/drilling/killMudWeight";

describe("killMudWeight", () => {
  it("benchmark: MW=10 ppg, SIDPP=500 psi, TVD=10000 ft → 10.96 ppg", () => {
    const res = killMudWeight.run({
      inputs: {
        mudWeight: { value: 10, unit: "ppg" },
        sidpp: { value: 500, unit: "psi" },
        tvd: { value: 10000, unit: "ft" },
      },
    });
    expect(res.result.unit).toBe("ppg");
    expect(res.result.value).toBeCloseTo(10.96, 2);
    expect(res.trustTier).toBe("validated");
    expect(res.reference).toContain("IWCF");
  });

  it("accepts SI inputs: mudWeight kg/m^3, sidpp Pa, tvd m", () => {
    // 10 ppg = 1198.264 kg/m³, 500 psi = 3447378.6 Pa, 10000 ft = 3048 m
    const res = killMudWeight.run({
      inputs: {
        mudWeight: { value: 1198.264, unit: "kg/m^3" },
        sidpp: { value: 3447378.6, unit: "Pa" },
        tvd: { value: 3048, unit: "m" },
      },
    });
    expect(res.result.value).toBeCloseTo(10.96, 2);
  });

  it("throws on non-positive tvd", () => {
    expect(() =>
      killMudWeight.run({
        inputs: {
          mudWeight: { value: 10, unit: "ppg" },
          sidpp: { value: 500, unit: "psi" },
          tvd: { value: 0, unit: "ft" },
        },
      })
    ).toThrow();
  });
});
