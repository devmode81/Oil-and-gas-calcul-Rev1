import { describe, it, expect } from "vitest";
import { lineVelocity } from "../../src/calcs/flow/lineVelocity";

describe("lineVelocity", () => {
  it("computes v = Q/A for Q=0.05 m^3/s, D=0.2 m", () => {
    const res = lineVelocity.run({
      inputs: { flowrate: { value: 0.05, unit: "m^3/s" }, diameter: { value: 0.2, unit: "m" } },
    });
    expect(res.result.unit).toBe("m/s");
    expect(res.result.value).toBeCloseTo(1.5915, 3);
    expect(res.trustTier).toBe("computed");
  });

  it("throws on zero diameter", () => {
    expect(() =>
      lineVelocity.run({ inputs: { flowrate: { value: 1, unit: "m^3/s" }, diameter: { value: 0, unit: "m" } } }),
    ).toThrow();
  });
});
