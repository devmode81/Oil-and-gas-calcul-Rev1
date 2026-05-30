import { describe, it, expect } from "vitest";
import { ogipVolumetric } from "../../src/calcs/reservoir/ogipVolumetric";

describe("ogipVolumetric", () => {
  it("benchmark: A=500 acre, h=50 ft, phi=0.25, Sw=0.30, Bgi=0.005 ft^3/scf → G≈38.1 Bscf", () => {
    const res = ogipVolumetric.run({
      inputs: {
        area: { value: 500, unit: "acre" },
        thickness: { value: 50, unit: "ft" },
        porosity: { value: 0.25, unit: "" },
        waterSaturation: { value: 0.30, unit: "" },
        bgi: { value: 0.005, unit: "ft^3/scf" },
      },
    });
    expect(res.trustTier).toBe("validated");
    expect(res.reference).toBeDefined();
    expect(res.result.unit).toBe("scf");
    expect(res.result.value / 1e9).toBeCloseTo(38.1, 1);
  });

  it("throws on porosity > 1", () => {
    expect(() =>
      ogipVolumetric.run({
        inputs: {
          area: { value: 500, unit: "acre" },
          thickness: { value: 50, unit: "ft" },
          porosity: { value: 1.1, unit: "" },
          waterSaturation: { value: 0.30, unit: "" },
          bgi: { value: 0.005, unit: "ft^3/scf" },
        },
      }),
    ).toThrow();
  });

  it("throws on bgi <= 0", () => {
    expect(() =>
      ogipVolumetric.run({
        inputs: {
          area: { value: 500, unit: "acre" },
          thickness: { value: 50, unit: "ft" },
          porosity: { value: 0.25, unit: "" },
          waterSaturation: { value: 0.30, unit: "" },
          bgi: { value: 0, unit: "ft^3/scf" },
        },
      }),
    ).toThrow();
  });
});
