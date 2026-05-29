import { describe, it, expect } from "vitest";
import { colebrookFrictionFactor } from "../../src/calcs/flow/colebrook";

describe("colebrookFrictionFactor", () => {
  it("matches a Moody-chart point: Re=1e5, eps/D=1e-4 -> f≈0.0185", () => {
    const res = colebrookFrictionFactor.run({
      inputs: { reynolds: { value: 1e5, unit: "" }, relativeRoughness: { value: 1e-4, unit: "" } },
    });
    expect(res.result.value).toBeCloseTo(0.0185, 3);
    expect(res.result.unit).toBe("");
  });

  it("uses laminar f=64/Re below Re=2300", () => {
    const res = colebrookFrictionFactor.run({
      inputs: { reynolds: { value: 1000, unit: "" }, relativeRoughness: { value: 1e-4, unit: "" } },
    });
    expect(res.result.value).toBeCloseTo(0.064, 5);
    expect(res.method).toContain("Laminar");
  });

  it("throws on non-positive Reynolds number", () => {
    expect(() =>
      colebrookFrictionFactor.run({ inputs: { reynolds: { value: 0, unit: "" }, relativeRoughness: { value: 1e-4, unit: "" } } }),
    ).toThrow();
  });
});
