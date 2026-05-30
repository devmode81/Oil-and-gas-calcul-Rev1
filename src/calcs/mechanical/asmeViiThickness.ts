import type { Calc, CalcInput, CalcResult, Assumption } from "../../core/types";
import { convert } from "../../units/convert";
import { mergeAssumptions } from "../../core/assumptions";

const BASE: Assumption[] = [
  { key: "jointEfficiency", label: "Joint efficiency E", value: { value: 1.0, unit: "" }, source: "Full radiographic examination (ASME VIII Div 1 Table UW-12)" },
  { key: "corrosionAllowance", label: "Corrosion allowance", value: { value: 0, unit: "m" }, source: "No corrosion allowance (user to specify)" },
];

export const asmeViiThickness: Calc = {
  id: "asmeViiThickness",
  name: "ASME VIII Div 1 minimum wall thickness",
  requiredInputs: [
    { name: "pressure", exampleUnit: "Pa" },
    { name: "innerRadius", exampleUnit: "m" },
    { name: "allowableStress", exampleUnit: "Pa" },
  ],
  run(input: CalcInput): CalcResult {
    const assumptions = mergeAssumptions(BASE, input.assumptionOverrides);
    const E = assumptions.find((a) => a.key === "jointEfficiency")!.value.value;

    const P = convert(input.inputs.pressure.value, input.inputs.pressure.unit, "Pa");
    const R = convert(input.inputs.innerRadius.value, input.inputs.innerRadius.unit, "m");
    const S = convert(input.inputs.allowableStress.value, input.inputs.allowableStress.unit, "Pa");

    // Corrosion allowance: from input or assumption
    let CA: number;
    if (input.inputs.corrosionAllowance) {
      CA = convert(input.inputs.corrosionAllowance.value, input.inputs.corrosionAllowance.unit, "m");
    } else {
      CA = assumptions.find((a) => a.key === "corrosionAllowance")!.value.value;
    }

    if (!(P > 0)) throw new Error("pressure must be > 0");
    if (!(R > 0)) throw new Error("innerRadius must be > 0");
    if (!(S > 0)) throw new Error("allowableStress must be > 0");

    // ASME VIII Div 1 §UG-27: t = P·R/(S·E − 0.6·P)
    const t_base = (P * R) / (S * E - 0.6 * P);
    const t = t_base + CA;

    return {
      result: { value: t, unit: "m" },
      formula: "t = P·R/(S·E − 0.6·P) + CA",
      inputs: input.inputs,
      assumptions,
      steps: [
        { label: "Denominator S·E − 0.6·P", expression: `${S}·${E} − 0.6·${P}`, result: { value: S * E - 0.6 * P, unit: "Pa" } },
        { label: "Base thickness", expression: `t = ${P}·${R}/(${S * E - 0.6 * P})`, result: { value: t_base, unit: "m" } },
        { label: "Corrosion allowance", expression: `CA = ${CA} m`, result: { value: CA, unit: "m" } },
        { label: "Minimum thickness", expression: `t = ${t_base} + ${CA}`, result: { value: t, unit: "m" } },
      ],
      method: "ASME VIII Div 1 circumferential stress",
      reference: "ASME VIII Div 1 §UG-27",
      trustTier: "validated",
      flags: [],
    };
  },
};
