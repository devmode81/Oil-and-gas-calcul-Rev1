import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";

export const gasFvf: Calc = {
  id: "gasFvf",
  name: "Gas formation volume factor (Bg)",
  requiredInputs: [
    { name: "zFactor", exampleUnit: "" },
    { name: "temperature", exampleUnit: "rankine" },
    { name: "pressure", exampleUnit: "psi" },
  ],
  run(input: CalcInput): CalcResult {
    const Z = input.inputs.zFactor.value;
    // T must be in °R; convert from any temperature unit
    const T = convert(input.inputs.temperature.value, input.inputs.temperature.unit, "rankine");
    const P = convert(input.inputs.pressure.value, input.inputs.pressure.unit, "psi");

    if (!(Z > 0)) throw new Error("zFactor must be > 0");
    if (!(T > 0)) throw new Error("temperature must be > 0");
    if (!(P > 0)) throw new Error("pressure must be > 0");

    // Bg = 0.02827 · Z · T / P   [ft^3/scf]
    // T in °R, P in psia
    const Bg = (0.02827 * Z * T) / P;

    return {
      result: { value: Bg, unit: "ft^3/scf" },
      formula: "Bg = 0.02827·Z·T/P",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        { label: "Temperature", expression: `T = ${T.toFixed(2)} °R` },
        { label: "Pressure", expression: `P = ${P.toFixed(2)} psia` },
        {
          label: "Gas FVF",
          expression: `Bg = 0.02827 × ${Z} × ${T.toFixed(2)} / ${P.toFixed(2)}`,
          result: { value: Bg, unit: "ft^3/scf" },
        },
      ],
      method: "Real-gas law (field units)",
      trustTier: "computed",
      flags: [],
    };
  },
};
