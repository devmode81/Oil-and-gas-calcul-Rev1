import { describe, it, expect } from "vitest";
import { npshAvailable } from "../../src/calcs/mechanical/npsh";

describe("npshAvailable", () => {
  it("computes NPSHa = (P_s − P_v)/(ρg) + z_s − h_f", () => {
    const res = npshAvailable.run({
      inputs: {
        suctionPressure: { value: 101325, unit: "Pa" },
        vaporPressure: { value: 2339, unit: "Pa" },
        density: { value: 998, unit: "kg/m^3" },
        staticHead: { value: 2, unit: "m" },
        frictionLoss: { value: 0.5, unit: "m" },
      },
    });
    expect(res.result.unit).toBe("m");
    expect(res.result.value).toBeCloseTo(11.615, 2);
  });

  it("throws on non-positive density", () => {
    expect(() =>
      npshAvailable.run({
        inputs: {
          suctionPressure: { value: 101325, unit: "Pa" },
          vaporPressure: { value: 2339, unit: "Pa" },
          density: { value: 0, unit: "kg/m^3" },
          staticHead: { value: 2, unit: "m" },
          frictionLoss: { value: 0.5, unit: "m" },
        },
      }),
    ).toThrow();
  });
});
