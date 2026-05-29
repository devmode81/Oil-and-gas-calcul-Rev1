import { describe, it, expect } from "vitest";
import { bitNozzleVelocity } from "../../src/calcs/drilling/bitNozzleVelocity";

describe("bitNozzleVelocity", () => {
  it("benchmark: Q=500 gpm, TFA=0.5 in², MW=10 ppg → v=97.79 m/s, ΔP≈921 psi", () => {
    const res = bitNozzleVelocity.run({
      inputs: {
        flowrate: { value: 500, unit: "gpm" },
        totalFlowArea: { value: 0.5, unit: "inch^2" },
        mudWeight: { value: 10, unit: "ppg" },
      },
    });
    expect(res.result.unit).toBe("m/s");
    expect(res.result.value).toBeCloseTo(97.79, 1);
    expect(res.trustTier).toBe("computed");
    // Check bit dP step (in psi) is present and ≈ 921 psi
    const dPStep = res.steps.find((s) => s.label.toLowerCase().includes("psi"));
    expect(dPStep?.result?.value).toBeCloseTo(921, 0);
  });

  it("accepts SI inputs: flowrate m^3/s, totalFlowArea m^2, mudWeight kg/m^3", () => {
    const res = bitNozzleVelocity.run({
      inputs: {
        flowrate: { value: 0.031545, unit: "m^3/s" },
        totalFlowArea: { value: 0.00032258, unit: "m^2" },
        mudWeight: { value: 1198.26, unit: "kg/m^3" },
      },
    });
    expect(res.result.value).toBeCloseTo(97.79, 1);
  });

  it("throws on non-positive TFA", () => {
    expect(() =>
      bitNozzleVelocity.run({
        inputs: {
          flowrate: { value: 500, unit: "gpm" },
          totalFlowArea: { value: 0, unit: "inch^2" },
          mudWeight: { value: 10, unit: "ppg" },
        },
      })
    ).toThrow();
  });
});
