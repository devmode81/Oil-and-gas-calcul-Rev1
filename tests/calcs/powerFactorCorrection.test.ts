import { describe, it, expect } from "vitest";
import { powerFactorCorrection } from "../../src/calcs/electrical/powerFactorCorrection";

describe("powerFactorCorrection", () => {
  it("benchmark: P=100kW, pf1=0.7, pf2=0.95 → Qc≈69.15 kVAR", () => {
    const res = powerFactorCorrection.run({
      inputs: {
        activePower: { value: 100000, unit: "W" },
        currentPowerFactor: { value: 0.7, unit: "" },
        targetPowerFactor: { value: 0.95, unit: "" },
      },
    });
    expect(res.result.unit).toBe("VAR");
    expect(res.result.value / 1000).toBeCloseTo(69.15, 1);
    expect(res.trustTier).toBe("computed");
  });

  it("uses kW input", () => {
    const res = powerFactorCorrection.run({
      inputs: {
        activePower: { value: 100, unit: "kW" },
        currentPowerFactor: { value: 0.7, unit: "" },
        targetPowerFactor: { value: 0.95, unit: "" },
      },
    });
    expect(res.result.value / 1000).toBeCloseTo(69.15, 1);
  });

  it("throws on pf1 >= pf2 (no correction needed)", () => {
    expect(() =>
      powerFactorCorrection.run({
        inputs: {
          activePower: { value: 100000, unit: "W" },
          currentPowerFactor: { value: 0.95, unit: "" },
          targetPowerFactor: { value: 0.7, unit: "" },
        },
      }),
    ).toThrow();
  });

  it("throws on pf1 equal to pf2", () => {
    expect(() =>
      powerFactorCorrection.run({
        inputs: {
          activePower: { value: 100000, unit: "W" },
          currentPowerFactor: { value: 0.85, unit: "" },
          targetPowerFactor: { value: 0.85, unit: "" },
        },
      }),
    ).toThrow();
  });

  it("throws on negative activePower", () => {
    expect(() =>
      powerFactorCorrection.run({
        inputs: {
          activePower: { value: -1000, unit: "W" },
          currentPowerFactor: { value: 0.7, unit: "" },
          targetPowerFactor: { value: 0.95, unit: "" },
        },
      }),
    ).toThrow();
  });
});
