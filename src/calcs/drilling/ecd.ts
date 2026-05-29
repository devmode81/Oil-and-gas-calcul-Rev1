import type { Calc, CalcInput, CalcResult, Assumption } from "../../core/types";
import { convert } from "../../units/convert";
import { mergeAssumptions } from "../../core/assumptions";

const BASE: Assumption[] = [
  { key: "g", label: "Gravitational acceleration", value: { value: 9.80665, unit: "m/s^2" }, source: "Standard gravity" },
];

export const ecd: Calc = {
  id: "ecd",
  name: "Equivalent circulating density (ECD)",
  requiredInputs: [
    { name: "mudWeight", exampleUnit: "ppg" },
    { name: "annularPressureLoss", exampleUnit: "psi" },
    { name: "tvd", exampleUnit: "ft" },
  ],
  run(input: CalcInput): CalcResult {
    const assumptions = mergeAssumptions(BASE, input.assumptionOverrides);
    const g = assumptions.find((a) => a.key === "g")!.value.value;
    const rho = convert(input.inputs.mudWeight.value, input.inputs.mudWeight.unit, "kg/m^3");
    const dP = convert(input.inputs.annularPressureLoss.value, input.inputs.annularPressureLoss.unit, "Pa");
    const h = convert(input.inputs.tvd.value, input.inputs.tvd.unit, "m");
    if (!(rho > 0)) throw new Error("mudWeight must be > 0");
    if (!(h > 0)) throw new Error("tvd must be > 0");
    const drho = dP / (g * h);
    const ecd_rho = rho + drho;
    const ecd_ppg = convert(ecd_rho, "kg/m^3", "ppg");
    return {
      result: { value: ecd_ppg, unit: "ppg" },
      formula: "ECD = mudWeight + ΔP_ann/(g·TVD)",
      inputs: input.inputs,
      assumptions,
      steps: [
        { label: "Mud density", expression: `ρ = ${rho.toFixed(2)} kg/m³` },
        { label: "Annular pressure loss", expression: `ΔP = ${dP.toFixed(0)} Pa` },
        { label: "Density increment", expression: `Δρ = ΔP/(g·h) = ${dP.toFixed(0)}/(${g}·${h})`, result: { value: drho, unit: "kg/m^3" } },
        { label: "ECD density", expression: `ECD = ${rho.toFixed(2)} + ${drho.toFixed(2)}`, result: { value: ecd_rho, unit: "kg/m^3" } },
        { label: "ECD (ppg)", expression: `${ecd_rho.toFixed(2)} kg/m³ → ppg`, result: { value: ecd_ppg, unit: "ppg" } },
      ],
      method: "ECD from annular pressure loss",
      reference: "IADC/IWCF well control (ECD)",
      trustTier: "validated",
      flags: [],
    };
  },
};
