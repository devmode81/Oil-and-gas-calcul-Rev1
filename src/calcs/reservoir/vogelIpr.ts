import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";

export const vogelIpr: Calc = {
  id: "vogelIpr",
  name: "Vogel IPR (inflow performance relationship)",
  requiredInputs: [
    { name: "reservoirPressure", exampleUnit: "psi" },
    { name: "flowingPressure", exampleUnit: "psi" },
    { name: "maxFlow", exampleUnit: "STB/d" },
  ],
  run(input: CalcInput): CalcResult {
    const Pr = convert(input.inputs.reservoirPressure.value, input.inputs.reservoirPressure.unit, "psi");
    const Pwf = convert(input.inputs.flowingPressure.value, input.inputs.flowingPressure.unit, "psi");
    const qmax = input.inputs.maxFlow.value; // STB/d

    if (!(Pr > 0)) throw new Error("reservoirPressure must be > 0");
    if (!(Pwf >= 0 && Pwf <= Pr)) throw new Error("flowingPressure must be in [0, Pr]");
    if (!(qmax >= 0)) throw new Error("maxFlow must be >= 0");

    // qo = qmax · [1 − 0.2·(Pwf/Pr) − 0.8·(Pwf/Pr)²]
    const ratio = Pwf / Pr;
    const qo = qmax * (1 - 0.2 * ratio - 0.8 * ratio * ratio);

    return {
      result: { value: qo, unit: "STB/d" },
      formula: "qo = qmax·[1 − 0.2(Pwf/Pr) − 0.8(Pwf/Pr)²]",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        {
          label: "Pressure ratio",
          expression: `Pwf/Pr = ${Pwf}/${Pr} = ${ratio.toFixed(4)}`,
          result: { value: ratio, unit: "" },
        },
        {
          label: "Vogel flow rate",
          expression: `qo = ${qmax}·[1 − 0.2·${ratio.toFixed(4)} − 0.8·${ratio.toFixed(4)}²]`,
          result: { value: qo, unit: "STB/d" },
        },
      ],
      method: "Vogel (1968) IPR",
      reference: "Vogel IPR",
      trustTier: "validated",
      flags: [],
    };
  },
};
