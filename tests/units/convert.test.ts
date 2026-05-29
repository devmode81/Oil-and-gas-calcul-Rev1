import { describe, it, expect } from "vitest";
import { convert } from "../../src/units/convert";

describe("convert", () => {
  it("converts 1550 psi to bar", () => {
    expect(convert(1550, "psi", "bar")).toBeCloseTo(106.87, 2);
  });

  it("converts 1 bbl to m^3", () => {
    expect(convert(1, "bbl", "m^3")).toBeCloseTo(0.158987, 5);
  });

  it("converts 1 MMscf to ft^3", () => {
    expect(convert(1, "MMscf", "ft^3")).toBeCloseTo(1e6, 0);
  });

  it("throws on incompatible dimensions", () => {
    expect(() => convert(1, "psi", "m")).toThrow();
  });
});
