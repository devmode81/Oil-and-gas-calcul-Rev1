import type { Calc, CalcInput, CalcResult, Assumption } from "../../core/types";
import { convert } from "../../units/convert";
import { mergeAssumptions } from "../../core/assumptions";

const BASE: Assumption[] = [
  { key: "C", label: "Erosional constant", value: { value: 100, unit: "" }, source: "API RP 14E continuous service (use 125 intermittent)" },
];

export const erosionalVelocity: Calc = {
  id: "erosionalVelocity",
  name: "Erosional velocity (API RP 14E)",
  requiredInputs: [{ name: "mixtureDensity", exampleUnit: "kg/m^3" }],
  run(input: CalcInput): CalcResult {
    const assumptions = mergeAssumptions(BASE, input.assumptionOverrides);
    const C = assumptions.find((a) => a.key === "C")!.value.value;
    const rhoSI = convert(input.inputs.mixtureDensity.value, input.inputs.mixtureDensity.unit, "kg/m^3");
    if (!(rhoSI > 0)) throw new Error("mixture density must be > 0");
    const rhoLb = convert(rhoSI, "kg/m^3", "lbm/ft^3");
    const veFts = C / Math.sqrt(rhoLb); // ft/s
    const veMs = convert(veFts, "ft/s", "m/s");
    return {
      result: { value: veMs, unit: "m/s" },
      formula: "Ve = C/√ρ_m  (ρ in lb/ft³, Ve in ft/s)",
      inputs: input.inputs,
      assumptions,
      steps: [
        { label: "Mixture density (field units)", expression: `ρ_m = ${rhoLb} lb/ft³` },
        { label: "Erosional velocity (ft/s)", expression: `Ve = ${C}/√${rhoLb}`, result: { value: veFts, unit: "ft/s" } },
        { label: "Convert to SI", expression: `Ve = ${veFts} ft/s`, result: { value: veMs, unit: "m/s" } },
      ],
      method: "API RP 14E erosional velocity",
      reference: "API RP 14E §2.5 (erosional velocity)",
      trustTier: "validated",
      flags: [],
    };
  },
};
