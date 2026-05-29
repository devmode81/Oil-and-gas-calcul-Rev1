import { describe, it, expect } from "vitest";
import { cylinderVolume } from "../../src/calcs/geometry/cylinderVolume";

describe("cylinderVolume", () => {
  it("computes V = π·r²·L for r=3 m, L=100 m", () => {
    const res = cylinderVolume.run({
      inputs: { radius: { value: 3, unit: "m" }, length: { value: 100, unit: "m" } },
    });
    expect(res.result.unit).toBe("m^3");
    expect(res.result.value).toBeCloseTo(2827.433, 2);
    expect(res.trustTier).toBe("computed");
    expect(res.formula).toContain("π");
    expect(res.steps.length).toBeGreaterThan(0);
  });
});
