import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";

/** Convert a temperature-difference quantity to K (= °C difference). */
function convertDeltaTemp(value: number, unit: string): number {
  switch (unit) {
    case "degC":
    case "K":
      return value;
    case "degF":
    case "rankine":
      return value * (5 / 9);
    default:
      throw new Error(`Unsupported temperature-difference unit "${unit}". Use K, degC, or degF.`);
  }
}

export const insulationHeatLoss: Calc = {
  id: "insulationHeatLoss",
  name: "Cylindrical insulation heat loss",
  requiredInputs: [
    { name: "pipeOuterRadius", exampleUnit: "m" },
    { name: "insulationOuterRadius", exampleUnit: "m" },
    { name: "length", exampleUnit: "m" },
    { name: "conductivity", exampleUnit: "W/(m K)" },
    { name: "deltaTemp", exampleUnit: "K" },
  ],
  run(input: CalcInput): CalcResult {
    const r1 = convert(input.inputs.pipeOuterRadius.value, input.inputs.pipeOuterRadius.unit, "m");
    const r2 = convert(input.inputs.insulationOuterRadius.value, input.inputs.insulationOuterRadius.unit, "m");
    const L = convert(input.inputs.length.value, input.inputs.length.unit, "m");
    // conductivity: treat as W/(m·K) — no cross-unit conversion needed
    const k = input.inputs.conductivity.value;
    const dT = convertDeltaTemp(input.inputs.deltaTemp.value, input.inputs.deltaTemp.unit);

    if (!(r1 > 0)) throw new Error("pipeOuterRadius must be > 0");
    if (!(r2 > r1)) throw new Error("insulationOuterRadius must be > pipeOuterRadius");
    if (!(L > 0)) throw new Error("length must be > 0");
    if (!(k > 0)) throw new Error("conductivity must be > 0");

    // Series cylindrical resistance: R = ln(r2/r1) / (2π·k·L)
    const R = Math.log(r2 / r1) / (2 * Math.PI * k * L);
    const q = dT / R;

    return {
      result: { value: q, unit: "W" },
      formula: "R = ln(r2/r1)/(2π·k·L);  q = ΔT/R",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        { label: "Normalise to SI", expression: `r1=${r1} m, r2=${r2} m, L=${L} m, k=${k} W/(m·K), ΔT=${dT} K` },
        { label: "Thermal resistance", expression: `R = ln(${r2}/${r1})/(2π·${k}·${L})`, result: { value: R, unit: "K/W" } },
        { label: "Heat loss", expression: `q = ${dT}/${R}`, result: { value: q, unit: "W" } },
      ],
      method: "Cylindrical thermal resistance",
      trustTier: "computed",
      flags: [],
    };
  },
};
