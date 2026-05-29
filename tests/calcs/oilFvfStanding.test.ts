import { describe, it, expect } from "vitest";
import { oilFvfStanding } from "../../src/calcs/reservoir/oilFvfStanding";

describe("oilFvfStanding", () => {
  it("benchmark: Rs=500, gasSG=0.7, API=30, T=200°F → Bo≈1.286", () => {
    const res = oilFvfStanding.run({
      inputs: {
        solutionGor: { value: 500, unit: "scf/STB" },
        gasSG: { value: 0.7, unit: "" },
        oilAPI: { value: 30, unit: "" },
        temperature: { value: 200, unit: "degF" },
      },
    });
    expect(res.trustTier).toBe("computed");
    expect(res.result.unit).toBe("rb/STB");
    expect(res.result.value).toBeCloseTo(1.286, 2);
  });

  it("accepts temperature in degC (≈93.33 degC ≈ 200°F)", () => {
    const res = oilFvfStanding.run({
      inputs: {
        solutionGor: { value: 500, unit: "scf/STB" },
        gasSG: { value: 0.7, unit: "" },
        oilAPI: { value: 30, unit: "" },
        temperature: { value: 93.333, unit: "degC" },
      },
    });
    expect(res.result.value).toBeCloseTo(1.286, 2);
  });

  it("throws on gasSG <= 0", () => {
    expect(() =>
      oilFvfStanding.run({
        inputs: {
          solutionGor: { value: 500, unit: "scf/STB" },
          gasSG: { value: 0, unit: "" },
          oilAPI: { value: 30, unit: "" },
          temperature: { value: 200, unit: "degF" },
        },
      }),
    ).toThrow();
  });

  it("throws on API <= 0", () => {
    expect(() =>
      oilFvfStanding.run({
        inputs: {
          solutionGor: { value: 500, unit: "scf/STB" },
          gasSG: { value: 0.7, unit: "" },
          oilAPI: { value: 0, unit: "" },
          temperature: { value: 200, unit: "degF" },
        },
      }),
    ).toThrow();
  });
});
