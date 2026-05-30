import { describe, it, expect } from "vitest";
import { liquidHoldup } from "../../src/calcs/subsea/liquidHoldup";

describe("liquidHoldup", () => {
  it("benchmark: Q_L=0.02, Q_G=0.08, D=0.2 → λ=0.20, v_m=3.183 m/s", () => {
    const res = liquidHoldup.run({
      inputs: {
        liquidFlowrate: { value: 0.02, unit: "m^3/s" },
        gasFlowrate: { value: 0.08, unit: "m^3/s" },
        diameter: { value: 0.2, unit: "m" },
      },
    });
    expect(res.result.value).toBeCloseTo(0.20, 3);
    expect(res.result.unit).toBe("");
    expect(res.trustTier).toBe("computed");
    // Check mixture velocity in steps
    const vmStep = res.steps.find((s) => s.label.includes("Mixture velocity"));
    expect(vmStep?.result?.value).toBeCloseTo(3.183, 2);
  });

  it("accepts non-SI: diameter in inch, flowrates in bbl/day", () => {
    // D=0.2 m = 7.874 in; Q_L=0.02 m^3/s = 10879 bbl/day; Q_G=0.08 m^3/s = 43515 bbl/day
    // 1 m^3 = 6.28981 bbl; 1 day = 86400 s; 1 m^3/s = 6.28981*86400 = 543439 bbl/day
    // Q_L = 0.02 * 543439 = 10868.8 bbl/day; Q_G = 0.08 * 543439 = 43475 bbl/day
    const res = liquidHoldup.run({
      inputs: {
        liquidFlowrate: { value: 10868.8, unit: "bbl/day" },
        gasFlowrate: { value: 43475, unit: "bbl/day" },
        diameter: { value: 7.874, unit: "in" },
      },
    });
    // λ should still be 0.20 (ratio is independent of unit system)
    expect(res.result.value).toBeCloseTo(0.20, 2);
  });

  it("gas-only gives λ=0", () => {
    const res = liquidHoldup.run({
      inputs: {
        liquidFlowrate: { value: 0, unit: "m^3/s" },
        gasFlowrate: { value: 0.1, unit: "m^3/s" },
        diameter: { value: 0.2, unit: "m" },
      },
    });
    expect(res.result.value).toBeCloseTo(0, 5);
  });

  it("liquid-only gives λ=1", () => {
    const res = liquidHoldup.run({
      inputs: {
        liquidFlowrate: { value: 0.1, unit: "m^3/s" },
        gasFlowrate: { value: 0, unit: "m^3/s" },
        diameter: { value: 0.2, unit: "m" },
      },
    });
    expect(res.result.value).toBeCloseTo(1, 5);
  });

  it("throws if both flowrates are zero", () => {
    expect(() =>
      liquidHoldup.run({
        inputs: {
          liquidFlowrate: { value: 0, unit: "m^3/s" },
          gasFlowrate: { value: 0, unit: "m^3/s" },
          diameter: { value: 0.2, unit: "m" },
        },
      }),
    ).toThrow();
  });

  it("throws on non-positive diameter", () => {
    expect(() =>
      liquidHoldup.run({
        inputs: {
          liquidFlowrate: { value: 0.02, unit: "m^3/s" },
          gasFlowrate: { value: 0.08, unit: "m^3/s" },
          diameter: { value: 0, unit: "m" },
        },
      }),
    ).toThrow();
  });
});
