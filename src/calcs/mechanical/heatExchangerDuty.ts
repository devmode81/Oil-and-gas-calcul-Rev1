import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";

export const heatExchangerDuty: Calc = {
  id: "heatExchangerDuty",
  name: "Heat exchanger duty",
  requiredInputs: [
    { name: "massFlowrate", exampleUnit: "kg/s" },
    { name: "heatCapacity", exampleUnit: "J/(kg K)" },
    { name: "tempIn", exampleUnit: "degC" },
    { name: "tempOut", exampleUnit: "degC" },
  ],
  run(input: CalcInput): CalcResult {
    const mdot = convert(input.inputs.massFlowrate.value, input.inputs.massFlowrate.unit, "kg/s");
    const Cp = input.inputs.heatCapacity.value; // J/(kg·K) — SI scalar
    // Convert absolute temperatures to K, then take arithmetic difference
    const T_in = convert(input.inputs.tempIn.value, input.inputs.tempIn.unit, "K");
    const T_out = convert(input.inputs.tempOut.value, input.inputs.tempOut.unit, "K");

    if (!(mdot >= 0)) throw new Error("massFlowrate must be >= 0");
    if (!(Cp > 0)) throw new Error("heatCapacity must be > 0");

    const deltaT = Math.abs(T_out - T_in);
    const Q = mdot * Cp * deltaT;

    return {
      result: { value: Q, unit: "W" },
      formula: "Q = ṁ·Cp·|ΔT|",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        { label: "Temperature difference", expression: `|T_out − T_in| = |${T_out} − ${T_in}|`, result: { value: deltaT, unit: "K" } },
        { label: "Heat duty", expression: `Q = ${mdot}·${Cp}·${deltaT}`, result: { value: Q, unit: "W" } },
      ],
      method: "Sensible heat",
      trustTier: "computed",
      flags: [],
    };
  },
};
