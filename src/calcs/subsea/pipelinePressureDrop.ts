import type { Calc, CalcInput, CalcResult, Assumption } from "../../core/types";
import { convert } from "../../units/convert";
import { mergeAssumptions } from "../../core/assumptions";

const BASE: Assumption[] = [
  { key: "g", label: "Gravitational acceleration", value: { value: 9.80665, unit: "m/s^2" }, source: "Standard gravity" },
];

export const pipelinePressureDrop: Calc = {
  id: "pipelinePressureDrop",
  name: "Pipeline pressure drop (friction + elevation)",
  requiredInputs: [
    { name: "frictionFactor", exampleUnit: "" },
    { name: "length", exampleUnit: "m" },
    { name: "diameter", exampleUnit: "m" },
    { name: "density", exampleUnit: "kg/m^3" },
    { name: "velocity", exampleUnit: "m/s" },
    { name: "elevationChange", exampleUnit: "m" },
  ],
  run(input: CalcInput): CalcResult {
    const assumptions = mergeAssumptions(BASE, input.assumptionOverrides);
    const g = assumptions.find((a) => a.key === "g")!.value.value;

    const f = input.inputs.frictionFactor.value;
    const L = convert(input.inputs.length.value, input.inputs.length.unit, "m");
    const D = convert(input.inputs.diameter.value, input.inputs.diameter.unit, "m");
    const rho = convert(input.inputs.density.value, input.inputs.density.unit, "kg/m^3");
    const v = convert(input.inputs.velocity.value, input.inputs.velocity.unit, "m/s");
    const dz = convert(input.inputs.elevationChange.value, input.inputs.elevationChange.unit, "m");

    if (!(D > 0)) throw new Error("diameter must be > 0");
    if (!(rho > 0)) throw new Error("density must be > 0");

    const dPf = f * (L / D) * ((rho * v * v) / 2);
    const dPelev = rho * g * dz;
    const dPtotal = dPf + dPelev;

    return {
      result: { value: dPtotal, unit: "Pa" },
      formula: "ΔP_total = ΔP_friction + ΔP_elevation;  ΔP_f = f·(L/D)·(ρ·v²/2);  ΔP_elev = ρ·g·Δz",
      inputs: input.inputs,
      assumptions,
      steps: [
        { label: "Normalise to SI", expression: `f=${f}, L=${L} m, D=${D} m, ρ=${rho} kg/m³, v=${v} m/s, Δz=${dz} m` },
        { label: "Friction pressure drop", expression: `ΔP_f = ${f}·(${L}/${D})·(${rho}·${v}²/2)`, result: { value: dPf, unit: "Pa" } },
        { label: "Elevation pressure drop", expression: `ΔP_elev = ${rho}·${g}·${dz}`, result: { value: dPelev, unit: "Pa" } },
        { label: "Total pressure drop", expression: `ΔP_total = ${dPf} + ${dPelev}`, result: { value: dPtotal, unit: "Pa" } },
      ],
      method: "Darcy-Weisbach + hydrostatic",
      trustTier: "computed",
      flags: [],
    };
  },
};
