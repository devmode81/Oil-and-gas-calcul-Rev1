import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";

export const transformerKva: Calc = {
  id: "transformerKva",
  name: "Transformer kVA rating",
  requiredInputs: [
    { name: "voltage", exampleUnit: "V" },
    { name: "current", exampleUnit: "A" },
  ],
  run(input: CalcInput): CalcResult {
    const V = convert(input.inputs.voltage.value, input.inputs.voltage.unit, "V");
    const I = convert(input.inputs.current.value, input.inputs.current.unit, "A");

    if (!(V > 0)) throw new Error("voltage must be > 0");
    if (!(I > 0)) throw new Error("current must be > 0");

    const sqrt3 = Math.sqrt(3);
    const S = sqrt3 * V * I;

    return {
      result: { value: S, unit: "VA" },
      formula: "S = √3·V·I",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        { label: "Apparent power (VA)", expression: `S = √3·${V}·${I}`, result: { value: S, unit: "VA" } },
        { label: "kVA rating", expression: `S = ${S}/1000`, result: { value: S / 1000, unit: "kVA" } },
      ],
      method: "3-phase transformer apparent power",
      trustTier: "computed",
      flags: [],
    };
  },
};
