import { describe, it, expect } from "vitest";
import { apiToSg, sgToApi } from "../../src/calcs/properties/apiGravity";

describe("API gravity", () => {
  it("converts 30 °API to specific gravity ≈ 0.8762", () => {
    expect(apiToSg(30)).toBeCloseTo(0.8762, 4);
  });

  it("converts SG 0.8762 back to ≈ 30 °API", () => {
    expect(sgToApi(0.8762)).toBeCloseTo(30, 1);
  });

  it("water (10 °API) ≈ SG 1.0", () => {
    expect(apiToSg(10)).toBeCloseTo(1.0, 3);
  });
});
