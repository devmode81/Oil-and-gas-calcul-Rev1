import { describe, it, expect } from "vitest";
import { barlowWallThickness } from "../../src/calcs/mechanical/barlow";

describe("barlowWallThickness", () => {
  it("computes t = P·D/(2·S·E) = 0.25 in", () => {
    const res = barlowWallThickness.run({
      inputs: {
        pressure: { value: 1000, unit: "psi" },
        outsideDiameter: { value: 10, unit: "inch" },
        allowableStress: { value: 20000, unit: "psi" },
      },
      assumptionOverrides: { E: { value: 1, unit: "" } },
    });
    expect(res.result.unit).toBe("inch");
    expect(res.result.value).toBeCloseTo(0.25, 4);
    expect(res.trustTier).toBe("validated");
    expect(res.reference).toContain("Barlow");
  });
});
