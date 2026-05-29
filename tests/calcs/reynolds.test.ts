import { describe, it, expect } from "vitest";
import { reynolds } from "../../src/calcs/fluids/reynolds";

describe("reynolds", () => {
  it("computes Re = ρ·v·D/μ", () => {
    const res = reynolds.run({
      inputs: {
        density: { value: 1000, unit: "kg/m^3" },
        velocity: { value: 2, unit: "m/s" },
        diameter: { value: 0.1, unit: "m" },
        viscosity: { value: 0.001, unit: "Pa s" },
      },
    });
    expect(res.result.value).toBeCloseTo(200000, 0);
    expect(res.result.unit).toBe(""); // dimensionless
    expect(res.steps.length).toBeGreaterThan(0);
  });

  it("accepts viscosity in cP", () => {
    const res = reynolds.run({
      inputs: {
        density: { value: 1000, unit: "kg/m^3" },
        velocity: { value: 2, unit: "m/s" },
        diameter: { value: 0.1, unit: "m" },
        viscosity: { value: 1, unit: "cP" },
      },
    });
    expect(res.result.value).toBeCloseTo(200000, 0);
  });
});
