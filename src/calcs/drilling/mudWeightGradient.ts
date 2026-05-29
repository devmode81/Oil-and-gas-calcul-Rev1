import type { Calc, CalcInput, CalcResult, Assumption } from "../../core/types";
import { convert } from "../../units/convert";
import { mergeAssumptions } from "../../core/assumptions";

const BASE: Assumption[] = [
  { key: "g", label: "Gravitational acceleration", value: { value: 9.80665, unit: "m/s^2" }, source: "Standard gravity" },
];

export const mudWeightGradient: Calc = {
  id: "mudWeightGradient",
  name: "Mud weight gradient",
  requiredInputs: [
    { name: "mudWeight", exampleUnit: "ppg" },
  ],
  run(input: CalcInput): CalcResult {
    const assumptions = mergeAssumptions(BASE, input.assumptionOverrides);
    const g = assumptions.find((a) => a.key === "g")!.value.value;
    const rho = convert(input.inputs.mudWeight.value, input.inputs.mudWeight.unit, "kg/m^3");
    if (!(rho > 0)) throw new Error("mudWeight must be > 0");
    // gradient in Pa/m = ρ·g
    const grad_Pa_m = rho * g;
    // convert to psi/ft: 1 Pa/m = 1 Pa/m; 1 psi = 6894.757 Pa; 1 ft = 0.3048 m
    // psi/ft = Pa/m * 0.3048 / 6894.757
    const grad_psi_ft = grad_Pa_m * 0.3048 / 6894.757293;
    return {
      result: { value: grad_psi_ft, unit: "psi/ft" },
      formula: "gradient = ρ·g",
      inputs: input.inputs,
      assumptions,
      steps: [
        { label: "Mud density", expression: `ρ = ${rho.toFixed(4)} kg/m³` },
        { label: "Gradient (Pa/m)", expression: `ρ·g = ${rho.toFixed(4)}·${g}`, result: { value: grad_Pa_m, unit: "Pa/m" } },
        { label: "Gradient (psi/ft)", expression: `${grad_Pa_m.toFixed(2)} Pa/m → psi/ft`, result: { value: grad_psi_ft, unit: "psi/ft" } },
      ],
      method: "Hydrostatic gradient (ρ·g)",
      trustTier: "computed",
      flags: [],
    };
  },
};
