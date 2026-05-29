import { describe, it, expect } from "vitest";
import { equivalentMudWeight } from "../../src/calcs/drilling/equivalentMudWeight";

describe("equivalentMudWeight", () => {
  it("benchmark: P=5195 psi, TVD=10000 ft → 10.0 ppg", () => {
    const res = equivalentMudWeight.run({
      inputs: {
        pressure: { value: 5195, unit: "psi" },
        tvd: { value: 10000, unit: "ft" },
      },
    });
    expect(res.result.unit).toBe("ppg");
    expect(res.result.value).toBeCloseTo(10.0, 1);
    expect(res.trustTier).toBe("computed");
  });

  it("accepts pressure in Pa and tvd in m", () => {
    // 5195 psi = 35818264 Pa approx, 10000 ft = 3048 m
    const res = equivalentMudWeight.run({
      inputs: {
        pressure: { value: 35818264, unit: "Pa" },
        tvd: { value: 3048, unit: "m" },
      },
    });
    expect(res.result.value).toBeCloseTo(10.0, 1);
  });

  it("throws on zero tvd", () => {
    expect(() =>
      equivalentMudWeight.run({
        inputs: {
          pressure: { value: 5000, unit: "psi" },
          tvd: { value: 0, unit: "ft" },
        },
      })
    ).toThrow();
  });
});
