import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";

export const oilFvfStanding: Calc = {
  id: "oilFvfStanding",
  name: "Oil FVF — Standing correlation",
  requiredInputs: [
    { name: "solutionGor", exampleUnit: "scf/STB" },
    { name: "gasSG", exampleUnit: "" },
    { name: "oilAPI", exampleUnit: "" },
    { name: "temperature", exampleUnit: "degF" },
  ],
  run(input: CalcInput): CalcResult {
    const Rs = input.inputs.solutionGor.value; // scf/STB
    const gammaG = input.inputs.gasSG.value;
    const API = input.inputs.oilAPI.value;
    // T must be in °F for Standing correlation
    const T = convert(input.inputs.temperature.value, input.inputs.temperature.unit, "degF");

    if (!(Rs >= 0)) throw new Error("solutionGor must be >= 0");
    if (!(gammaG > 0)) throw new Error("gasSG must be > 0");
    if (!(API > 0)) throw new Error("oilAPI must be > 0");

    // Oil specific gravity from API gravity
    const gammaO = 141.5 / (131.5 + API);

    // F = Rs · (γg/γo)^0.5 + 1.25·T
    const F = Rs * Math.sqrt(gammaG / gammaO) + 1.25 * T;

    // Bo = 0.9759 + 0.00012 · F^1.2   [rb/STB]
    const Bo = 0.9759 + 0.00012 * Math.pow(F, 1.2);

    return {
      result: { value: Bo, unit: "rb/STB" },
      formula: "Bo = 0.9759 + 0.00012·F^1.2 ;  F = Rs·(γg/γo)^0.5 + 1.25·T",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        {
          label: "Oil specific gravity",
          expression: `γo = 141.5/(131.5+${API}) = ${gammaO.toFixed(4)}`,
          result: { value: gammaO, unit: "" },
        },
        {
          label: "Standing F-factor",
          expression: `F = ${Rs}·(${gammaG}/${gammaO.toFixed(4)})^0.5 + 1.25·${T.toFixed(2)} = ${F.toFixed(2)}`,
          result: { value: F, unit: "" },
        },
        {
          label: "Oil FVF",
          expression: `Bo = 0.9759 + 0.00012·${F.toFixed(2)}^1.2`,
          result: { value: Bo, unit: "rb/STB" },
        },
      ],
      method: "Standing (1947) correlation",
      trustTier: "computed",
      flags: [],
    };
  },
};
