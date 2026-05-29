import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";

export const annularVelocity: Calc = {
  id: "annularVelocity",
  name: "Annular velocity",
  requiredInputs: [
    { name: "flowrate", exampleUnit: "gpm" },
    { name: "holeDiameter", exampleUnit: "inch" },
    { name: "pipeOuterDiameter", exampleUnit: "inch" },
  ],
  run(input: CalcInput): CalcResult {
    const Q = convert(input.inputs.flowrate.value, input.inputs.flowrate.unit, "m^3/s");
    const D_hole = convert(input.inputs.holeDiameter.value, input.inputs.holeDiameter.unit, "m");
    const D_pipe = convert(input.inputs.pipeOuterDiameter.value, input.inputs.pipeOuterDiameter.unit, "m");
    if (!(D_hole > D_pipe)) throw new Error("holeDiameter must be > pipeOuterDiameter");
    if (!(D_pipe > 0)) throw new Error("pipeOuterDiameter must be > 0");
    if (Q < 0) throw new Error("flowrate must be >= 0");
    const A = Math.PI * (D_hole * D_hole - D_pipe * D_pipe) / 4;
    const v = Q / A;
    const v_ftmin = v / 0.3048 * 60;
    return {
      result: { value: v, unit: "m/s" },
      formula: "A = π(D_hole² − D_pipe²)/4 ;  v = Q/A",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        { label: "Hole diameter", expression: `D_hole = ${D_hole.toFixed(4)} m` },
        { label: "Pipe OD", expression: `D_pipe = ${D_pipe.toFixed(4)} m` },
        { label: "Annular area", expression: `A = π·(${D_hole.toFixed(4)}² − ${D_pipe.toFixed(4)}²)/4`, result: { value: A, unit: "m^2" } },
        { label: "Annular velocity (m/s)", expression: `v = ${Q.toFixed(6)}/${A.toFixed(6)}`, result: { value: v, unit: "m/s" } },
        { label: "Annular velocity (ft/min)", expression: `v = ${v.toFixed(4)} m/s → ft/min`, result: { value: v_ftmin, unit: "ft/min" } },
      ],
      method: "Continuity (Q = v·A), annular geometry",
      trustTier: "computed",
      flags: [],
    };
  },
};
