import { describe, it, expect } from "vitest";
import { fullLoadCurrent } from "../../src/calcs/electrical/fullLoadCurrent";

describe("fullLoadCurrent", () => {
  it("benchmark: P=75kW, V=415, pf=0.85 → I≈122.8 A", () => {
    const res = fullLoadCurrent.run({
      inputs: {
        ratedPower: { value: 75000, unit: "W" },
        voltage: { value: 415, unit: "V" },
      },
    });
    expect(res.result.unit).toBe("A");
    expect(res.result.value).toBeCloseTo(122.8, 1);
    expect(res.trustTier).toBe("computed");
  });

  it("uses kW and kV inputs", () => {
    const res = fullLoadCurrent.run({
      inputs: {
        ratedPower: { value: 75, unit: "kW" },
        voltage: { value: 0.415, unit: "kV" },
      },
    });
    expect(res.result.value).toBeCloseTo(122.8, 1);
  });

  it("allows overriding power factor assumption", () => {
    const res = fullLoadCurrent.run({
      inputs: {
        ratedPower: { value: 75000, unit: "W" },
        voltage: { value: 415, unit: "V" },
      },
      assumptionOverrides: { powerFactor: { value: 1.0, unit: "" } },
    });
    // I = 75000/(√3·415·1.0) ≈ 104.3 A
    expect(res.result.value).toBeCloseTo(104.3, 1);
  });

  it("throws on non-positive ratedPower", () => {
    expect(() =>
      fullLoadCurrent.run({
        inputs: {
          ratedPower: { value: 0, unit: "W" },
          voltage: { value: 415, unit: "V" },
        },
      }),
    ).toThrow();
  });

  it("throws on non-positive voltage", () => {
    expect(() =>
      fullLoadCurrent.run({
        inputs: {
          ratedPower: { value: 75000, unit: "W" },
          voltage: { value: 0, unit: "V" },
        },
      }),
    ).toThrow();
  });
});
