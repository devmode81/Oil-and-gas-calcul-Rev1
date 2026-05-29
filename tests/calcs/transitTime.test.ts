import { describe, it, expect } from "vitest";
import { transitTime } from "../../src/calcs/flow/transitTime";

describe("transitTime", () => {
  // D=0.1 m → A=0.0078539816 m²; Q=0.01 m³/s → v≈1.273 m/s; t=300/v≈235.6 s
  it("computes transit time t = L·A/Q", () => {
    const res = transitTime.run({
      inputs: {
        flowrate: { value: 0.01, unit: "m^3/s" },
        diameter: { value: 0.1, unit: "m" },
        distance: { value: 300, unit: "m" },
      },
    });
    expect(res.result.unit).toBe("s");
    expect(res.result.value).toBeCloseTo(235.6, 1);
    expect(res.flags.length).toBe(0); // ~1.27 m/s is below the guideline
  });

  it("raises a velocity sanity flag at high flow", () => {
    const res = transitTime.run({
      inputs: {
        flowrate: { value: 0.4, unit: "m^3/s" }, // v≈50.9 m/s
        diameter: { value: 0.1, unit: "m" },
        distance: { value: 300, unit: "m" },
      },
    });
    expect(res.flags.some((f) => f.severity === "warn")).toBe(true);
  });
});
