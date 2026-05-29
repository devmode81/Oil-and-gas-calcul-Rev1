import { describe, it, expect } from "vitest";
import { annularVelocity } from "../../src/calcs/drilling/annularVelocity";

describe("annularVelocity", () => {
  it("benchmark: Q=500 gpm, hole=8.5 in, pipe=5 in → 1.318 m/s", () => {
    const res = annularVelocity.run({
      inputs: {
        flowrate: { value: 500, unit: "gpm" },
        holeDiameter: { value: 8.5, unit: "inch" },
        pipeOuterDiameter: { value: 5, unit: "inch" },
      },
    });
    expect(res.result.unit).toBe("m/s");
    expect(res.result.value).toBeCloseTo(1.318, 2);
    expect(res.trustTier).toBe("computed");
  });

  it("accepts SI inputs: flowrate m^3/s, diameters m", () => {
    // 500 gpm = 0.031545 m3/s, 8.5 in = 0.2159 m, 5 in = 0.127 m
    const res = annularVelocity.run({
      inputs: {
        flowrate: { value: 0.031545, unit: "m^3/s" },
        holeDiameter: { value: 0.2159, unit: "m" },
        pipeOuterDiameter: { value: 0.127, unit: "m" },
      },
    });
    expect(res.result.value).toBeCloseTo(1.318, 2);
  });

  it("throws when pipeOuterDiameter >= holeDiameter", () => {
    expect(() =>
      annularVelocity.run({
        inputs: {
          flowrate: { value: 500, unit: "gpm" },
          holeDiameter: { value: 5, unit: "inch" },
          pipeOuterDiameter: { value: 5, unit: "inch" },
        },
      })
    ).toThrow();
  });
});
