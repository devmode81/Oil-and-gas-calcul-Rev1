import { describe, it, expect } from "vitest";
import { separatorSizing } from "../../src/calcs/process/separatorSizing";

describe("separatorSizing", () => {
  it("Souders-Brown: K=0.107, ρL=800, ρg=20, Qg=0.5 → D≈0.976 m", () => {
    const res = separatorSizing.run({
      inputs: {
        liquidDensity: { value: 800, unit: "kg/m^3" },
        gasDensity: { value: 20, unit: "kg/m^3" },
        gasFlowrate: { value: 0.5, unit: "m^3/s" },
      },
    });
    expect(res.result.unit).toBe("m");
    expect(res.result.value).toBeCloseTo(0.976, 3);
    expect(res.trustTier).toBe("validated");
    expect(res.reference).toContain("Souders");
    const vmax = res.steps.find((s) => s.label.includes("vapour"));
    expect(vmax?.result?.value).toBeCloseTo(0.6682, 3);
  });

  it("throws when gas density >= liquid density", () => {
    expect(() =>
      separatorSizing.run({
        inputs: {
          liquidDensity: { value: 20, unit: "kg/m^3" },
          gasDensity: { value: 20, unit: "kg/m^3" },
          gasFlowrate: { value: 0.5, unit: "m^3/s" },
        },
      }),
    ).toThrow();
  });
});
