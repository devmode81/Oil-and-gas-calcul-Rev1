import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";

const SUPPORTED = ["Darcy-Weisbach", "Hazen-Williams"];

export const pressureDrop: Calc = {
  id: "pressureDrop",
  name: "Pipe pressure drop",
  requiredInputs: [
    { name: "frictionFactor", exampleUnit: "" },
    { name: "length", exampleUnit: "m" },
    { name: "diameter", exampleUnit: "m" },
    { name: "density", exampleUnit: "kg/m^3" },
    { name: "velocity", exampleUnit: "m/s" },
  ],
  run(input: CalcInput): CalcResult {
    const method = input.method ?? "Darcy-Weisbach";
    if (!SUPPORTED.includes(method)) {
      throw new Error(`Unsupported method "${method}". Supported: ${SUPPORTED.join(", ")}`);
    }
    if (method !== "Darcy-Weisbach") {
      // Hazen-Williams requires a C-factor input set; not part of this slice.
      throw new Error(`Method "${method}" not implemented in this build.`);
    }
    const f = input.inputs.frictionFactor.value;
    const L = convert(input.inputs.length.value, input.inputs.length.unit, "m");
    const D = convert(input.inputs.diameter.value, input.inputs.diameter.unit, "m");
    const rho = convert(input.inputs.density.value, input.inputs.density.unit, "kg/m^3");
    const v = convert(input.inputs.velocity.value, input.inputs.velocity.unit, "m/s");
    const dP = f * (L / D) * ((rho * v * v) / 2);
    return {
      result: { value: dP, unit: "Pa" },
      formula: "ΔP = f·(L/D)·(ρ·v²/2)",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        { label: "Normalise to SI", expression: `f=${f}, L=${L} m, D=${D} m, ρ=${rho} kg/m³, v=${v} m/s` },
        { label: "Apply formula", expression: `ΔP = ${f}·(${L}/${D})·(${rho}·${v}²/2)`, result: { value: dP, unit: "Pa" } },
      ],
      method: "Darcy-Weisbach",
      alternativeMethods: ["Hazen-Williams"],
      trustTier: "computed",
      flags: [],
    };
  },
};
