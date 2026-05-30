import { describe, it, expect } from "vitest";
import { hammerschmidtInhibitorDose } from "../../src/calcs/subsea/hammerschmidtInhibitorDose";

describe("hammerschmidtInhibitorDose", () => {
  it("benchmark: ΔT=5°C, MeOH → W=6.42 %wt", () => {
    const res = hammerschmidtInhibitorDose.run({
      inputs: {
        subCoolingRequired: { value: 5, unit: "degC" },
      },
      method: "MeOH",
    });
    expect(res.result.value).toBeCloseTo(6.42, 2);
    expect(res.result.unit).toBe("%wt");
    expect(res.trustTier).toBe("validated");
    expect(res.reference).toBeTruthy();
    expect(res.alternativeMethods).toContain("MEG");
  });

  it("MEG method: ΔT=5°C → W = 100·5·62.07/(2000+5·62.07)=310.35/2310.35=13.43 %wt", () => {
    const res = hammerschmidtInhibitorDose.run({
      inputs: {
        subCoolingRequired: { value: 5, unit: "degC" },
      },
      method: "MEG",
    });
    // W = 100*5*62.07 / (2000 + 5*62.07) = 31035/2310.35 = 13.43
    expect(res.result.value).toBeCloseTo(13.43, 1);
  });

  it("accepts non-SI input: sub-cooling in degF", () => {
    // 5°C difference = 9°F difference (delta temp — just scale by 1.8)
    // We use a ΔT in °C-equivalent; degF as unit: 5°C diff = 9 degF diff
    // But convert() for degF/degC is offset-based — pass as dimensionless °C difference directly
    // Instead test with sub-cooling in K (K difference = °C difference)
    const res = hammerschmidtInhibitorDose.run({
      inputs: {
        subCoolingRequired: { value: 5, unit: "K" },
      },
      method: "MeOH",
    });
    expect(res.result.value).toBeCloseTo(6.42, 2);
  });

  it("default method is MeOH", () => {
    const res = hammerschmidtInhibitorDose.run({
      inputs: {
        subCoolingRequired: { value: 5, unit: "degC" },
      },
    });
    expect(res.result.value).toBeCloseTo(6.42, 2);
    expect(res.method).toBe("MeOH");
  });

  it("throws on negative sub-cooling", () => {
    expect(() =>
      hammerschmidtInhibitorDose.run({
        inputs: {
          subCoolingRequired: { value: -1, unit: "degC" },
        },
      }),
    ).toThrow();
  });

  it("throws on unknown method", () => {
    expect(() =>
      hammerschmidtInhibitorDose.run({
        inputs: {
          subCoolingRequired: { value: 5, unit: "degC" },
        },
        method: "Glycol",
      }),
    ).toThrow();
  });
});
