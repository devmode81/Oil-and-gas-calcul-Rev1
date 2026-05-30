import { describe, it, expect } from "vitest";
import { heatExchangerDuty } from "../../src/calcs/mechanical/heatExchangerDuty";

describe("heatExchangerDuty", () => {
  it("benchmark: ṁ=10, Cp=4182, T_in=20°C, T_out=80°C → 2.509 MW", () => {
    const res = heatExchangerDuty.run({
      inputs: {
        massFlowrate: { value: 10, unit: "kg/s" },
        heatCapacity: { value: 4182, unit: "J/(kg K)" },
        tempIn: { value: 20, unit: "degC" },
        tempOut: { value: 80, unit: "degC" },
      },
    });
    expect(res.result.unit).toBe("W");
    expect(res.result.value / 1e6).toBeCloseTo(2.509, 2);
  });

  it("non-SI: temps in degF", () => {
    // 20°C = 68°F; 80°C = 176°F; ΔT = 60 K
    const res = heatExchangerDuty.run({
      inputs: {
        massFlowrate: { value: 10, unit: "kg/s" },
        heatCapacity: { value: 4182, unit: "J/(kg K)" },
        tempIn: { value: 68, unit: "degF" },
        tempOut: { value: 176, unit: "degF" },
      },
    });
    expect(res.result.value / 1e6).toBeCloseTo(2.509, 2);
  });

  it("non-SI: mass flowrate in lbm/s", () => {
    // 10 kg/s = 22.0462 lbm/s
    const res = heatExchangerDuty.run({
      inputs: {
        massFlowrate: { value: 22.0462, unit: "lbm/s" },
        heatCapacity: { value: 4182, unit: "J/(kg K)" },
        tempIn: { value: 20, unit: "degC" },
        tempOut: { value: 80, unit: "degC" },
      },
    });
    expect(res.result.value / 1e6).toBeCloseTo(2.509, 2);
  });

  it("non-SI: temps in K", () => {
    // 20°C = 293.15 K; 80°C = 353.15 K
    const res = heatExchangerDuty.run({
      inputs: {
        massFlowrate: { value: 10, unit: "kg/s" },
        heatCapacity: { value: 4182, unit: "J/(kg K)" },
        tempIn: { value: 293.15, unit: "K" },
        tempOut: { value: 353.15, unit: "K" },
      },
    });
    expect(res.result.value / 1e6).toBeCloseTo(2.509, 2);
  });

  it("throws on non-positive Cp", () => {
    expect(() =>
      heatExchangerDuty.run({
        inputs: {
          massFlowrate: { value: 10, unit: "kg/s" },
          heatCapacity: { value: 0, unit: "J/(kg K)" },
          tempIn: { value: 20, unit: "degC" },
          tempOut: { value: 80, unit: "degC" },
        },
      }),
    ).toThrow();
  });

  it("throws on negative massFlowrate", () => {
    expect(() =>
      heatExchangerDuty.run({
        inputs: {
          massFlowrate: { value: -1, unit: "kg/s" },
          heatCapacity: { value: 4182, unit: "J/(kg K)" },
          tempIn: { value: 20, unit: "degC" },
          tempOut: { value: 80, unit: "degC" },
        },
      }),
    ).toThrow();
  });
});
