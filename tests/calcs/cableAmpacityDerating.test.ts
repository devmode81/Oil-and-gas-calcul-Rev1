import { describe, it, expect } from "vitest";
import { cableAmpacityDerating } from "../../src/calcs/electrical/cableAmpacityDerating";

describe("cableAmpacityDerating", () => {
  it("benchmark: I_base=100, k_temp=0.87, k_group=0.70 → 60.9 A", () => {
    const res = cableAmpacityDerating.run({
      inputs: {
        baseAmpacity: { value: 100, unit: "A" },
        tempDeratingFactor: { value: 0.87, unit: "" },
        groupDeratingFactor: { value: 0.70, unit: "" },
      },
    });
    expect(res.result.unit).toBe("A");
    expect(res.result.value).toBeCloseTo(60.9, 1);
    expect(res.trustTier).toBe("validated");
    expect(res.reference).toContain("IEC 60364");
  });

  it("defaults to factors of 1.0 (no derating)", () => {
    const res = cableAmpacityDerating.run({
      inputs: {
        baseAmpacity: { value: 120, unit: "A" },
      },
    });
    expect(res.result.value).toBeCloseTo(120, 1);
  });

  it("allows overriding tempDeratingFactor assumption", () => {
    const res = cableAmpacityDerating.run({
      inputs: {
        baseAmpacity: { value: 100, unit: "A" },
      },
      assumptionOverrides: {
        tempDeratingFactor: { value: 0.9, unit: "" },
      },
    });
    expect(res.result.value).toBeCloseTo(90, 1);
  });

  it("throws on non-positive baseAmpacity", () => {
    expect(() =>
      cableAmpacityDerating.run({
        inputs: {
          baseAmpacity: { value: 0, unit: "A" },
        },
      }),
    ).toThrow();
  });

  it("throws on non-positive derating factor", () => {
    expect(() =>
      cableAmpacityDerating.run({
        inputs: {
          baseAmpacity: { value: 100, unit: "A" },
          tempDeratingFactor: { value: 0, unit: "" },
          groupDeratingFactor: { value: 0.7, unit: "" },
        },
      }),
    ).toThrow();
  });
});
