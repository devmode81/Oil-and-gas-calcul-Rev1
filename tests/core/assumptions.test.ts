import { describe, it, expect } from "vitest";
import { DEFAULT_ASSUMPTIONS, mergeAssumptions } from "../../src/core/assumptions";

describe("assumptions", () => {
  it("provides standard gravity by default", () => {
    const g = DEFAULT_ASSUMPTIONS.find((a) => a.key === "g");
    expect(g?.value.value).toBeCloseTo(9.80665, 5);
    expect(g?.value.unit).toBe("m/s^2");
  });

  it("merges an override by key", () => {
    const merged = mergeAssumptions(DEFAULT_ASSUMPTIONS, {
      g: { value: 9.81, unit: "m/s^2" },
    });
    const g = merged.find((a) => a.key === "g");
    expect(g?.value.value).toBe(9.81);
  });

  it("leaves non-overridden assumptions unchanged", () => {
    const merged = mergeAssumptions(DEFAULT_ASSUMPTIONS, {
      g: { value: 9.81, unit: "m/s^2" },
    });
    const patm = merged.find((a) => a.key === "P_atm");
    expect(patm?.value.value).toBeCloseTo(101325, 0);
  });
});
