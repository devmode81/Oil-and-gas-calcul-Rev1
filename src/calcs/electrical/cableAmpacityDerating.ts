import type { Calc, CalcInput, CalcResult, Assumption } from "../../core/types";
import { convert } from "../../units/convert";
import { mergeAssumptions } from "../../core/assumptions";

const BASE: Assumption[] = [
  { key: "tempDeratingFactor", label: "Temperature derating factor", value: { value: 1.0, unit: "" }, source: "No temperature correction" },
  { key: "groupDeratingFactor", label: "Group derating factor", value: { value: 1.0, unit: "" }, source: "Single cable / no grouping" },
];

export const cableAmpacityDerating: Calc = {
  id: "cableAmpacityDerating",
  name: "Cable ampacity derating (IEC 60364-5-52)",
  requiredInputs: [
    { name: "baseAmpacity", exampleUnit: "A" },
  ],
  run(input: CalcInput): CalcResult {
    // Build assumption list; inputs can override via direct input keys or assumptionOverrides
    const assumptionOverrides: Record<string, { value: number; unit: string }> = { ...input.assumptionOverrides };
    if (input.inputs.tempDeratingFactor) {
      assumptionOverrides["tempDeratingFactor"] = input.inputs.tempDeratingFactor;
    }
    if (input.inputs.groupDeratingFactor) {
      assumptionOverrides["groupDeratingFactor"] = input.inputs.groupDeratingFactor;
    }

    const assumptions = mergeAssumptions(BASE, assumptionOverrides);
    const kTemp = assumptions.find((a) => a.key === "tempDeratingFactor")!.value.value;
    const kGroup = assumptions.find((a) => a.key === "groupDeratingFactor")!.value.value;

    const I_base = convert(input.inputs.baseAmpacity.value, input.inputs.baseAmpacity.unit, "A");

    if (!(I_base > 0)) throw new Error("baseAmpacity must be > 0");
    if (!(kTemp > 0)) throw new Error("tempDeratingFactor must be > 0");
    if (!(kGroup > 0)) throw new Error("groupDeratingFactor must be > 0");

    const I_derated = I_base * kTemp * kGroup;

    return {
      result: { value: I_derated, unit: "A" },
      formula: "I_derated = I_base · k_temp · k_group",
      inputs: input.inputs,
      assumptions,
      steps: [
        { label: "Derated ampacity", expression: `I = ${I_base}·${kTemp}·${kGroup}`, result: { value: I_derated, unit: "A" } },
      ],
      method: "IEC 60364-5-52 cable ampacity derating",
      reference: "IEC 60364-5-52 cable ampacity derating",
      trustTier: "validated",
      flags: [],
    };
  },
};
