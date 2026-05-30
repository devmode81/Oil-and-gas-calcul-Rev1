import { describe, it, expect } from "vitest";
import { vogelIpr } from "../../src/calcs/reservoir/vogelIpr";

describe("vogelIpr", () => {
  it("benchmark: Pr=3000, Pwf=2000, qmax=1000 → qo≈511.1 STB/d", () => {
    const res = vogelIpr.run({
      inputs: {
        reservoirPressure: { value: 3000, unit: "psi" },
        flowingPressure: { value: 2000, unit: "psi" },
        maxFlow: { value: 1000, unit: "STB/d" },
      },
    });
    expect(res.trustTier).toBe("validated");
    expect(res.reference).toBeDefined();
    expect(res.result.unit).toBe("STB/d");
    expect(res.result.value).toBeCloseTo(511.1, 1);
  });

  it("flowing pressure = 0 gives qmax", () => {
    const res = vogelIpr.run({
      inputs: {
        reservoirPressure: { value: 3000, unit: "psi" },
        flowingPressure: { value: 0, unit: "psi" },
        maxFlow: { value: 1000, unit: "STB/d" },
      },
    });
    expect(res.result.value).toBeCloseTo(1000, 3);
  });

  it("flowing pressure = reservoir pressure gives ~0 flow", () => {
    const res = vogelIpr.run({
      inputs: {
        reservoirPressure: { value: 3000, unit: "psi" },
        flowingPressure: { value: 3000, unit: "psi" },
        maxFlow: { value: 1000, unit: "STB/d" },
      },
    });
    expect(res.result.value).toBeCloseTo(0, 3);
  });

  it("throws when Pwf > Pr", () => {
    expect(() =>
      vogelIpr.run({
        inputs: {
          reservoirPressure: { value: 2000, unit: "psi" },
          flowingPressure: { value: 2500, unit: "psi" },
          maxFlow: { value: 1000, unit: "STB/d" },
        },
      }),
    ).toThrow();
  });

  it("throws on Pr <= 0", () => {
    expect(() =>
      vogelIpr.run({
        inputs: {
          reservoirPressure: { value: 0, unit: "psi" },
          flowingPressure: { value: 0, unit: "psi" },
          maxFlow: { value: 1000, unit: "STB/d" },
        },
      }),
    ).toThrow();
  });
});
