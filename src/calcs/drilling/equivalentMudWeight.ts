import type { Calc, CalcInput, CalcResult, Assumption } from "../../core/types";
import { convert } from "../../units/convert";
import { mergeAssumptions } from "../../core/assumptions";

const BASE: Assumption[] = [
  { key: "g", label: "Gravitational acceleration", value: { value: 9.80665, unit: "m/s^2" }, source: "Standard gravity" },
];

export const equivalentMudWeight: Calc = {
  id: "equivalentMudWeight",
  name: "Equivalent mud weight (EMW)",
  requiredInputs: [
    { name: "pressure", exampleUnit: "psi" },
    { name: "tvd", exampleUnit: "ft" },
  ],
  run(input: CalcInput): CalcResult {
    const assumptions = mergeAssumptions(BASE, input.assumptionOverrides);
    const g = assumptions.find((a) => a.key === "g")!.value.value;
    const P = convert(input.inputs.pressure.value, input.inputs.pressure.unit, "Pa");
    const h = convert(input.inputs.tvd.value, input.inputs.tvd.unit, "m");
    if (!(h > 0)) throw new Error("tvd must be > 0");
    const rho = P / (g * h);
    const emw_ppg = convert(rho, "kg/m^3", "ppg");
    return {
      result: { value: emw_ppg, unit: "ppg" },
      formula: "EMW = P/(g·TVD)",
      inputs: input.inputs,
      assumptions,
      steps: [
        { label: "Pressure", expression: `P = ${P.toFixed(0)} Pa` },
        { label: "TVD", expression: `h = ${h} m` },
        { label: "Density", expression: `ρ = P/(g·h) = ${P.toFixed(0)}/(${g}·${h})`, result: { value: rho, unit: "kg/m^3" } },
        { label: "EMW (ppg)", expression: `${rho.toFixed(2)} kg/m³ → ppg`, result: { value: emw_ppg, unit: "ppg" } },
      ],
      method: "EMW from pressure (P = ρgH)",
      trustTier: "computed",
      flags: [],
    };
  },
};
