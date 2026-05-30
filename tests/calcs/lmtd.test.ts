import { describe, it, expect } from "vitest";
import { lmtd } from "../../src/calcs/mechanical/lmtd";

describe("lmtd", () => {
  it("non-equal case: hotIn=130, hotOut=60, coldIn=20, coldOut=70 → 49.33", () => {
    // ΔT1 = 130-70 = 60; ΔT2 = 60-20 = 40; LMTD = 20/ln(1.5) = 49.33
    const res = lmtd.run({
      inputs: {
        hotIn: { value: 130, unit: "degC" },
        hotOut: { value: 60, unit: "degC" },
        coldIn: { value: 20, unit: "degC" },
        coldOut: { value: 70, unit: "degC" },
      },
    });
    expect(res.result.value).toBeCloseTo(49.33, 1);
  });

  it("equal ΔT case: returns ΔT directly", () => {
    // hotIn=120, hotOut=60, coldIn=20, coldOut=80 → ΔT1=40, ΔT2=40 → return 40
    const res = lmtd.run({
      inputs: {
        hotIn: { value: 120, unit: "degC" },
        hotOut: { value: 60, unit: "degC" },
        coldIn: { value: 20, unit: "degC" },
        coldOut: { value: 80, unit: "degC" },
      },
    });
    expect(res.result.value).toBeCloseTo(40, 5);
  });

  it("non-SI: temps in degF", () => {
    // hotIn=266°F=130°C, hotOut=140°F=60°C, coldIn=68°F=20°C, coldOut=158°F=70°C
    // ΔT1 = 60 K, ΔT2 = 40 K → LMTD = 49.33 K
    const res = lmtd.run({
      inputs: {
        hotIn: { value: 266, unit: "degF" },
        hotOut: { value: 140, unit: "degF" },
        coldIn: { value: 68, unit: "degF" },
        coldOut: { value: 158, unit: "degF" },
      },
    });
    expect(res.result.value).toBeCloseTo(49.33, 1);
  });

  it("non-SI: temps in K", () => {
    // Same as benchmark but in K: hotIn=403.15, hotOut=333.15, coldIn=293.15, coldOut=343.15
    const res = lmtd.run({
      inputs: {
        hotIn: { value: 403.15, unit: "K" },
        hotOut: { value: 333.15, unit: "K" },
        coldIn: { value: 293.15, unit: "K" },
        coldOut: { value: 343.15, unit: "K" },
      },
    });
    expect(res.result.value).toBeCloseTo(49.33, 1);
  });

  it("another non-equal case: hotIn=120, hotOut=80, coldIn=20, coldOut=60 → (60-60)/... but ΔT1=60, ΔT2=60 → 60", () => {
    // ΔT1 = 120-60 = 60; ΔT2 = 80-20 = 60; equal → return 60
    const res = lmtd.run({
      inputs: {
        hotIn: { value: 120, unit: "degC" },
        hotOut: { value: 80, unit: "degC" },
        coldIn: { value: 20, unit: "degC" },
        coldOut: { value: 60, unit: "degC" },
      },
    });
    expect(res.result.value).toBeCloseTo(60, 5);
  });

  it("result unit is K", () => {
    const res = lmtd.run({
      inputs: {
        hotIn: { value: 130, unit: "degC" },
        hotOut: { value: 60, unit: "degC" },
        coldIn: { value: 20, unit: "degC" },
        coldOut: { value: 70, unit: "degC" },
      },
    });
    expect(res.result.unit).toBe("K");
  });
});
