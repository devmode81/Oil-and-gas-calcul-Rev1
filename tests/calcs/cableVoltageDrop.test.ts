import { describe, it, expect } from "vitest";
import { cableVoltageDrop } from "../../src/calcs/electrical/cableVoltageDrop";

describe("cableVoltageDrop", () => {
  it("benchmark: I=100, R=0.5, X=0.1, L=1, V=415, pf=0.85 → Vd≈82.75 V", () => {
    const res = cableVoltageDrop.run({
      inputs: {
        current: { value: 100, unit: "A" },
        resistance: { value: 0.5, unit: "Ohm/km" },
        reactance: { value: 0.1, unit: "Ohm/km" },
        length: { value: 1, unit: "km" },
        voltage: { value: 415, unit: "V" },
      },
    });
    expect(res.result.unit).toBe("V");
    expect(res.result.value).toBeCloseTo(82.75, 1);
    expect(res.trustTier).toBe("validated");
    expect(res.reference).toContain("IEC 60364");
  });

  it("computes %Vd correctly (≈19.94%)", () => {
    const res = cableVoltageDrop.run({
      inputs: {
        current: { value: 100, unit: "A" },
        resistance: { value: 0.5, unit: "Ohm/km" },
        reactance: { value: 0.1, unit: "Ohm/km" },
        length: { value: 1, unit: "km" },
        voltage: { value: 415, unit: "V" },
      },
    });
    const pctStep = res.steps.find((s) => s.label.includes("%"));
    expect(pctStep?.result?.value).toBeCloseTo(19.94, 1);
  });

  it("uses kV for supply voltage and km for length", () => {
    const res = cableVoltageDrop.run({
      inputs: {
        current: { value: 100, unit: "A" },
        resistance: { value: 0.5, unit: "Ohm/km" },
        reactance: { value: 0.1, unit: "Ohm/km" },
        length: { value: 1, unit: "km" },
        voltage: { value: 0.415, unit: "kV" },
      },
    });
    expect(res.result.value).toBeCloseTo(82.75, 1);
  });

  it("throws on non-positive current", () => {
    expect(() =>
      cableVoltageDrop.run({
        inputs: {
          current: { value: 0, unit: "A" },
          resistance: { value: 0.5, unit: "Ohm/km" },
          reactance: { value: 0.1, unit: "Ohm/km" },
          length: { value: 1, unit: "km" },
          voltage: { value: 415, unit: "V" },
        },
      }),
    ).toThrow();
  });

  it("throws on negative resistance", () => {
    expect(() =>
      cableVoltageDrop.run({
        inputs: {
          current: { value: 100, unit: "A" },
          resistance: { value: -0.1, unit: "Ohm/km" },
          reactance: { value: 0.1, unit: "Ohm/km" },
          length: { value: 1, unit: "km" },
          voltage: { value: 415, unit: "V" },
        },
      }),
    ).toThrow();
  });
});
