import type { Calc, CalcInput, CalcResult, Assumption } from "../../core/types";
import { convert } from "../../units/convert";
import { mergeAssumptions } from "../../core/assumptions";

const BASE: Assumption[] = [
  { key: "powerFactor", label: "Power factor", value: { value: 0.85, unit: "" }, source: "Typical induction motor" },
];

export const fullLoadCurrent: Calc = {
  id: "fullLoadCurrent",
  name: "Motor full-load current",
  requiredInputs: [
    { name: "ratedPower", exampleUnit: "W" },
    { name: "voltage", exampleUnit: "V" },
  ],
  run(input: CalcInput): CalcResult {
    const assumptions = mergeAssumptions(BASE, input.assumptionOverrides);
    const pf = assumptions.find((a) => a.key === "powerFactor")!.value.value;

    const P = convert(input.inputs.ratedPower.value, input.inputs.ratedPower.unit, "W");
    const V = convert(input.inputs.voltage.value, input.inputs.voltage.unit, "V");

    if (!(P > 0)) throw new Error("ratedPower must be > 0");
    if (!(V > 0)) throw new Error("voltage must be > 0");
    if (!(pf > 0)) throw new Error("powerFactor must be > 0");

    const sqrt3 = Math.sqrt(3);
    const I = P / (sqrt3 * V * pf);

    return {
      result: { value: I, unit: "A" },
      formula: "I_fl = P / (√3·V·pf)",
      inputs: input.inputs,
      assumptions,
      steps: [
        { label: "Full-load current", expression: `I = ${P}/(√3·${V}·${pf})`, result: { value: I, unit: "A" } },
      ],
      method: "3-phase full-load current",
      trustTier: "computed",
      flags: [],
    };
  },
};
