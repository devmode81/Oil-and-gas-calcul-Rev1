import { describe, it, expect } from "vitest";
import { vesselVolume } from "../../src/calcs/geometry/vesselVolume";

describe("vesselVolume", () => {
  it("plain cylinder D=2 m, L=5 m → 15.708 m³", () => {
    const res = vesselVolume.run({
      inputs: { diameter: { value: 2, unit: "m" }, length: { value: 5, unit: "m" } },
    });
    expect(res.result.unit).toBe("m^3");
    expect(res.result.value).toBeCloseTo(15.708, 3);
  });

  it("adds 2:1 elliptical heads → 17.80 m³", () => {
    const res = vesselVolume.run({
      inputs: { diameter: { value: 2, unit: "m" }, length: { value: 5, unit: "m" } },
      method: "2:1elliptical",
    });
    expect(res.result.value).toBeCloseTo(17.802, 2);
    expect(res.method).toContain("2:1");
  });

  it("throws on unknown head type", () => {
    expect(() =>
      vesselVolume.run({ inputs: { diameter: { value: 2, unit: "m" }, length: { value: 5, unit: "m" } }, method: "spherical" }),
    ).toThrow();
  });
});
