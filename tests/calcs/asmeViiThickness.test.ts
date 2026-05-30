import { describe, it, expect } from "vitest";
import { asmeViiThickness } from "../../src/calcs/mechanical/asmeViiThickness";

describe("asmeViiThickness", () => {
  it("benchmark: P=2e6 Pa, R=0.5 m, S=138e6 Pa → 0.00731 m", () => {
    const res = asmeViiThickness.run({
      inputs: {
        pressure: { value: 2e6, unit: "Pa" },
        innerRadius: { value: 0.5, unit: "m" },
        allowableStress: { value: 138e6, unit: "Pa" },
      },
    });
    expect(res.result.unit).toBe("m");
    expect(res.result.value).toBeCloseTo(0.00731, 5);
  });

  it("non-SI: pressure in psi, radius in inches", () => {
    // P=2e6 Pa = 290.075 psi; R=0.5 m = 19.685 in; S=138e6 Pa = 20015 psi
    const res = asmeViiThickness.run({
      inputs: {
        pressure: { value: 290.075, unit: "psi" },
        innerRadius: { value: 19.685, unit: "in" },
        allowableStress: { value: 20015.2, unit: "psi" },
      },
    });
    expect(res.result.value).toBeCloseTo(0.00731, 4);
  });

  it("non-SI: pressure in bar", () => {
    // P=2e6 Pa = 20 bar
    const res = asmeViiThickness.run({
      inputs: {
        pressure: { value: 20, unit: "bar" },
        innerRadius: { value: 0.5, unit: "m" },
        allowableStress: { value: 138e6, unit: "Pa" },
      },
    });
    expect(res.result.value).toBeCloseTo(0.00731, 5);
  });

  it("non-SI: radius in mm", () => {
    // R=0.5 m = 500 mm
    const res = asmeViiThickness.run({
      inputs: {
        pressure: { value: 2e6, unit: "Pa" },
        innerRadius: { value: 500, unit: "mm" },
        allowableStress: { value: 138e6, unit: "Pa" },
      },
    });
    expect(res.result.value).toBeCloseTo(0.00731, 5);
  });

  it("with corrosion allowance", () => {
    // t_base=0.00731 + CA=0.003 → total=0.01031
    const res = asmeViiThickness.run({
      inputs: {
        pressure: { value: 2e6, unit: "Pa" },
        innerRadius: { value: 0.5, unit: "m" },
        allowableStress: { value: 138e6, unit: "Pa" },
        corrosionAllowance: { value: 3, unit: "mm" },
      },
    });
    expect(res.result.value).toBeCloseTo(0.01031, 4);
  });

  it("throws on non-positive pressure", () => {
    expect(() =>
      asmeViiThickness.run({
        inputs: {
          pressure: { value: 0, unit: "Pa" },
          innerRadius: { value: 0.5, unit: "m" },
          allowableStress: { value: 138e6, unit: "Pa" },
        },
      }),
    ).toThrow();
  });

  it("has trustTier validated and reference", () => {
    const res = asmeViiThickness.run({
      inputs: {
        pressure: { value: 2e6, unit: "Pa" },
        innerRadius: { value: 0.5, unit: "m" },
        allowableStress: { value: 138e6, unit: "Pa" },
      },
    });
    expect(res.trustTier).toBe("validated");
    expect(res.reference).toContain("ASME");
  });
});
