import { describe, it, expect } from "vitest";
import { solutionGorStanding } from "../../src/calcs/reservoir/solutionGorStanding";

describe("solutionGorStanding", () => {
  it("benchmark: P=2000 psia, gasSG=0.7, API=30, T=200°F → Rs≈349.5 scf/STB", () => {
    const res = solutionGorStanding.run({
      inputs: {
        pressure: { value: 2000, unit: "psi" },
        gasSG: { value: 0.7, unit: "" },
        oilAPI: { value: 30, unit: "" },
        temperature: { value: 200, unit: "degF" },
      },
    });
    expect(res.trustTier).toBe("computed");
    expect(res.result.unit).toBe("scf/STB");
    expect(res.result.value).toBeCloseTo(349.5, 0);
  });

  it("accepts pressure in bar (2000 psi ≈ 137.895 bar)", () => {
    const res = solutionGorStanding.run({
      inputs: {
        pressure: { value: 137.895, unit: "bar" },
        gasSG: { value: 0.7, unit: "" },
        oilAPI: { value: 30, unit: "" },
        temperature: { value: 200, unit: "degF" },
      },
    });
    expect(res.result.value).toBeCloseTo(349.5, 0);
  });

  it("accepts temperature in degC (93.333°C ≈ 200°F)", () => {
    const res = solutionGorStanding.run({
      inputs: {
        pressure: { value: 2000, unit: "psi" },
        gasSG: { value: 0.7, unit: "" },
        oilAPI: { value: 30, unit: "" },
        temperature: { value: 93.333, unit: "degC" },
      },
    });
    expect(res.result.value).toBeCloseTo(349.5, 0);
  });

  it("throws on pressure <= 0", () => {
    expect(() =>
      solutionGorStanding.run({
        inputs: {
          pressure: { value: 0, unit: "psi" },
          gasSG: { value: 0.7, unit: "" },
          oilAPI: { value: 30, unit: "" },
          temperature: { value: 200, unit: "degF" },
        },
      }),
    ).toThrow();
  });

  it("throws on gasSG <= 0", () => {
    expect(() =>
      solutionGorStanding.run({
        inputs: {
          pressure: { value: 2000, unit: "psi" },
          gasSG: { value: 0, unit: "" },
          oilAPI: { value: 30, unit: "" },
          temperature: { value: 200, unit: "degF" },
        },
      }),
    ).toThrow();
  });
});
