import type { Calc, CalcInput, CalcResult, Assumption } from "../../core/types";
import { convert } from "../../units/convert";
import { mergeAssumptions } from "../../core/assumptions";

const BASE: Assumption[] = [
  { key: "g", label: "Gravitational acceleration", value: { value: 9.80665, unit: "m/s^2" }, source: "Standard gravity" },
];

export const killMudWeight: Calc = {
  id: "killMudWeight",
  name: "Kill mud weight (KMW)",
  requiredInputs: [
    { name: "mudWeight", exampleUnit: "ppg" },
    { name: "sidpp", exampleUnit: "psi" },
    { name: "tvd", exampleUnit: "ft" },
  ],
  run(input: CalcInput): CalcResult {
    const assumptions = mergeAssumptions(BASE, input.assumptionOverrides);
    const g = assumptions.find((a) => a.key === "g")!.value.value;
    const rho = convert(input.inputs.mudWeight.value, input.inputs.mudWeight.unit, "kg/m^3");
    const sidpp = convert(input.inputs.sidpp.value, input.inputs.sidpp.unit, "Pa");
    const h = convert(input.inputs.tvd.value, input.inputs.tvd.unit, "m");
    if (!(rho > 0)) throw new Error("mudWeight must be > 0");
    if (!(h > 0)) throw new Error("tvd must be > 0");
    const drho = sidpp / (g * h);
    const kmw_rho = rho + drho;
    const kmw_ppg = convert(kmw_rho, "kg/m^3", "ppg");
    return {
      result: { value: kmw_ppg, unit: "ppg" },
      formula: "KMW = mudWeight + SIDPP/(g·TVD)",
      inputs: input.inputs,
      assumptions,
      steps: [
        { label: "Mud density", expression: `ρ = ${rho.toFixed(3)} kg/m³` },
        { label: "SIDPP", expression: `SIDPP = ${sidpp.toFixed(0)} Pa` },
        { label: "Density increment", expression: `Δρ = SIDPP/(g·h) = ${sidpp.toFixed(0)}/(${g}·${h})`, result: { value: drho, unit: "kg/m^3" } },
        { label: "Kill mud density", expression: `KMW = ${rho.toFixed(3)} + ${drho.toFixed(3)}`, result: { value: kmw_rho, unit: "kg/m^3" } },
        { label: "Kill mud weight (ppg)", expression: `${kmw_rho.toFixed(3)} kg/m³ → ppg`, result: { value: kmw_ppg, unit: "ppg" } },
      ],
      method: "Driller's method kill mud weight",
      reference: "IWCF well control (kill mud weight)",
      trustTier: "validated",
      flags: [],
    };
  },
};
