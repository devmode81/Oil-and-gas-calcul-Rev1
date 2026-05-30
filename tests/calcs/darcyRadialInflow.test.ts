import { describe, it, expect } from "vitest";
import { darcyRadialInflow } from "../../src/calcs/reservoir/darcyRadialInflow";

describe("darcyRadialInflow", () => {
  it("benchmark: k=50 md, h=50 ft, ΔP=500 psi, μ=1 cp, B=1.2, re=1000 ft, rw=0.5 ft → q≈970.5 STB/d", () => {
    const res = darcyRadialInflow.run({
      inputs: {
        permeability: { value: 50, unit: "md" },
        thickness: { value: 50, unit: "ft" },
        deltaP: { value: 500, unit: "psi" },
        viscosity: { value: 1, unit: "cP" },
        formationVolumeFactor: { value: 1.2, unit: "" },
        drainageRadius: { value: 1000, unit: "ft" },
        wellboreRadius: { value: 0.5, unit: "ft" },
      },
    });
    expect(res.trustTier).toBe("validated");
    expect(res.reference).toBeDefined();
    expect(res.result.unit).toBe("STB/d");
    expect(res.result.value).toBeCloseTo(970.5, 0);
  });

  it("accepts deltaP in bar (500 psi ≈ 34.474 bar)", () => {
    const res = darcyRadialInflow.run({
      inputs: {
        permeability: { value: 50, unit: "md" },
        thickness: { value: 50, unit: "ft" },
        deltaP: { value: 34.474, unit: "bar" },
        viscosity: { value: 1, unit: "cP" },
        formationVolumeFactor: { value: 1.2, unit: "" },
        drainageRadius: { value: 1000, unit: "ft" },
        wellboreRadius: { value: 0.5, unit: "ft" },
      },
    });
    expect(res.result.value).toBeCloseTo(970.5, 0);
  });

  it("accepts viscosity in mPa·s (1 cP = 1 mPa·s)", () => {
    const res = darcyRadialInflow.run({
      inputs: {
        permeability: { value: 50, unit: "md" },
        thickness: { value: 50, unit: "ft" },
        deltaP: { value: 500, unit: "psi" },
        viscosity: { value: 1, unit: "mPa s" },
        formationVolumeFactor: { value: 1.2, unit: "" },
        drainageRadius: { value: 1000, unit: "ft" },
        wellboreRadius: { value: 0.5, unit: "ft" },
      },
    });
    expect(res.result.value).toBeCloseTo(970.5, 0);
  });

  it("throws when re <= rw", () => {
    expect(() =>
      darcyRadialInflow.run({
        inputs: {
          permeability: { value: 50, unit: "md" },
          thickness: { value: 50, unit: "ft" },
          deltaP: { value: 500, unit: "psi" },
          viscosity: { value: 1, unit: "cP" },
          formationVolumeFactor: { value: 1.2, unit: "" },
          drainageRadius: { value: 0.5, unit: "ft" },
          wellboreRadius: { value: 0.5, unit: "ft" },
        },
      }),
    ).toThrow();
  });

  it("throws on permeability <= 0", () => {
    expect(() =>
      darcyRadialInflow.run({
        inputs: {
          permeability: { value: 0, unit: "md" },
          thickness: { value: 50, unit: "ft" },
          deltaP: { value: 500, unit: "psi" },
          viscosity: { value: 1, unit: "cP" },
          formationVolumeFactor: { value: 1.2, unit: "" },
          drainageRadius: { value: 1000, unit: "ft" },
          wellboreRadius: { value: 0.5, unit: "ft" },
        },
      }),
    ).toThrow();
  });
});
