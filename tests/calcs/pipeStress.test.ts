import { describe, it, expect } from "vitest";
import { pipeStress } from "../../src/calcs/mechanical/pipeStress";

describe("pipeStress", () => {
  it("benchmark: P=5e6 Pa, D=0.3 m, t=0.01 m → hoop=75 MPa, long=37.5 MPa", () => {
    const res = pipeStress.run({
      inputs: {
        pressure: { value: 5e6, unit: "Pa" },
        outerDiameter: { value: 0.3, unit: "m" },
        wallThickness: { value: 0.01, unit: "m" },
      },
    });
    expect(res.result.unit).toBe("Pa");
    expect(res.result.value / 1e6).toBeCloseTo(75, 2);
    const longStep = res.steps.find((s) => s.label.toLowerCase().includes("longitud"));
    expect(longStep?.result?.value ?? 0).toBeCloseTo(37.5e6, -3);
  });

  it("non-SI: pressure in psi", () => {
    // P=5e6 Pa = 725.19 psi; D=0.3 m; t=0.01 m
    const res = pipeStress.run({
      inputs: {
        pressure: { value: 725.19, unit: "psi" },
        outerDiameter: { value: 0.3, unit: "m" },
        wallThickness: { value: 0.01, unit: "m" },
      },
    });
    expect(res.result.value / 1e6).toBeCloseTo(75, 1);
  });

  it("non-SI: diameter in inches", () => {
    // D=0.3 m = 11.811 in; t=0.01 m = 0.3937 in
    const res = pipeStress.run({
      inputs: {
        pressure: { value: 5e6, unit: "Pa" },
        outerDiameter: { value: 11.811, unit: "in" },
        wallThickness: { value: 0.3937, unit: "in" },
      },
    });
    expect(res.result.value / 1e6).toBeCloseTo(75, 1);
  });

  it("non-SI: pressure in bar", () => {
    // P=5e6 Pa = 50 bar
    const res = pipeStress.run({
      inputs: {
        pressure: { value: 50, unit: "bar" },
        outerDiameter: { value: 0.3, unit: "m" },
        wallThickness: { value: 0.01, unit: "m" },
      },
    });
    expect(res.result.value / 1e6).toBeCloseTo(75, 2);
  });

  it("throws when wall thickness >= outer radius", () => {
    expect(() =>
      pipeStress.run({
        inputs: {
          pressure: { value: 5e6, unit: "Pa" },
          outerDiameter: { value: 0.3, unit: "m" },
          wallThickness: { value: 0.16, unit: "m" }, // 2t > D
        },
      }),
    ).toThrow();
  });

  it("throws on non-positive pressure", () => {
    expect(() =>
      pipeStress.run({
        inputs: {
          pressure: { value: 0, unit: "Pa" },
          outerDiameter: { value: 0.3, unit: "m" },
          wallThickness: { value: 0.01, unit: "m" },
        },
      }),
    ).toThrow();
  });
});
