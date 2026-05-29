import { describe, it, expect } from "vitest";
import { checkMaxVelocity } from "../../src/core/sanity";

describe("checkMaxVelocity", () => {
  it("flags liquid velocity above the erosional rule-of-thumb", () => {
    const flag = checkMaxVelocity({ value: 18, unit: "m/s" });
    expect(flag).not.toBeNull();
    expect(flag?.severity).toBe("warn");
    expect(flag?.reference).toContain("API RP 14E");
  });

  it("returns null for acceptable velocity", () => {
    expect(checkMaxVelocity({ value: 2, unit: "m/s" })).toBeNull();
  });
});
