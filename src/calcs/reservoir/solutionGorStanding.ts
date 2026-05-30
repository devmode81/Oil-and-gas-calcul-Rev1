import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";

export const solutionGorStanding: Calc = {
  id: "solutionGorStanding",
  name: "Solution GOR — Standing correlation",
  requiredInputs: [
    { name: "pressure", exampleUnit: "psi" },
    { name: "gasSG", exampleUnit: "" },
    { name: "oilAPI", exampleUnit: "" },
    { name: "temperature", exampleUnit: "degF" },
  ],
  run(input: CalcInput): CalcResult {
    const P = convert(input.inputs.pressure.value, input.inputs.pressure.unit, "psi");
    const gammaG = input.inputs.gasSG.value;
    const API = input.inputs.oilAPI.value;
    // T must be in °F for Standing correlation
    const T = convert(input.inputs.temperature.value, input.inputs.temperature.unit, "degF");

    if (!(P > 0)) throw new Error("pressure must be > 0");
    if (!(gammaG > 0)) throw new Error("gasSG must be > 0");
    if (!(API > 0)) throw new Error("oilAPI must be > 0");

    // Rs = γg · [(P/18.2 + 1.4) · 10^(0.0125·API − 0.00091·T)]^1.2048   [scf/STB]
    const exponent = 0.0125 * API - 0.00091 * T;
    const bracket = (P / 18.2 + 1.4) * Math.pow(10, exponent);
    const Rs = gammaG * Math.pow(bracket, 1.2048);

    return {
      result: { value: Rs, unit: "scf/STB" },
      formula: "Rs = γg·[(P/18.2 + 1.4)·10^(0.0125·API − 0.00091·T)]^1.2048",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        {
          label: "Pressure",
          expression: `P = ${P.toFixed(2)} psia`,
        },
        {
          label: "Temperature",
          expression: `T = ${T.toFixed(2)} °F`,
        },
        {
          label: "Exponent",
          expression: `exp = 0.0125·${API} − 0.00091·${T.toFixed(2)} = ${exponent.toFixed(5)}`,
          result: { value: exponent, unit: "" },
        },
        {
          label: "Bracket",
          expression: `(${P.toFixed(2)}/18.2 + 1.4) · 10^${exponent.toFixed(5)} = ${bracket.toFixed(4)}`,
          result: { value: bracket, unit: "" },
        },
        {
          label: "Solution GOR",
          expression: `Rs = ${gammaG} · ${bracket.toFixed(4)}^1.2048`,
          result: { value: Rs, unit: "scf/STB" },
        },
      ],
      method: "Standing (1947) correlation",
      trustTier: "computed",
      flags: [],
    };
  },
};
