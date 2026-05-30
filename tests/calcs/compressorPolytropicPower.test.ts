import { describe, it, expect } from "vitest";
import { compressorPolytropicPower } from "../../src/calcs/mechanical/compressorPolytropicPower";

describe("compressorPolytropicPower", () => {
  it("benchmark: SI inputs → ~101.2 kW (plan 102.9 had arithmetic error in 3^0.23077)", () => {
    const res = compressorPolytropicPower.run({
      inputs: {
        massFlowrate: { value: 10, unit: "kg/s" },
        inletTemp: { value: 300, unit: "K" },
        inletPressure: { value: 1e6, unit: "Pa" },
        outletPressure: { value: 3e6, unit: "Pa" },
        zFactor: { value: 0.95, unit: "" },
        molarMass: { value: 20, unit: "g/mol" },
        polytropicIndex: { value: 1.3, unit: "" },
      },
      assumptionOverrides: { polytropicEfficiency: { value: 0.78, unit: "" } },
    });
    expect(res.result.unit).toBe("W");
    // Correct: 3^(0.3/1.3) = 1.28856 (not 1.29287 as in plan), giving 101.15 kW
    expect(res.result.value / 1000).toBeCloseTo(101.2, 0);
  });

  it("non-SI: inlet temp in degF, pressures in psi", () => {
    // T1 = 300 K = 80.33 °F; P1 = 1e6 Pa = 145.038 psi; P2 = 3e6 Pa = 435.113 psi
    const res = compressorPolytropicPower.run({
      inputs: {
        massFlowrate: { value: 10, unit: "kg/s" },
        inletTemp: { value: 80.33, unit: "degF" },
        inletPressure: { value: 145.038, unit: "psi" },
        outletPressure: { value: 435.113, unit: "psi" },
        zFactor: { value: 0.95, unit: "" },
        molarMass: { value: 20, unit: "g/mol" },
        polytropicIndex: { value: 1.3, unit: "" },
      },
      assumptionOverrides: { polytropicEfficiency: { value: 0.78, unit: "" } },
    });
    expect(res.result.value / 1000).toBeCloseTo(101.2, 0);
  });

  it("non-SI: mass flowrate in lbm/s", () => {
    // 10 kg/s = 22.0462 lbm/s
    const res = compressorPolytropicPower.run({
      inputs: {
        massFlowrate: { value: 22.0462, unit: "lbm/s" },
        inletTemp: { value: 300, unit: "K" },
        inletPressure: { value: 1e6, unit: "Pa" },
        outletPressure: { value: 3e6, unit: "Pa" },
        zFactor: { value: 0.95, unit: "" },
        molarMass: { value: 20, unit: "g/mol" },
        polytropicIndex: { value: 1.3, unit: "" },
      },
      assumptionOverrides: { polytropicEfficiency: { value: 0.78, unit: "" } },
    });
    expect(res.result.value / 1000).toBeCloseTo(101.2, 0);
  });

  it("throws when P2 <= P1", () => {
    expect(() =>
      compressorPolytropicPower.run({
        inputs: {
          massFlowrate: { value: 10, unit: "kg/s" },
          inletTemp: { value: 300, unit: "K" },
          inletPressure: { value: 3e6, unit: "Pa" },
          outletPressure: { value: 1e6, unit: "Pa" },
          zFactor: { value: 0.95, unit: "" },
          molarMass: { value: 20, unit: "g/mol" },
          polytropicIndex: { value: 1.3, unit: "" },
        },
      }),
    ).toThrow();
  });

  it("throws on non-positive T1", () => {
    expect(() =>
      compressorPolytropicPower.run({
        inputs: {
          massFlowrate: { value: 10, unit: "kg/s" },
          inletTemp: { value: 0, unit: "K" },
          inletPressure: { value: 1e6, unit: "Pa" },
          outletPressure: { value: 3e6, unit: "Pa" },
          zFactor: { value: 0.95, unit: "" },
          molarMass: { value: 20, unit: "g/mol" },
          polytropicIndex: { value: 1.3, unit: "" },
        },
      }),
    ).toThrow();
  });

  it("has trustTier validated and reference", () => {
    const res = compressorPolytropicPower.run({
      inputs: {
        massFlowrate: { value: 10, unit: "kg/s" },
        inletTemp: { value: 300, unit: "K" },
        inletPressure: { value: 1e6, unit: "Pa" },
        outletPressure: { value: 3e6, unit: "Pa" },
        zFactor: { value: 0.95, unit: "" },
        molarMass: { value: 20, unit: "g/mol" },
        polytropicIndex: { value: 1.3, unit: "" },
      },
    });
    expect(res.trustTier).toBe("validated");
    expect(res.reference).toBeTruthy();
  });
});
