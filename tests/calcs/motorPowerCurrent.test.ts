import { describe, it, expect } from "vitest";
import { motorPowerCurrent } from "../../src/calcs/electrical/motorPowerCurrent";

describe("motorPowerCurrent", () => {
  it("power mode: computes 3-phase motor power (V=415, I=100, pf=0.85, η=0.92)", () => {
    const res = motorPowerCurrent.run({
      inputs: {
        voltage: { value: 415, unit: "V" },
        current: { value: 100, unit: "A" },
      },
    });
    expect(res.result.unit).toBe("W");
    expect(res.result.value / 1000).toBeCloseTo(56.2, 1);
    expect(res.trustTier).toBe("computed");
  });

  it("power mode: uses kV and A inputs", () => {
    const res = motorPowerCurrent.run({
      inputs: {
        voltage: { value: 0.415, unit: "kV" },
        current: { value: 100, unit: "A" },
      },
    });
    expect(res.result.value / 1000).toBeCloseTo(56.2, 1);
  });

  it("current mode: computes I from activePower (P=56210, V=415)", () => {
    // P = √3·415·100·0.85·0.92 = 56210.16 W → I should be 100 A
    const res = motorPowerCurrent.run({
      inputs: {
        voltage: { value: 415, unit: "V" },
        activePower: { value: 56210.16, unit: "W" },
      },
      method: "current",
    });
    expect(res.result.unit).toBe("A");
    expect(res.result.value).toBeCloseTo(100, 1);
  });

  it("current mode: uses kW input", () => {
    const res = motorPowerCurrent.run({
      inputs: {
        voltage: { value: 415, unit: "V" },
        activePower: { value: 56.21016, unit: "kW" },
      },
      method: "current",
    });
    expect(res.result.value).toBeCloseTo(100, 1);
  });

  it("throws on non-positive voltage", () => {
    expect(() =>
      motorPowerCurrent.run({
        inputs: {
          voltage: { value: 0, unit: "V" },
          current: { value: 100, unit: "A" },
        },
      }),
    ).toThrow();
  });

  it("throws on non-positive current in power mode", () => {
    expect(() =>
      motorPowerCurrent.run({
        inputs: {
          voltage: { value: 415, unit: "V" },
          current: { value: -10, unit: "A" },
        },
      }),
    ).toThrow();
  });
});
