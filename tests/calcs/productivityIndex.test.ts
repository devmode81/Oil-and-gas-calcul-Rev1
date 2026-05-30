import { describe, it, expect } from "vitest";
import { productivityIndex } from "../../src/calcs/reservoir/productivityIndex";

describe("productivityIndex", () => {
  it("benchmark: q=500, Pr=3000, Pwf=2500 → J=1.0 STB/d/psi", () => {
    const res = productivityIndex.run({
      inputs: {
        flowrate: { value: 500, unit: "STB/d" },
        reservoirPressure: { value: 3000, unit: "psi" },
        flowingPressure: { value: 2500, unit: "psi" },
      },
    });
    expect(res.trustTier).toBe("computed");
    expect(res.result.unit).toBe("STB/d/psi");
    expect(res.result.value).toBeCloseTo(1.0, 3);
  });

  it("accepts pressures in bar (3000 psi ≈ 206.843 bar, 2500 psi ≈ 172.369 bar)", () => {
    const res = productivityIndex.run({
      inputs: {
        flowrate: { value: 500, unit: "STB/d" },
        reservoirPressure: { value: 206.843, unit: "bar" },
        flowingPressure: { value: 172.369, unit: "bar" },
      },
    });
    expect(res.result.value).toBeCloseTo(1.0, 1);
  });

  it("throws when Pr <= Pwf", () => {
    expect(() =>
      productivityIndex.run({
        inputs: {
          flowrate: { value: 500, unit: "STB/d" },
          reservoirPressure: { value: 2500, unit: "psi" },
          flowingPressure: { value: 2500, unit: "psi" },
        },
      }),
    ).toThrow();
  });

  it("throws when Pr < Pwf", () => {
    expect(() =>
      productivityIndex.run({
        inputs: {
          flowrate: { value: 500, unit: "STB/d" },
          reservoirPressure: { value: 2000, unit: "psi" },
          flowingPressure: { value: 2500, unit: "psi" },
        },
      }),
    ).toThrow();
  });
});
