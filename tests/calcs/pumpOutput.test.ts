import { describe, it, expect } from "vitest";
import { pumpOutput } from "../../src/calcs/drilling/pumpOutput";

describe("pumpOutput", () => {
  it("benchmark: D=6 in, stroke=12 in, 3 cyl, η=1 → 0.1050 bbl/stroke", () => {
    const res = pumpOutput.run({
      inputs: {
        linerDiameter: { value: 6, unit: "inch" },
        strokeLength: { value: 12, unit: "inch" },
      },
    });
    expect(res.result.unit).toBe("bbl/stroke");
    expect(res.result.value).toBeCloseTo(0.1050, 3);
    expect(res.trustTier).toBe("computed");
  });

  it("accepts SI inputs: linerDiameter m, strokeLength m", () => {
    const res = pumpOutput.run({
      inputs: {
        linerDiameter: { value: 0.1524, unit: "m" },
        strokeLength: { value: 0.3048, unit: "m" },
      },
    });
    expect(res.result.value).toBeCloseTo(0.1050, 3);
  });

  it("throws on non-positive liner diameter", () => {
    expect(() =>
      pumpOutput.run({
        inputs: {
          linerDiameter: { value: 0, unit: "inch" },
          strokeLength: { value: 12, unit: "inch" },
        },
      })
    ).toThrow();
  });
});
