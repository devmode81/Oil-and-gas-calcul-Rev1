import { describe, it, expect } from "vitest";
import { generatorSizing } from "../../src/calcs/electrical/generatorSizing";

describe("generatorSizing", () => {
  it("benchmark: P=200kW, pf=0.8, startingFactor=0.25, diversity=1.0 → S=312500 VA", () => {
    const res = generatorSizing.run({
      inputs: {
        connectedLoad: { value: 200000, unit: "W" },
      },
    });
    expect(res.result.unit).toBe("VA");
    expect(res.result.value).toBeCloseTo(312500, 0);
    expect(res.trustTier).toBe("computed");
  });

  it("uses kW input", () => {
    const res = generatorSizing.run({
      inputs: {
        connectedLoad: { value: 200, unit: "kW" },
      },
    });
    expect(res.result.value).toBeCloseTo(312500, 0);
  });

  it("allows overriding power factor assumption", () => {
    // P=200kW, pf=1.0, startingFactor=0.25 → S=(200000/1.0)·1.25 = 250000 VA
    const res = generatorSizing.run({
      inputs: {
        connectedLoad: { value: 200000, unit: "W" },
      },
      assumptionOverrides: { powerFactor: { value: 1.0, unit: "" } },
    });
    expect(res.result.value).toBeCloseTo(250000, 0);
  });

  it("allows overriding starting factor", () => {
    // P=200kW, pf=0.8, startingFactor=0 → S=200000/0.8=250000
    const res = generatorSizing.run({
      inputs: {
        connectedLoad: { value: 200000, unit: "W" },
      },
      assumptionOverrides: { startingFactor: { value: 0, unit: "" } },
    });
    expect(res.result.value).toBeCloseTo(250000, 0);
  });

  it("throws on non-positive connectedLoad", () => {
    expect(() =>
      generatorSizing.run({
        inputs: {
          connectedLoad: { value: 0, unit: "W" },
        },
      }),
    ).toThrow();
  });
});
