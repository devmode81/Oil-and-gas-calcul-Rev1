import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";

export const cylinderVolume: Calc = {
  id: "cylinderVolume",
  name: "Cylinder volume",
  requiredInputs: [
    { name: "radius", exampleUnit: "m" },
    { name: "length", exampleUnit: "m" },
  ],
  run(input: CalcInput): CalcResult {
    const r = convert(input.inputs.radius.value, input.inputs.radius.unit, "m");
    const L = convert(input.inputs.length.value, input.inputs.length.unit, "m");
    const V = Math.PI * r * r * L;
    return {
      result: { value: V, unit: "m^3" },
      formula: "V = π·r²·L",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        { label: "Convert inputs to SI", expression: `r = ${r} m, L = ${L} m` },
        { label: "Apply formula", expression: `V = π·(${r} m)²·(${L} m)`, result: { value: V, unit: "m^3" } },
      ],
      method: "Right-circular cylinder",
      trustTier: "computed",
      flags: [],
    };
  },
};
