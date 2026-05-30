import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";

export const collapsePressure: Calc = {
  id: "collapsePressure",
  name: "Thin-wall elastic collapse pressure",
  requiredInputs: [
    { name: "wallThickness", exampleUnit: "m" },
    { name: "outerDiameter", exampleUnit: "m" },
    { name: "youngsModulus", exampleUnit: "Pa" },
    { name: "poissonRatio", exampleUnit: "" },
  ],
  run(input: CalcInput): CalcResult {
    const t = convert(input.inputs.wallThickness.value, input.inputs.wallThickness.unit, "m");
    const Do = convert(input.inputs.outerDiameter.value, input.inputs.outerDiameter.unit, "m");
    const E = convert(input.inputs.youngsModulus.value, input.inputs.youngsModulus.unit, "Pa");
    const nu = input.inputs.poissonRatio.value; // dimensionless

    if (!(t > 0)) throw new Error("wallThickness must be > 0");
    if (!(E > 0)) throw new Error("youngsModulus must be > 0");
    if (!(nu > 0 && nu < 0.5)) throw new Error("poissonRatio must be in (0, 0.5)");
    if (!(Do > 2 * t)) throw new Error("outerDiameter must be > 2·wallThickness (thin-wall assumption)");

    // Elastic collapse: P_cr = 2E·(t/D_o)³ / (1 − ν²)
    const tOverDo = t / Do;
    const Pcr = (2 * E * tOverDo ** 3) / (1 - nu * nu);

    return {
      result: { value: Pcr, unit: "Pa" },
      formula: "P_cr = 2E·(t/D_o)³ / (1 − ν²)",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        { label: "Normalise to SI", expression: `t=${t} m, D_o=${Do} m, E=${E} Pa, ν=${nu}` },
        { label: "t/D_o ratio", expression: `t/D_o = ${t}/${Do} = ${tOverDo}` },
        { label: "Elastic collapse pressure", expression: `P_cr = 2·${E}·${tOverDo}³/(1−${nu}²)`, result: { value: Pcr, unit: "Pa" } },
      ],
      method: "Thin-wall elastic collapse (Timoshenko)",
      reference: "Thin-wall elastic collapse (Timoshenko)",
      trustTier: "validated",
      flags: [],
    };
  },
};
