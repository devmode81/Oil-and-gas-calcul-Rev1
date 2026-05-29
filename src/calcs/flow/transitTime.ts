import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";
import { checkMaxVelocity } from "../../core/sanity";

/**
 * Time for fluid to travel a distance L through a pipe of inside diameter D
 * at total volumetric flowrate Q (at line conditions):
 *   A = π·D²/4 ;  v = Q/A ;  t = L/v = L·A/Q
 */
export const transitTime: Calc = {
  id: "transitTime",
  name: "Pipeline transit time",
  requiredInputs: [
    { name: "flowrate", exampleUnit: "m^3/s" },
    { name: "diameter", exampleUnit: "m" },
    { name: "distance", exampleUnit: "m" },
  ],
  run(input: CalcInput): CalcResult {
    const Q = convert(input.inputs.flowrate.value, input.inputs.flowrate.unit, "m^3/s");
    const D = convert(input.inputs.diameter.value, input.inputs.diameter.unit, "m");
    const L = convert(input.inputs.distance.value, input.inputs.distance.unit, "m");
    const A = (Math.PI * D * D) / 4;
    const v = Q / A;
    const t = L / v;
    const velocityFlag = checkMaxVelocity({ value: v, unit: "m/s" });
    return {
      result: { value: t, unit: "s" },
      formula: "t = L·A/Q,  A = π·D²/4,  v = Q/A",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        { label: "Cross-sectional area", expression: `A = π·(${D} m)²/4`, result: { value: A, unit: "m^2" } },
        { label: "Velocity", expression: `v = ${Q}/${A}`, result: { value: v, unit: "m/s" } },
        { label: "Transit time", expression: `t = ${L}/${v}`, result: { value: t, unit: "s" } },
      ],
      method: "Plug-flow transit time",
      trustTier: "computed",
      flags: velocityFlag ? [velocityFlag] : [],
    };
  },
};
