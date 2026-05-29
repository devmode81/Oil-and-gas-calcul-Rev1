import { describe, it, expect } from "vitest";
import { pressureDrop } from "../../src/calcs/flow/darcyWeisbach";

describe("pressureDrop", () => {
  const baseInputs = {
    frictionFactor: { value: 0.02, unit: "" },
    length: { value: 100, unit: "m" },
    diameter: { value: 0.1, unit: "m" },
    density: { value: 1000, unit: "kg/m^3" },
    velocity: { value: 2, unit: "m/s" },
  };

  it("computes ΔP = f·(L/D)·(ρ·v²/2) = 40000 Pa", () => {
    const res = pressureDrop.run({ inputs: baseInputs });
    expect(res.result.value).toBeCloseTo(40000, 0);
    expect(res.result.unit).toBe("Pa");
    expect(res.method).toBe("Darcy-Weisbach");
    expect(res.alternativeMethods).toContain("Hazen-Williams");
  });

  it("reports the chosen method when overridden", () => {
    const res = pressureDrop.run({ inputs: baseInputs, method: "Darcy-Weisbach" });
    expect(res.method).toBe("Darcy-Weisbach");
  });

  it("throws on an unsupported method", () => {
    expect(() => pressureDrop.run({ inputs: baseInputs, method: "Bogus" })).toThrow();
  });
});
