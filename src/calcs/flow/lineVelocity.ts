import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";

export const lineVelocity: Calc = {
  id: "lineVelocity",
  name: "Pipe line velocity",
  requiredInputs: [
    { name: "flowrate", exampleUnit: "m^3/s" },
    { name: "diameter", exampleUnit: "m" },
  ],
  run(input: CalcInput): CalcResult {
    const Q = convert(input.inputs.flowrate.value, input.inputs.flowrate.unit, "m^3/s");
    const D = convert(input.inputs.diameter.value, input.inputs.diameter.unit, "m");
    if (!(D > 0)) throw new Error("diameter must be > 0");
    if (Q < 0) throw new Error("flowrate must be >= 0");
    const A = (Math.PI * D * D) / 4;
    const v = Q / A;
    return {
      result: { value: v, unit: "m/s" },
      formula: "v = Q/A,  A = π·D²/4",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        { label: "Cross-sectional area", expression: `A = π·(${D} m)²/4`, result: { value: A, unit: "m^2" } },
        { label: "Velocity", expression: `v = ${Q}/${A}`, result: { value: v, unit: "m/s" } },
      ],
      method: "Continuity (Q = v·A)",
      trustTier: "computed",
      flags: [],
    };
  },
};
