import { describe, it, expect } from "vitest";
import { pumpAffinityLaws } from "../../src/calcs/mechanical/pumpAffinityLaws";

describe("pumpAffinityLaws", () => {
  it("benchmark: N1=1500, N2=1800 → P2=42365 W", () => {
    const res = pumpAffinityLaws.run({
      inputs: {
        speed1: { value: 1500, unit: "rpm" },
        speed2: { value: 1800, unit: "rpm" },
        flow1: { value: 0.05, unit: "m^3/s" },
        head1: { value: 50, unit: "m" },
        power1: { value: 24517, unit: "W" },
      },
    });
    expect(res.result.unit).toBe("W");
    expect(res.result.value).toBeCloseTo(42365, 0);
  });

  it("non-SI: flow in L/s", () => {
    // Q1=0.05 m^3/s = 50 L/s
    const res = pumpAffinityLaws.run({
      inputs: {
        speed1: { value: 1500, unit: "rpm" },
        speed2: { value: 1800, unit: "rpm" },
        flow1: { value: 50, unit: "L/s" },
        head1: { value: 50, unit: "m" },
        power1: { value: 24517, unit: "W" },
      },
    });
    expect(res.result.value).toBeCloseTo(42365, 0);
  });

  it("non-SI: flow in gal/min, power in hp", () => {
    // Q1=0.05 m^3/s ≈ 792.52 gal/min; P1=24517 W ≈ 32.88 hp
    const res = pumpAffinityLaws.run({
      inputs: {
        speed1: { value: 1500, unit: "rpm" },
        speed2: { value: 1800, unit: "rpm" },
        flow1: { value: 792.52, unit: "gal/min" },
        head1: { value: 50, unit: "m" },
        power1: { value: 32.88, unit: "hp" },
      },
    });
    // P2 = P1_converted * 1.2^3; allow ±10 W for rounding in non-SI inputs
    expect(res.result.value).toBeCloseTo(42368, 0);
  });

  it("non-SI: head in ft", () => {
    // H1=50 m = 164.04 ft
    const res = pumpAffinityLaws.run({
      inputs: {
        speed1: { value: 1500, unit: "rpm" },
        speed2: { value: 1800, unit: "rpm" },
        flow1: { value: 0.05, unit: "m^3/s" },
        head1: { value: 164.04, unit: "ft" },
        power1: { value: 24517, unit: "W" },
      },
    });
    expect(res.result.value).toBeCloseTo(42365, 0);
  });

  it("computes flow2 and head2 in steps", () => {
    const res = pumpAffinityLaws.run({
      inputs: {
        speed1: { value: 1500, unit: "rpm" },
        speed2: { value: 1800, unit: "rpm" },
        flow1: { value: 0.05, unit: "m^3/s" },
        head1: { value: 50, unit: "m" },
        power1: { value: 24517, unit: "W" },
      },
    });
    const flow2Step = res.steps.find((s) => s.label.toLowerCase().includes("flow"));
    const head2Step = res.steps.find((s) => s.label.toLowerCase().includes("head"));
    expect(flow2Step?.result?.value).toBeCloseTo(0.06, 4);
    expect(head2Step?.result?.value).toBeCloseTo(72, 1);
  });

  it("throws on non-positive speed", () => {
    expect(() =>
      pumpAffinityLaws.run({
        inputs: {
          speed1: { value: 0, unit: "rpm" },
          speed2: { value: 1800, unit: "rpm" },
          flow1: { value: 0.05, unit: "m^3/s" },
          head1: { value: 50, unit: "m" },
          power1: { value: 24517, unit: "W" },
        },
      }),
    ).toThrow();
  });
});
