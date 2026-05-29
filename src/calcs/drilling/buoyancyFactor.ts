import type { Calc, CalcInput, CalcResult, Assumption } from "../../core/types";
import { convert } from "../../units/convert";
import { mergeAssumptions } from "../../core/assumptions";

const BASE: Assumption[] = [
  { key: "steelDensity", label: "Steel density", value: { value: 7850, unit: "kg/m^3" }, source: "Typical carbon steel" },
];

export const buoyancyFactor: Calc = {
  id: "buoyancyFactor",
  name: "Buoyancy factor (BF)",
  requiredInputs: [
    { name: "mudWeight", exampleUnit: "ppg" },
  ],
  run(input: CalcInput): CalcResult {
    const assumptions = mergeAssumptions(BASE, input.assumptionOverrides);
    const rho_steel = assumptions.find((a) => a.key === "steelDensity")!.value.value;
    const rho_mud = convert(input.inputs.mudWeight.value, input.inputs.mudWeight.unit, "kg/m^3");
    if (!(rho_mud > 0)) throw new Error("mudWeight must be > 0");
    const BF = 1 - rho_mud / rho_steel;
    const steps = [
      { label: "Mud density", expression: `ρ_mud = ${rho_mud.toFixed(3)} kg/m³` },
      { label: "Steel density", expression: `ρ_steel = ${rho_steel} kg/m³` },
      { label: "Buoyancy factor", expression: `BF = 1 − ${rho_mud.toFixed(3)}/${rho_steel}`, result: { value: BF, unit: "" } },
    ];
    // Include buoyed weight step if airWeight provided
    if (input.inputs.airWeight) {
      const W_air = input.inputs.airWeight.value;
      const W_buoyed = W_air * BF;
      steps.push({ label: "Buoyed weight", expression: `W_buoyed = ${W_air} × ${BF.toFixed(4)}`, result: { value: W_buoyed, unit: input.inputs.airWeight.unit } });
    }
    return {
      result: { value: BF, unit: "" },
      formula: "BF = 1 − ρ_mud/ρ_steel",
      inputs: input.inputs,
      assumptions,
      steps,
      method: "Archimedes buoyancy factor",
      trustTier: "computed",
      flags: [],
    };
  },
};
