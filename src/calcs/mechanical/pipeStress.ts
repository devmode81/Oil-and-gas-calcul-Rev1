import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";

export const pipeStress: Calc = {
  id: "pipeStress",
  name: "Pipe hoop and longitudinal stress (thin-wall)",
  requiredInputs: [
    { name: "pressure", exampleUnit: "Pa" },
    { name: "outerDiameter", exampleUnit: "m" },
    { name: "wallThickness", exampleUnit: "m" },
  ],
  run(input: CalcInput): CalcResult {
    const P = convert(input.inputs.pressure.value, input.inputs.pressure.unit, "Pa");
    const D = convert(input.inputs.outerDiameter.value, input.inputs.outerDiameter.unit, "m");
    const t = convert(input.inputs.wallThickness.value, input.inputs.wallThickness.unit, "m");

    if (!(P > 0)) throw new Error("pressure must be > 0");
    if (!(t > 0)) throw new Error("wallThickness must be > 0");
    if (!(D > 2 * t)) throw new Error("outerDiameter must be > 2·wallThickness");

    // σ_h = P·D/(2·t);  σ_l = P·D/(4·t)
    const sigma_h = (P * D) / (2 * t);
    const sigma_l = (P * D) / (4 * t);

    return {
      result: { value: sigma_h, unit: "Pa" },
      formula: "σ_h = P·D/(2·t);  σ_l = P·D/(4·t)",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        { label: "Hoop stress", expression: `σ_h = ${P}·${D}/(2·${t})`, result: { value: sigma_h, unit: "Pa" } },
        { label: "Longitudinal stress", expression: `σ_l = ${P}·${D}/(4·${t})`, result: { value: sigma_l, unit: "Pa" } },
      ],
      method: "Thin-wall pressure vessel (Barlow)",
      trustTier: "computed",
      flags: [],
    };
  },
};
