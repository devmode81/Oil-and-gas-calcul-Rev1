import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";

export const reynolds: Calc = {
  id: "reynolds",
  name: "Reynolds number",
  requiredInputs: [
    { name: "density", exampleUnit: "kg/m^3" },
    { name: "velocity", exampleUnit: "m/s" },
    { name: "diameter", exampleUnit: "m" },
    { name: "viscosity", exampleUnit: "Pa s" },
  ],
  run(input: CalcInput): CalcResult {
    const rho = convert(input.inputs.density.value, input.inputs.density.unit, "kg/m^3");
    const v = convert(input.inputs.velocity.value, input.inputs.velocity.unit, "m/s");
    const D = convert(input.inputs.diameter.value, input.inputs.diameter.unit, "m");
    const mu = convert(input.inputs.viscosity.value, input.inputs.viscosity.unit, "Pa s");
    const Re = (rho * v * D) / mu;
    return {
      result: { value: Re, unit: "" },
      formula: "Re = ρ·v·D/μ",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        { label: "Normalise to SI", expression: `ρ=${rho} kg/m³, v=${v} m/s, D=${D} m, μ=${mu} Pa·s` },
        { label: "Apply formula", expression: `Re = (${rho}·${v}·${D})/${mu}`, result: { value: Re, unit: "" } },
      ],
      method: "Reynolds number",
      trustTier: "computed",
      flags: [],
    };
  },
};
