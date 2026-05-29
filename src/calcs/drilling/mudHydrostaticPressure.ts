import type { Calc, CalcInput, CalcResult, Assumption } from "../../core/types";
import { convert } from "../../units/convert";
import { mergeAssumptions } from "../../core/assumptions";

const BASE: Assumption[] = [
  { key: "g", label: "Gravitational acceleration", value: { value: 9.80665, unit: "m/s^2" }, source: "Standard gravity" },
];

export const mudHydrostaticPressure: Calc = {
  id: "mudHydrostaticPressure",
  name: "Mud hydrostatic pressure",
  requiredInputs: [
    { name: "mudWeight", exampleUnit: "ppg" },
    { name: "tvd", exampleUnit: "ft" },
  ],
  run(input: CalcInput): CalcResult {
    const assumptions = mergeAssumptions(BASE, input.assumptionOverrides);
    const g = assumptions.find((a) => a.key === "g")!.value.value;
    const rho = convert(input.inputs.mudWeight.value, input.inputs.mudWeight.unit, "kg/m^3");
    const h = convert(input.inputs.tvd.value, input.inputs.tvd.unit, "m");
    if (!(rho > 0)) throw new Error("mudWeight must be > 0");
    if (!(h >= 0)) throw new Error("tvd must be >= 0");
    const P_Pa = rho * g * h;
    const P_psi = convert(P_Pa, "Pa", "psi");
    return {
      result: { value: P_psi, unit: "psi" },
      formula: "P = ρ·g·TVD",
      inputs: input.inputs,
      assumptions,
      steps: [
        { label: "Mud density", expression: `ρ = ${rho.toFixed(2)} kg/m³` },
        { label: "TVD", expression: `h = ${h} m` },
        { label: "Pressure (Pa)", expression: `P = ${rho.toFixed(2)}·${g}·${h}`, result: { value: P_Pa, unit: "Pa" } },
        { label: "Pressure (psi)", expression: `P = ${P_Pa.toFixed(0)} Pa → psi`, result: { value: P_psi, unit: "psi" } },
      ],
      method: "Hydrostatic pressure (P = ρgH)",
      trustTier: "computed",
      flags: [],
    };
  },
};
