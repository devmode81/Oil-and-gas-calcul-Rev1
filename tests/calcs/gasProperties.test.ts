import { describe, it, expect } from "vitest";
import { gasProperties } from "../../src/calcs/properties/gasProperties";

describe("gasProperties", () => {
  it("SG=0.65, 120 °F, 1000 psia → Z≈0.887, MW≈18.83", () => {
    const res = gasProperties.run({
      inputs: {
        gasSG: { value: 0.65, unit: "" },
        temperature: { value: 120, unit: "degF" },
        pressure: { value: 1000, unit: "psi" },
      },
    });
    expect(res.result.unit).toBe(""); // Z is the headline (dimensionless)
    expect(res.result.value).toBeCloseTo(0.887, 2);
    const mw = res.steps.find((s) => s.label.includes("Molecular weight"));
    expect(mw?.result?.value).toBeCloseTo(18.83, 2);
    const dens = res.steps.find((s) => s.label.includes("density"));
    expect(dens?.result?.value).toBeGreaterThan(50);
    expect(dens?.result?.value).toBeLessThan(58);
  });

  it("throws on non-positive SG", () => {
    expect(() =>
      gasProperties.run({
        inputs: { gasSG: { value: 0, unit: "" }, temperature: { value: 120, unit: "degF" }, pressure: { value: 1000, unit: "psi" } },
      }),
    ).toThrow();
  });
});
