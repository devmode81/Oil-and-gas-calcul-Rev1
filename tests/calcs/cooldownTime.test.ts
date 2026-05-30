import { describe, it, expect } from "vitest";
import { cooldownTime } from "../../src/calcs/subsea/cooldownTime";

describe("cooldownTime", () => {
  // NOTE: Plan benchmark states 26017 s but the correct value is 25986 s.
  // τ=20000 s; ratio=15/55=0.27273; ln(15/55)=−1.29928 (not −1.30083 as stated in plan).
  // t = 20000 × 1.29928 = 25985.66 s ≈ 25986 s. Plan has arithmetic error in ln.
  it("benchmark: m=5000, Cp=2000, UA=500, T_init=60, T_target=20, T_env=5 → t≈25986 s (plan: 26017)", () => {
    const res = cooldownTime.run({
      inputs: {
        mass: { value: 5000, unit: "kg" },
        heatCapacity: { value: 2000, unit: "J/(kg K)" },
        heatLossCoeff: { value: 500, unit: "W/K" },
        initialTemp: { value: 60, unit: "degC" },
        targetTemp: { value: 20, unit: "degC" },
        ambientTemp: { value: 5, unit: "degC" },
      },
    });
    expect(res.result.value).toBeCloseTo(25986, 0);
    expect(res.result.unit).toBe("s");
    expect(res.trustTier).toBe("computed");
  });

  it("accepts non-SI: mass in lbm, temps in degF", () => {
    // m=5000 kg = 11023.1 lbm; T_init=60°C=140°F, T_target=20°C=68°F, T_env=5°C=41°F
    const res = cooldownTime.run({
      inputs: {
        mass: { value: 11023.1, unit: "lbm" },
        heatCapacity: { value: 2000, unit: "J/(kg K)" },
        heatLossCoeff: { value: 500, unit: "W/K" },
        initialTemp: { value: 140, unit: "degF" },
        targetTemp: { value: 68, unit: "degF" },
        ambientTemp: { value: 41, unit: "degF" },
      },
    });
    expect(res.result.value).toBeCloseTo(26017, -2);
  });

  it("throws if T_init <= T_target", () => {
    expect(() =>
      cooldownTime.run({
        inputs: {
          mass: { value: 5000, unit: "kg" },
          heatCapacity: { value: 2000, unit: "J/(kg K)" },
          heatLossCoeff: { value: 500, unit: "W/K" },
          initialTemp: { value: 20, unit: "degC" },
          targetTemp: { value: 20, unit: "degC" },
          ambientTemp: { value: 5, unit: "degC" },
        },
      }),
    ).toThrow();
  });

  it("throws if T_target <= T_env", () => {
    expect(() =>
      cooldownTime.run({
        inputs: {
          mass: { value: 5000, unit: "kg" },
          heatCapacity: { value: 2000, unit: "J/(kg K)" },
          heatLossCoeff: { value: 500, unit: "W/K" },
          initialTemp: { value: 60, unit: "degC" },
          targetTemp: { value: 5, unit: "degC" },
          ambientTemp: { value: 5, unit: "degC" },
        },
      }),
    ).toThrow();
  });

  it("throws on non-positive mass", () => {
    expect(() =>
      cooldownTime.run({
        inputs: {
          mass: { value: 0, unit: "kg" },
          heatCapacity: { value: 2000, unit: "J/(kg K)" },
          heatLossCoeff: { value: 500, unit: "W/K" },
          initialTemp: { value: 60, unit: "degC" },
          targetTemp: { value: 20, unit: "degC" },
          ambientTemp: { value: 5, unit: "degC" },
        },
      }),
    ).toThrow();
  });
});
