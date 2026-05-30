import { describe, it, expect } from "vitest";
import { pipelinePressureDrop } from "../../src/calcs/subsea/pipelinePressureDrop";

describe("pipelinePressureDrop", () => {
  it("computes friction + elevation ΔP (benchmark: 712266 Pa)", () => {
    const res = pipelinePressureDrop.run({
      inputs: {
        frictionFactor: { value: 0.02, unit: "" },
        length: { value: 1000, unit: "m" },
        diameter: { value: 0.1, unit: "m" },
        density: { value: 800, unit: "kg/m^3" },
        velocity: { value: 2, unit: "m/s" },
        elevationChange: { value: 50, unit: "m" },
      },
    });
    expect(res.result.value).toBeCloseTo(712266, 0);
    expect(res.result.unit).toBe("Pa");
    expect(res.trustTier).toBe("computed");
  });

  it("accepts non-SI units: length in km, diameter in inch, velocity in ft/s", () => {
    // Same scenario: L=1 km, D=~3.937 inch, v=2 m/s (≈6.5617 ft/s), Δz=50 m
    const res = pipelinePressureDrop.run({
      inputs: {
        frictionFactor: { value: 0.02, unit: "" },
        length: { value: 1, unit: "km" },
        diameter: { value: 3.937, unit: "in" },
        density: { value: 800, unit: "kg/m^3" },
        velocity: { value: 6.56168, unit: "ft/s" },
        elevationChange: { value: 50, unit: "m" },
      },
    });
    // Should be very close to 712266 Pa
    expect(res.result.value).toBeCloseTo(712266, -2);
  });

  it("zero elevation gives only friction drop", () => {
    const res = pipelinePressureDrop.run({
      inputs: {
        frictionFactor: { value: 0.02, unit: "" },
        length: { value: 1000, unit: "m" },
        diameter: { value: 0.1, unit: "m" },
        density: { value: 800, unit: "kg/m^3" },
        velocity: { value: 2, unit: "m/s" },
        elevationChange: { value: 0, unit: "m" },
      },
    });
    // ΔP_f = 0.02 * (1000/0.1) * (800*4/2) = 0.02*10000*1600 = 320000
    expect(res.result.value).toBeCloseTo(320000, 0);
  });

  it("throws on non-positive diameter", () => {
    expect(() =>
      pipelinePressureDrop.run({
        inputs: {
          frictionFactor: { value: 0.02, unit: "" },
          length: { value: 100, unit: "m" },
          diameter: { value: 0, unit: "m" },
          density: { value: 800, unit: "kg/m^3" },
          velocity: { value: 2, unit: "m/s" },
          elevationChange: { value: 0, unit: "m" },
        },
      }),
    ).toThrow();
  });

  it("throws on non-positive density", () => {
    expect(() =>
      pipelinePressureDrop.run({
        inputs: {
          frictionFactor: { value: 0.02, unit: "" },
          length: { value: 100, unit: "m" },
          diameter: { value: 0.1, unit: "m" },
          density: { value: -1, unit: "kg/m^3" },
          velocity: { value: 2, unit: "m/s" },
          elevationChange: { value: 0, unit: "m" },
        },
      }),
    ).toThrow();
  });
});
