import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";
import { mergeAssumptions } from "../../core/assumptions";
import type { Assumption } from "../../core/types";

const BASE_ASSUMPTIONS: Assumption[] = [
  { key: "E", label: "Longitudinal joint factor", value: { value: 1, unit: "" }, source: "Seamless pipe (E=1)" },
];

/**
 * Barlow's formula for minimum wall thickness (hoop stress):
 *   t = P·D / (2·S·E)
 * where D is outside diameter, S the allowable stress, E the joint factor.
 * Cited per ASME B31.x / Barlow's equation.
 */
export const barlowWallThickness: Calc = {
  id: "barlowWallThickness",
  name: "Pipe wall thickness (Barlow)",
  requiredInputs: [
    { name: "pressure", exampleUnit: "psi" },
    { name: "outsideDiameter", exampleUnit: "inch" },
    { name: "allowableStress", exampleUnit: "psi" },
  ],
  run(input: CalcInput): CalcResult {
    const assumptions = mergeAssumptions(BASE_ASSUMPTIONS, input.assumptionOverrides);
    const E = assumptions.find((a) => a.key === "E")!.value.value;
    const P = convert(input.inputs.pressure.value, input.inputs.pressure.unit, "psi");
    const D = convert(input.inputs.outsideDiameter.value, input.inputs.outsideDiameter.unit, "inch");
    const S = convert(input.inputs.allowableStress.value, input.inputs.allowableStress.unit, "psi");
    const t = (P * D) / (2 * S * E);
    return {
      result: { value: t, unit: "inch" },
      formula: "t = P·D / (2·S·E)",
      inputs: input.inputs,
      assumptions,
      steps: [
        { label: "Normalise to field units", expression: `P=${P} psi, D=${D} in, S=${S} psi, E=${E}` },
        { label: "Apply Barlow", expression: `t = (${P}·${D})/(2·${S}·${E})`, result: { value: t, unit: "inch" } },
      ],
      method: "Barlow hoop-stress",
      reference: "Barlow's formula (ASME B31.x hoop stress)",
      trustTier: "validated",
      flags: [],
    };
  },
};
