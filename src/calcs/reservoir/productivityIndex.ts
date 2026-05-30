import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";

export const productivityIndex: Calc = {
  id: "productivityIndex",
  name: "Productivity index (J)",
  requiredInputs: [
    { name: "flowrate", exampleUnit: "STB/d" },
    { name: "reservoirPressure", exampleUnit: "psi" },
    { name: "flowingPressure", exampleUnit: "psi" },
  ],
  run(input: CalcInput): CalcResult {
    const q = input.inputs.flowrate.value; // STB/d
    const Pr = convert(input.inputs.reservoirPressure.value, input.inputs.reservoirPressure.unit, "psi");
    const Pwf = convert(input.inputs.flowingPressure.value, input.inputs.flowingPressure.unit, "psi");

    if (!(Pr > Pwf)) throw new Error("reservoirPressure must be > flowingPressure");

    // J = q / (Pr − Pwf)   [STB/d/psi]
    const drawdown = Pr - Pwf;
    const J = q / drawdown;

    return {
      result: { value: J, unit: "STB/d/psi" },
      formula: "J = q / (Pr − Pwf)",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        {
          label: "Pressure drawdown",
          expression: `ΔP = ${Pr} − ${Pwf} = ${drawdown.toFixed(2)} psi`,
          result: { value: drawdown, unit: "psi" },
        },
        {
          label: "Productivity index",
          expression: `J = ${q} / ${drawdown.toFixed(2)}`,
          result: { value: J, unit: "STB/d/psi" },
        },
      ],
      method: "Productivity index",
      trustTier: "computed",
      flags: [],
    };
  },
};
