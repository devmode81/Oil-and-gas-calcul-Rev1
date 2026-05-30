import { describe, it, expect } from "vitest";
import { collapsePressure } from "../../src/calcs/subsea/collapsePressure";

describe("collapsePressure", () => {
  it("benchmark: t=0.01, D_o=0.3, E=200e9, ν=0.3 → P_cr≈16.28 MPa", () => {
    const res = collapsePressure.run({
      inputs: {
        wallThickness: { value: 0.01, unit: "m" },
        outerDiameter: { value: 0.3, unit: "m" },
        youngsModulus: { value: 200e9, unit: "Pa" },
        poissonRatio: { value: 0.3, unit: "" },
      },
    });
    // result in Pa; check in MPa
    expect(res.result.value / 1e6).toBeCloseTo(16.28, 1);
    expect(res.result.unit).toBe("Pa");
    expect(res.trustTier).toBe("validated");
    expect(res.reference).toBeTruthy();
  });

  it("accepts non-SI: wall thickness in mm, diameter in inch", () => {
    // t=0.01 m = 10 mm; D_o=0.3 m = 11.811 in
    const res = collapsePressure.run({
      inputs: {
        wallThickness: { value: 10, unit: "mm" },
        outerDiameter: { value: 11.811, unit: "in" },
        youngsModulus: { value: 200e9, unit: "Pa" },
        poissonRatio: { value: 0.3, unit: "" },
      },
    });
    expect(res.result.value / 1e6).toBeCloseTo(16.28, 1);
  });

  it("accepts non-SI: E in GPa", () => {
    const res = collapsePressure.run({
      inputs: {
        wallThickness: { value: 0.01, unit: "m" },
        outerDiameter: { value: 0.3, unit: "m" },
        youngsModulus: { value: 200, unit: "GPa" },
        poissonRatio: { value: 0.3, unit: "" },
      },
    });
    expect(res.result.value / 1e6).toBeCloseTo(16.28, 1);
  });

  it("throws if D_o <= 2t (not thin-wall valid)", () => {
    expect(() =>
      collapsePressure.run({
        inputs: {
          wallThickness: { value: 0.15, unit: "m" },
          outerDiameter: { value: 0.3, unit: "m" },
          youngsModulus: { value: 200e9, unit: "Pa" },
          poissonRatio: { value: 0.3, unit: "" },
        },
      }),
    ).toThrow();
  });

  it("throws if t <= 0", () => {
    expect(() =>
      collapsePressure.run({
        inputs: {
          wallThickness: { value: 0, unit: "m" },
          outerDiameter: { value: 0.3, unit: "m" },
          youngsModulus: { value: 200e9, unit: "Pa" },
          poissonRatio: { value: 0.3, unit: "" },
        },
      }),
    ).toThrow();
  });

  it("throws if Poisson's ratio not in (0, 0.5)", () => {
    expect(() =>
      collapsePressure.run({
        inputs: {
          wallThickness: { value: 0.01, unit: "m" },
          outerDiameter: { value: 0.3, unit: "m" },
          youngsModulus: { value: 200e9, unit: "Pa" },
          poissonRatio: { value: 0.5, unit: "" },
        },
      }),
    ).toThrow();
  });
});
