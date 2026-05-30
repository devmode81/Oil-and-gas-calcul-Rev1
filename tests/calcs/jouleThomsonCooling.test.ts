import { describe, it, expect } from "vitest";
import { jouleThomsonCooling } from "../../src/calcs/subsea/jouleThomsonCooling";

describe("jouleThomsonCooling", () => {
  it("benchmark: ΔP=100 bar, μ_JT=0.45 °C/bar → ΔT=45°C", () => {
    const res = jouleThomsonCooling.run({
      inputs: {
        pressureDrop: { value: 100, unit: "bar" },
      },
    });
    expect(res.result.value).toBeCloseTo(45, 2);
    expect(res.result.unit).toBe("degC");
    expect(res.trustTier).toBe("computed");
  });

  it("accepts non-SI: pressure drop in psi", () => {
    // 100 bar = 1450.38 psi
    const res = jouleThomsonCooling.run({
      inputs: {
        pressureDrop: { value: 1450.38, unit: "psi" },
      },
    });
    expect(res.result.value).toBeCloseTo(45, 0);
  });

  it("accepts non-SI: pressure drop in MPa", () => {
    // 100 bar = 10 MPa
    const res = jouleThomsonCooling.run({
      inputs: {
        pressureDrop: { value: 10, unit: "MPa" },
      },
    });
    expect(res.result.value).toBeCloseTo(45, 2);
  });

  it("allows overriding jouleThomsonCoeff via assumptionOverrides", () => {
    const res = jouleThomsonCooling.run({
      inputs: {
        pressureDrop: { value: 100, unit: "bar" },
      },
      assumptionOverrides: {
        jouleThomsonCoeff: { value: 0.30, unit: "degC/bar" },
      },
    });
    expect(res.result.value).toBeCloseTo(30, 2);
  });

  it("throws on negative pressure drop", () => {
    expect(() =>
      jouleThomsonCooling.run({
        inputs: {
          pressureDrop: { value: -1, unit: "bar" },
        },
      }),
    ).toThrow();
  });
});
