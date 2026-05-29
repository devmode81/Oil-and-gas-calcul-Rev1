import { describe, it, expect } from "vitest";
import { toSigFigs } from "../../src/format/sigfig";

describe("toSigFigs", () => {
  it("rounds to default 4 significant figures", () => {
    expect(toSigFigs(8.333333)).toBe("8.333");
  });

  it("respects requested sig figs", () => {
    expect(toSigFigs(2827.4333882, 5)).toBe("2827.4");
  });

  it("handles zero", () => {
    expect(toSigFigs(0)).toBe("0");
  });

  it("handles large numbers", () => {
    expect(toSigFigs(200000, 3)).toBe("200000");
  });
});
