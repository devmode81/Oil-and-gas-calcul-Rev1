import { describe, it, expect } from "vitest";
import { gasFvf } from "../../src/calcs/reservoir/gasFvf";

describe("gasFvf", () => {
  it("benchmark: Z=0.9, T=580 °R, P=2000 psia → Bg≈0.007379 ft^3/scf", () => {
    const res = gasFvf.run({
      inputs: {
        zFactor: { value: 0.9, unit: "" },
        temperature: { value: 580, unit: "rankine" },
        pressure: { value: 2000, unit: "psi" },
      },
    });
    expect(res.trustTier).toBe("computed");
    expect(res.result.unit).toBe("ft^3/scf");
    expect(res.result.value).toBeCloseTo(0.007379, 5);
  });

  it("accepts temperature in degC (≈48.89 degC ≈ 580 °R)", () => {
    // 580 R = 322.222 K = 48.889 degC
    const res = gasFvf.run({
      inputs: {
        zFactor: { value: 0.9, unit: "" },
        temperature: { value: 48.889, unit: "degC" },
        pressure: { value: 2000, unit: "psi" },
      },
    });
    expect(res.result.value).toBeCloseTo(0.007379, 4);
  });

  it("accepts pressure in bar", () => {
    // 2000 psi ≈ 137.895 bar
    const res = gasFvf.run({
      inputs: {
        zFactor: { value: 0.9, unit: "" },
        temperature: { value: 580, unit: "rankine" },
        pressure: { value: 137.895, unit: "bar" },
      },
    });
    expect(res.result.value).toBeCloseTo(0.007379, 3);
  });

  it("throws on Z <= 0", () => {
    expect(() =>
      gasFvf.run({
        inputs: {
          zFactor: { value: 0, unit: "" },
          temperature: { value: 580, unit: "rankine" },
          pressure: { value: 2000, unit: "psi" },
        },
      }),
    ).toThrow();
  });

  it("throws on pressure <= 0", () => {
    expect(() =>
      gasFvf.run({
        inputs: {
          zFactor: { value: 0.9, unit: "" },
          temperature: { value: 580, unit: "rankine" },
          pressure: { value: 0, unit: "psi" },
        },
      }),
    ).toThrow();
  });
});
