import { describe, it, expect } from "vitest";
import { powerTriangle } from "../../src/calcs/electrical/powerTriangle";

describe("powerTriangle", () => {
  it("from_PQ: P=100kW, Q=75kVAR → S=125kVA, pf=0.8", () => {
    const res = powerTriangle.run({
      inputs: {
        activePower: { value: 100000, unit: "W" },
        reactivePower: { value: 75000, unit: "VAR" },
      },
      method: "from_PQ",
    });
    expect(res.result.unit).toBe("VA");
    expect(res.result.value).toBeCloseTo(125000, 0);
    const pfStep = res.steps.find((s) => s.label.includes("pf") || s.label.includes("Power factor"));
    expect(pfStep?.result?.value).toBeCloseTo(0.8, 4);
    expect(res.trustTier).toBe("computed");
  });

  it("from_PQ: default method when unspecified", () => {
    const res = powerTriangle.run({
      inputs: {
        activePower: { value: 100000, unit: "W" },
        reactivePower: { value: 75000, unit: "VAR" },
      },
    });
    expect(res.result.value).toBeCloseTo(125000, 0);
  });

  it("from_PQ: uses kW and kVAR inputs", () => {
    const res = powerTriangle.run({
      inputs: {
        activePower: { value: 100, unit: "kW" },
        reactivePower: { value: 75, unit: "kW" }, // treat kVAR as kW (same dimension)
      },
      method: "from_PQ",
    });
    expect(res.result.value).toBeCloseTo(125000, 0);
  });

  it("from_Ppf: P=100kW, pf=0.8 → Q=75kVAR", () => {
    const res = powerTriangle.run({
      inputs: {
        activePower: { value: 100000, unit: "W" },
        powerFactor: { value: 0.8, unit: "" },
      },
      method: "from_Ppf",
    });
    expect(res.result.unit).toBe("VAR");
    expect(res.result.value).toBeCloseTo(75000, 0);
  });

  it("from_PS: P=100kW, S=125kVA → pf=0.8", () => {
    const res = powerTriangle.run({
      inputs: {
        activePower: { value: 100000, unit: "W" },
        apparentPower: { value: 125000, unit: "VA" },
      },
      method: "from_PS",
    });
    expect(res.result.unit).toBe("");
    expect(res.result.value).toBeCloseTo(0.8, 4);
  });

  it("from_Ppf: uses kW input", () => {
    const res = powerTriangle.run({
      inputs: {
        activePower: { value: 100, unit: "kW" },
        powerFactor: { value: 0.8, unit: "" },
      },
      method: "from_Ppf",
    });
    expect(res.result.value).toBeCloseTo(75000, 0);
  });

  it("throws on invalid pf in from_Ppf", () => {
    expect(() =>
      powerTriangle.run({
        inputs: {
          activePower: { value: 100000, unit: "W" },
          powerFactor: { value: 1.5, unit: "" },
        },
        method: "from_Ppf",
      }),
    ).toThrow();
  });
});
