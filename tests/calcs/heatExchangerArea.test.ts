import { describe, it, expect } from "vitest";
import { heatExchangerArea } from "../../src/calcs/mechanical/heatExchangerArea";

describe("heatExchangerArea", () => {
  it("benchmark: Q=2.509e6 W, U=500, LMTD=49.33 → ~101.7 m² (plan rounded to 101.8)", () => {
    const res = heatExchangerArea.run({
      inputs: {
        duty: { value: 2.509e6, unit: "W" },
        overallHeatTransferCoeff: { value: 500, unit: "W/(m^2 K)" },
        lmtd: { value: 49.33, unit: "K" },
      },
    });
    expect(res.result.unit).toBe("m^2");
    // 2509000 / (500 * 49.33) = 2509000 / 24665 = 101.72
    expect(res.result.value).toBeCloseTo(101.7, 1);
  });

  it("non-SI: duty in kW", () => {
    const res = heatExchangerArea.run({
      inputs: {
        duty: { value: 2509, unit: "kW" },
        overallHeatTransferCoeff: { value: 500, unit: "W/(m^2 K)" },
        lmtd: { value: 49.33, unit: "K" },
      },
    });
    expect(res.result.value).toBeCloseTo(101.7, 1);
  });

  it("non-SI: duty in BTU/hr", () => {
    // 2.509e6 W = 8561063 BTU/hr (1 BTU/hr = 0.29307 W)
    const res = heatExchangerArea.run({
      inputs: {
        duty: { value: 8561063, unit: "BTU/hr" },
        overallHeatTransferCoeff: { value: 500, unit: "W/(m^2 K)" },
        lmtd: { value: 49.33, unit: "K" },
      },
    });
    expect(res.result.value).toBeCloseTo(101.8, 0);
  });

  it("with correction factor F=0.9", () => {
    // A = Q/(U·LMTD·F) = 2.509e6/(500·49.33·0.9) = 101.72/0.9 = 113.025
    const res = heatExchangerArea.run({
      inputs: {
        duty: { value: 2.509e6, unit: "W" },
        overallHeatTransferCoeff: { value: 500, unit: "W/(m^2 K)" },
        lmtd: { value: 49.33, unit: "K" },
        correctionFactor: { value: 0.9, unit: "" },
      },
    });
    expect(res.result.value).toBeCloseTo(113.0, 1);
  });

  it("throws on non-positive U", () => {
    expect(() =>
      heatExchangerArea.run({
        inputs: {
          duty: { value: 1e6, unit: "W" },
          overallHeatTransferCoeff: { value: 0, unit: "W/(m^2 K)" },
          lmtd: { value: 50, unit: "K" },
        },
      }),
    ).toThrow();
  });

  it("throws on non-positive LMTD", () => {
    expect(() =>
      heatExchangerArea.run({
        inputs: {
          duty: { value: 1e6, unit: "W" },
          overallHeatTransferCoeff: { value: 500, unit: "W/(m^2 K)" },
          lmtd: { value: 0, unit: "K" },
        },
      }),
    ).toThrow();
  });
});
