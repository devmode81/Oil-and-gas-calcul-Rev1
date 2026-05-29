import { describe, it, expect } from "vitest";
import { stoiipVolumetric } from "../../src/calcs/reservoir/stoiipVolumetric";

describe("stoiipVolumetric", () => {
  it("benchmark: A=500 acre, h=50 ft, phi=0.25, Sw=0.30, Boi=1.2 → N≈28.3 MMstb", () => {
    const res = stoiipVolumetric.run({
      inputs: {
        area: { value: 500, unit: "acre" },
        thickness: { value: 50, unit: "ft" },
        porosity: { value: 0.25, unit: "" },
        waterSaturation: { value: 0.30, unit: "" },
        boi: { value: 1.2, unit: "rb/STB" },
      },
    });
    expect(res.trustTier).toBe("validated");
    expect(res.reference).toBeDefined();
    expect(res.result.unit).toBe("STB");
    expect(res.result.value / 1e6).toBeCloseTo(28.3, 1);
  });

  it("throws on porosity out of range (>1)", () => {
    expect(() =>
      stoiipVolumetric.run({
        inputs: {
          area: { value: 500, unit: "acre" },
          thickness: { value: 50, unit: "ft" },
          porosity: { value: 1.5, unit: "" },
          waterSaturation: { value: 0.30, unit: "" },
          boi: { value: 1.2, unit: "rb/STB" },
        },
      }),
    ).toThrow();
  });

  it("throws on waterSaturation < 0", () => {
    expect(() =>
      stoiipVolumetric.run({
        inputs: {
          area: { value: 500, unit: "acre" },
          thickness: { value: 50, unit: "ft" },
          porosity: { value: 0.25, unit: "" },
          waterSaturation: { value: -0.1, unit: "" },
          boi: { value: 1.2, unit: "rb/STB" },
        },
      }),
    ).toThrow();
  });
});
