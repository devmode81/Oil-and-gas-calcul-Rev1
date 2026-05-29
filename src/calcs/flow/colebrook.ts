import type { Calc, CalcInput, CalcResult } from "../../core/types";

export const colebrookFrictionFactor: Calc = {
  id: "colebrookFrictionFactor",
  name: "Darcy friction factor (Colebrook)",
  requiredInputs: [
    { name: "reynolds", exampleUnit: "" },
    { name: "relativeRoughness", exampleUnit: "" },
  ],
  run(input: CalcInput): CalcResult {
    const Re = input.inputs.reynolds.value;
    const epsD = input.inputs.relativeRoughness.value;
    if (!(Re > 0)) throw new Error("Reynolds number must be > 0");
    if (epsD < 0) throw new Error("relative roughness must be >= 0");

    if (Re < 2300) {
      const f = 64 / Re;
      return {
        result: { value: f, unit: "" },
        formula: "f = 64/Re (laminar)",
        inputs: input.inputs,
        assumptions: [],
        steps: [{ label: "Laminar regime", expression: `f = 64/${Re}`, result: { value: f, unit: "" } }],
        method: "Laminar (Re < 2300)",
        trustTier: "computed",
        flags: [],
      };
    }

    // Swamee-Jain explicit estimate as the seed.
    let f = 0.25 / Math.pow(Math.log10(epsD / 3.7 + 5.74 / Math.pow(Re, 0.9)), 2);
    // Fixed-point iteration of the implicit Colebrook equation.
    for (let i = 0; i < 50; i++) {
      const rhs = -2 * Math.log10(epsD / 3.7 + 2.51 / (Re * Math.sqrt(f)));
      const fNew = 1 / (rhs * rhs);
      if (Math.abs(fNew - f) < 1e-8) {
        f = fNew;
        break;
      }
      f = fNew;
    }
    return {
      result: { value: f, unit: "" },
      formula: "1/√f = −2·log₁₀( ε/(3.7·D) + 2.51/(Re·√f) )",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        { label: "Seed (Swamee-Jain)", expression: "f₀ = 0.25 / [log₁₀(ε/3.7D + 5.74/Re^0.9)]²" },
        { label: "Iterate Colebrook to |Δf| < 1e-8", expression: "f", result: { value: f, unit: "" } },
      ],
      method: "Colebrook-White (iterative)",
      trustTier: "computed",
      flags: [],
    };
  },
};
