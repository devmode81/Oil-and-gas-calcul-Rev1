import { describe, it, expect } from "vitest";
import { pumpPower } from "../../src/calcs/mechanical/pumpPower";

describe("pumpPower", () => {
  it("computes hydraulic & brake power (Q=0.05, H=50 m, ρ=1000, η=0.70)", () => {
    const res = pumpPower.run({
      inputs: {
        flowrate: { value: 0.05, unit: "m^3/s" },
        head: { value: 50, unit: "m" },
        density: { value: 1000, unit: "kg/m^3" },
      },
    });
    expect(res.result.unit).toBe("W");
    expect(res.result.value).toBeCloseTo(24516.6, 0); // hydraulic power
    const brake = res.steps.find((s) => s.label.includes("Brake"));
    expect(brake?.result?.value).toBeCloseTo(35023.8, 0);
  });

  it("derives head from differential pressure", () => {
    const res = pumpPower.run({
      inputs: {
        flowrate: { value: 0.05, unit: "m^3/s" },
        differentialPressure: { value: 490332.5, unit: "Pa" }, // ρgH for H=50, ρ=1000
        density: { value: 1000, unit: "kg/m^3" },
      },
    });
    expect(res.result.value).toBeCloseTo(24516.6, 0);
  });

  it("throws on non-positive density", () => {
    expect(() =>
      pumpPower.run({ inputs: { flowrate: { value: 1, unit: "m^3/s" }, head: { value: 1, unit: "m" }, density: { value: 0, unit: "kg/m^3" } } }),
    ).toThrow();
  });
});
