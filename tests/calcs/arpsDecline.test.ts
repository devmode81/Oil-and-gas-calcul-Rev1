import { describe, it, expect } from "vitest";
import { arpsDecline } from "../../src/calcs/reservoir/arpsDecline";

describe("arpsDecline", () => {
  it("benchmark exponential: qi=1000, D=0.15/yr, t=2yr → q≈740.8 STB/d", () => {
    const res = arpsDecline.run({
      inputs: {
        initialRate: { value: 1000, unit: "STB/d" },
        declineRate: { value: 0.15, unit: "" },
        time: { value: 2, unit: "" },
      },
      method: "exponential",
    });
    expect(res.trustTier).toBe("computed");
    expect(res.result.unit).toBe("STB/d");
    expect(res.result.value).toBeCloseTo(740.8, 1);
  });

  it("benchmark hyperbolic: qi=1000, D=0.15/yr, b=0.5, t=2yr → q≈756.1 STB/d", () => {
    const res = arpsDecline.run({
      inputs: {
        initialRate: { value: 1000, unit: "STB/d" },
        declineRate: { value: 0.15, unit: "" },
        time: { value: 2, unit: "" },
        bExponent: { value: 0.5, unit: "" },
      },
      method: "hyperbolic",
    });
    expect(res.trustTier).toBe("computed");
    expect(res.result.unit).toBe("STB/d");
    expect(res.result.value).toBeCloseTo(756.1, 1);
  });

  it("defaults to exponential when no method specified", () => {
    const res = arpsDecline.run({
      inputs: {
        initialRate: { value: 1000, unit: "STB/d" },
        declineRate: { value: 0.15, unit: "" },
        time: { value: 2, unit: "" },
      },
    });
    expect(res.result.value).toBeCloseTo(740.8, 1);
  });

  it("alternativeMethods includes both exponential and hyperbolic", () => {
    const res = arpsDecline.run({
      inputs: {
        initialRate: { value: 1000, unit: "STB/d" },
        declineRate: { value: 0.15, unit: "" },
        time: { value: 2, unit: "" },
      },
    });
    expect(res.alternativeMethods).toContain("exponential");
    expect(res.alternativeMethods).toContain("hyperbolic");
  });

  it("throws on qi < 0", () => {
    expect(() =>
      arpsDecline.run({
        inputs: {
          initialRate: { value: -1, unit: "STB/d" },
          declineRate: { value: 0.15, unit: "" },
          time: { value: 2, unit: "" },
        },
      }),
    ).toThrow();
  });

  it("throws on hyperbolic without bExponent > 0", () => {
    expect(() =>
      arpsDecline.run({
        inputs: {
          initialRate: { value: 1000, unit: "STB/d" },
          declineRate: { value: 0.15, unit: "" },
          time: { value: 2, unit: "" },
          bExponent: { value: 0, unit: "" },
        },
        method: "hyperbolic",
      }),
    ).toThrow();
  });
});
