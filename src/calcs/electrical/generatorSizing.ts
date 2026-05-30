import type { Calc, CalcInput, CalcResult, Assumption } from "../../core/types";
import { convert } from "../../units/convert";
import { mergeAssumptions } from "../../core/assumptions";

const BASE: Assumption[] = [
  { key: "powerFactor", label: "Power factor", value: { value: 0.8, unit: "" }, source: "Typical generator nameplate" },
  { key: "startingFactor", label: "Motor starting factor", value: { value: 0.25, unit: "" }, source: "25% excess for motor starting" },
  { key: "diversityFactor", label: "Diversity factor", value: { value: 1.0, unit: "" }, source: "Unity — all loads simultaneous" },
];

export const generatorSizing: Calc = {
  id: "generatorSizing",
  name: "Generator sizing (kVA)",
  requiredInputs: [
    { name: "connectedLoad", exampleUnit: "W" },
  ],
  run(input: CalcInput): CalcResult {
    const assumptions = mergeAssumptions(BASE, input.assumptionOverrides);
    const pf = assumptions.find((a) => a.key === "powerFactor")!.value.value;
    const sf = assumptions.find((a) => a.key === "startingFactor")!.value.value;
    const df = assumptions.find((a) => a.key === "diversityFactor")!.value.value;

    const P = convert(input.inputs.connectedLoad.value, input.inputs.connectedLoad.unit, "W");

    if (!(P > 0)) throw new Error("connectedLoad must be > 0");
    if (!(pf > 0)) throw new Error("powerFactor must be > 0");
    if (!(df > 0)) throw new Error("diversityFactor must be > 0");

    const S = (P / pf) * (1 + sf) * df;

    return {
      result: { value: S, unit: "VA" },
      formula: "S = (P/pf)·(1+startingFactor)·diversityFactor",
      inputs: input.inputs,
      assumptions,
      steps: [
        { label: "Base kVA", expression: `S_base = ${P}/${pf}`, result: { value: P / pf, unit: "VA" } },
        { label: "With starting margin", expression: `S = ${P / pf}·(1+${sf})`, result: { value: (P / pf) * (1 + sf), unit: "VA" } },
        { label: "With diversity factor", expression: `S = ${(P / pf) * (1 + sf)}·${df}`, result: { value: S, unit: "VA" } },
      ],
      method: "Generator kVA sizing",
      trustTier: "computed",
      flags: [],
    };
  },
};
