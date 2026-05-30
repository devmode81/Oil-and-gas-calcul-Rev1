import { describe, it, expect } from "vitest";
import { transformerKva } from "../../src/calcs/electrical/transformerKva";

describe("transformerKva", () => {
  it("benchmark: V=415, I=200 → S≈143.8 kVA", () => {
    const res = transformerKva.run({
      inputs: {
        voltage: { value: 415, unit: "V" },
        current: { value: 200, unit: "A" },
      },
    });
    expect(res.result.unit).toBe("VA");
    expect(res.result.value / 1000).toBeCloseTo(143.8, 1);
    expect(res.trustTier).toBe("computed");
  });

  it("uses kV input", () => {
    const res = transformerKva.run({
      inputs: {
        voltage: { value: 0.415, unit: "kV" },
        current: { value: 200, unit: "A" },
      },
    });
    expect(res.result.value / 1000).toBeCloseTo(143.8, 1);
  });

  it("shows kVA in steps", () => {
    const res = transformerKva.run({
      inputs: {
        voltage: { value: 415, unit: "V" },
        current: { value: 200, unit: "A" },
      },
    });
    const kvaStep = res.steps.find((s) => s.label.includes("kVA"));
    expect(kvaStep?.result?.value).toBeCloseTo(143.8, 1);
  });

  it("throws on non-positive voltage", () => {
    expect(() =>
      transformerKva.run({
        inputs: {
          voltage: { value: 0, unit: "V" },
          current: { value: 200, unit: "A" },
        },
      }),
    ).toThrow();
  });

  it("throws on non-positive current", () => {
    expect(() =>
      transformerKva.run({
        inputs: {
          voltage: { value: 415, unit: "V" },
          current: { value: -1, unit: "A" },
        },
      }),
    ).toThrow();
  });
});
