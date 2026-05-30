import type { Calc, CalcInput, CalcResult, Assumption } from "../../core/types";
import { convert } from "../../units/convert";
import { mergeAssumptions } from "../../core/assumptions";

const BASE: Assumption[] = [
  { key: "efficiency", label: "Fan/blower efficiency", value: { value: 0.70, unit: "" }, source: "Typical centrifugal fan" },
];

export const fanBlowerPower: Calc = {
  id: "fanBlowerPower",
  name: "Fan/blower shaft power",
  requiredInputs: [
    { name: "flowrate", exampleUnit: "m^3/s" },
    { name: "pressureRise", exampleUnit: "Pa" },
  ],
  run(input: CalcInput): CalcResult {
    const assumptions = mergeAssumptions(BASE, input.assumptionOverrides);
    const eta = assumptions.find((a) => a.key === "efficiency")!.value.value;

    const Q = convert(input.inputs.flowrate.value, input.inputs.flowrate.unit, "m^3/s");
    const dP = convert(input.inputs.pressureRise.value, input.inputs.pressureRise.unit, "Pa");

    if (!(Q >= 0)) throw new Error("flowrate must be >= 0");
    if (!(dP >= 0)) throw new Error("pressureRise must be >= 0");
    if (!(eta > 0)) throw new Error("efficiency must be > 0");

    const P = (Q * dP) / eta;

    return {
      result: { value: P, unit: "W" },
      formula: "P = Q·ΔP/η",
      inputs: input.inputs,
      assumptions,
      steps: [
        { label: "Air power", expression: `Q·ΔP = ${Q}·${dP}`, result: { value: Q * dP, unit: "W" } },
        { label: "Shaft power", expression: `P = ${Q * dP}/${eta}`, result: { value: P, unit: "W" } },
      ],
      method: "Fan/blower power",
      trustTier: "computed",
      flags: [],
    };
  },
};
