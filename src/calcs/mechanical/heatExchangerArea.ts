import type { Calc, CalcInput, CalcResult, Assumption } from "../../core/types";
import { convert } from "../../units/convert";
import { mergeAssumptions } from "../../core/assumptions";

const BASE: Assumption[] = [
  { key: "correctionFactor", label: "LMTD correction factor F", value: { value: 1.0, unit: "" }, source: "Assumed pure counterflow (F=1)" },
];

export const heatExchangerArea: Calc = {
  id: "heatExchangerArea",
  name: "Heat exchanger area",
  requiredInputs: [
    { name: "duty", exampleUnit: "W" },
    { name: "overallHeatTransferCoeff", exampleUnit: "W/(m^2 K)" },
    { name: "lmtd", exampleUnit: "K" },
  ],
  run(input: CalcInput): CalcResult {
    const assumptions = mergeAssumptions(BASE, input.assumptionOverrides);
    let F: number;
    if (input.inputs.correctionFactor) {
      F = input.inputs.correctionFactor.value;
    } else {
      F = assumptions.find((a) => a.key === "correctionFactor")!.value.value;
    }

    const Q = convert(input.inputs.duty.value, input.inputs.duty.unit, "W");
    const U = input.inputs.overallHeatTransferCoeff.value; // W/(m²·K) SI scalar
    const LMTD = input.inputs.lmtd.value; // K SI scalar

    if (!(U > 0)) throw new Error("overallHeatTransferCoeff must be > 0");
    if (!(LMTD > 0)) throw new Error("lmtd must be > 0");
    if (!(F > 0)) throw new Error("correctionFactor must be > 0");

    const A = Q / (U * LMTD * F);

    return {
      result: { value: A, unit: "m^2" },
      formula: "A = Q/(U·LMTD·F)",
      inputs: input.inputs,
      assumptions,
      steps: [
        { label: "Denominator U·LMTD·F", expression: `${U}·${LMTD}·${F}`, result: { value: U * LMTD * F, unit: "W/m^2" } },
        { label: "Heat transfer area", expression: `A = ${Q}/(${U * LMTD * F})`, result: { value: A, unit: "m^2" } },
      ],
      method: "Q=U·A·LMTD·F",
      trustTier: "computed",
      flags: [],
    };
  },
};
