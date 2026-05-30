import type { Calc, CalcInput, CalcResult, Assumption } from "../../core/types";
import { convert } from "../../units/convert";
import { mergeAssumptions } from "../../core/assumptions";

const BASE: Assumption[] = [
  {
    key: "jouleThomsonCoeff",
    label: "Joule-Thomson coefficient (natural gas)",
    value: { value: 0.45, unit: "degC/bar" },
    source: "Typical natural gas value",
  },
];

export const jouleThomsonCooling: Calc = {
  id: "jouleThomsonCooling",
  name: "Joule-Thomson cooling across a choke/restriction",
  requiredInputs: [
    { name: "pressureDrop", exampleUnit: "bar" },
  ],
  run(input: CalcInput): CalcResult {
    const assumptions = mergeAssumptions(BASE, input.assumptionOverrides);
    const muJT = assumptions.find((a) => a.key === "jouleThomsonCoeff")!.value.value; // °C/bar

    const dP_bar = convert(input.inputs.pressureDrop.value, input.inputs.pressureDrop.unit, "bar");

    if (!(dP_bar >= 0)) throw new Error("pressureDrop must be >= 0");

    const dT = muJT * dP_bar;

    return {
      result: { value: dT, unit: "degC" },
      formula: "ΔT = μ_JT · ΔP",
      inputs: input.inputs,
      assumptions,
      steps: [
        { label: "Pressure drop in bar", expression: `ΔP = ${dP_bar} bar` },
        { label: "JT coefficient", expression: `μ_JT = ${muJT} °C/bar` },
        { label: "Temperature drop", expression: `ΔT = ${muJT} × ${dP_bar}`, result: { value: dT, unit: "degC" } },
      ],
      method: "Joule-Thomson (linear)",
      trustTier: "computed",
      flags: [],
    };
  },
};
