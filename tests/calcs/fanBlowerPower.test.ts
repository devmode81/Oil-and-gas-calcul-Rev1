import { describe, it, expect } from "vitest";
import { fanBlowerPower } from "../../src/calcs/mechanical/fanBlowerPower";

describe("fanBlowerPower", () => {
  it("benchmark: Q=5 m³/s, ΔP=2000 Pa, η=0.70 → 14286 W", () => {
    const res = fanBlowerPower.run({
      inputs: {
        flowrate: { value: 5, unit: "m^3/s" },
        pressureRise: { value: 2000, unit: "Pa" },
      },
      assumptionOverrides: { efficiency: { value: 0.70, unit: "" } },
    });
    expect(res.result.unit).toBe("W");
    expect(res.result.value).toBeCloseTo(14286, 0);
  });

  it("non-SI: flowrate in m³/min", () => {
    // 5 m³/s = 300 m³/min
    const res = fanBlowerPower.run({
      inputs: {
        flowrate: { value: 300, unit: "m^3/min" },
        pressureRise: { value: 2000, unit: "Pa" },
      },
      assumptionOverrides: { efficiency: { value: 0.70, unit: "" } },
    });
    expect(res.result.value).toBeCloseTo(14286, 0);
  });

  it("non-SI: pressure rise in mbar", () => {
    // 2000 Pa = 20 mbar
    const res = fanBlowerPower.run({
      inputs: {
        flowrate: { value: 5, unit: "m^3/s" },
        pressureRise: { value: 20, unit: "mbar" },
      },
      assumptionOverrides: { efficiency: { value: 0.70, unit: "" } },
    });
    expect(res.result.value).toBeCloseTo(14286, 0);
  });

  it("non-SI: flowrate in ft³/s", () => {
    // 5 m³/s = 176.573 ft³/s
    const res = fanBlowerPower.run({
      inputs: {
        flowrate: { value: 176.573, unit: "ft^3/s" },
        pressureRise: { value: 2000, unit: "Pa" },
      },
      assumptionOverrides: { efficiency: { value: 0.70, unit: "" } },
    });
    expect(res.result.value).toBeCloseTo(14286, 0);
  });

  it("uses default efficiency 0.70", () => {
    const res = fanBlowerPower.run({
      inputs: {
        flowrate: { value: 5, unit: "m^3/s" },
        pressureRise: { value: 2000, unit: "Pa" },
      },
    });
    expect(res.result.value).toBeCloseTo(14286, 0);
  });

  it("throws on negative flowrate", () => {
    expect(() =>
      fanBlowerPower.run({
        inputs: {
          flowrate: { value: -1, unit: "m^3/s" },
          pressureRise: { value: 2000, unit: "Pa" },
        },
      }),
    ).toThrow();
  });

  it("throws on non-positive efficiency", () => {
    expect(() =>
      fanBlowerPower.run({
        inputs: {
          flowrate: { value: 5, unit: "m^3/s" },
          pressureRise: { value: 2000, unit: "Pa" },
        },
        assumptionOverrides: { efficiency: { value: 0, unit: "" } },
      }),
    ).toThrow();
  });
});
