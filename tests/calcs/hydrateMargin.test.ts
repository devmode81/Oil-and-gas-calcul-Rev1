import { describe, it, expect } from "vitest";
import { hydrateMargin } from "../../src/calcs/subsea/hydrateMargin";

describe("hydrateMargin", () => {
  it("computes hydrate margin (benchmark: P=1000 psi, T_flow=10°C → margin=−4.16°C)", () => {
    const res = hydrateMargin.run({
      inputs: {
        pressure: { value: 1000, unit: "psi" },
        gasFlowingTemp: { value: 10, unit: "degC" },
      },
    });
    expect(res.result.value).toBeCloseTo(-4.16, 1);
    expect(res.result.unit).toBe("degC");
    expect(res.trustTier).toBe("validated");
    expect(res.reference).toBeTruthy();
  });

  it("accepts non-SI pressure in bar", () => {
    // 1000 psi ≈ 68.9476 bar
    const res = hydrateMargin.run({
      inputs: {
        pressure: { value: 68.9476, unit: "bar" },
        gasFlowingTemp: { value: 10, unit: "degC" },
      },
    });
    expect(res.result.value).toBeCloseTo(-4.16, 1);
  });

  it("accepts non-SI temperature in degF", () => {
    // 10°C = 50°F
    const res = hydrateMargin.run({
      inputs: {
        pressure: { value: 1000, unit: "psi" },
        gasFlowingTemp: { value: 50, unit: "degF" },
      },
    });
    expect(res.result.value).toBeCloseTo(-4.16, 1);
  });

  it("positive margin indicates hydrate risk", () => {
    // Very low flowing temp → margin should be positive
    const res = hydrateMargin.run({
      inputs: {
        pressure: { value: 1000, unit: "psi" },
        gasFlowingTemp: { value: 0, unit: "degC" },
      },
    });
    // T_hyd ≈ 5.84°C, T_flow=0°C → margin = 5.84 > 0 (hydrate risk)
    expect(res.result.value).toBeGreaterThan(0);
  });

  it("throws on non-positive pressure", () => {
    expect(() =>
      hydrateMargin.run({
        inputs: {
          pressure: { value: 0, unit: "psi" },
          gasFlowingTemp: { value: 10, unit: "degC" },
        },
      }),
    ).toThrow();
  });
});
