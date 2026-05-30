import { describe, it, expect } from "vitest";
import { insulationHeatLoss } from "../../src/calcs/subsea/insulationHeatLoss";

describe("insulationHeatLoss", () => {
  it("benchmark: r1=0.05, r2=0.10, L=100, k=0.04, ΔT=50 → q=1813 W", () => {
    const res = insulationHeatLoss.run({
      inputs: {
        pipeOuterRadius: { value: 0.05, unit: "m" },
        insulationOuterRadius: { value: 0.10, unit: "m" },
        length: { value: 100, unit: "m" },
        conductivity: { value: 0.04, unit: "W/(m K)" },
        deltaTemp: { value: 50, unit: "K" },
      },
    });
    expect(res.result.value).toBeCloseTo(1813, 0);
    expect(res.result.unit).toBe("W");
    expect(res.trustTier).toBe("computed");
  });

  it("accepts non-SI: radii in inches, length in ft, deltaTemp in degF", () => {
    // r1=0.05 m = 1.9685 in, r2=0.10 m = 3.937 in, L=100 m = 328.084 ft, ΔT=50 K = 90 degF (delta)
    const res = insulationHeatLoss.run({
      inputs: {
        pipeOuterRadius: { value: 1.9685, unit: "in" },
        insulationOuterRadius: { value: 3.937, unit: "in" },
        length: { value: 328.084, unit: "ft" },
        conductivity: { value: 0.04, unit: "W/(m K)" },
        deltaTemp: { value: 90, unit: "degF" },
      },
    });
    expect(res.result.value).toBeCloseTo(1813, -1);
  });

  it("throws if r2 <= r1", () => {
    expect(() =>
      insulationHeatLoss.run({
        inputs: {
          pipeOuterRadius: { value: 0.10, unit: "m" },
          insulationOuterRadius: { value: 0.05, unit: "m" },
          length: { value: 100, unit: "m" },
          conductivity: { value: 0.04, unit: "W/(m K)" },
          deltaTemp: { value: 50, unit: "K" },
        },
      }),
    ).toThrow();
  });

  it("throws if r1 <= 0", () => {
    expect(() =>
      insulationHeatLoss.run({
        inputs: {
          pipeOuterRadius: { value: 0, unit: "m" },
          insulationOuterRadius: { value: 0.10, unit: "m" },
          length: { value: 100, unit: "m" },
          conductivity: { value: 0.04, unit: "W/(m K)" },
          deltaTemp: { value: 50, unit: "K" },
        },
      }),
    ).toThrow();
  });

  it("throws if conductivity <= 0", () => {
    expect(() =>
      insulationHeatLoss.run({
        inputs: {
          pipeOuterRadius: { value: 0.05, unit: "m" },
          insulationOuterRadius: { value: 0.10, unit: "m" },
          length: { value: 100, unit: "m" },
          conductivity: { value: 0, unit: "W/(m K)" },
          deltaTemp: { value: 50, unit: "K" },
        },
      }),
    ).toThrow();
  });
});
