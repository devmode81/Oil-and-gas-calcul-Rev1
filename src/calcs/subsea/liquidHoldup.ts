import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";

export const liquidHoldup: Calc = {
  id: "liquidHoldup",
  name: "No-slip liquid holdup & superficial velocities",
  requiredInputs: [
    { name: "liquidFlowrate", exampleUnit: "m^3/s" },
    { name: "gasFlowrate", exampleUnit: "m^3/s" },
    { name: "diameter", exampleUnit: "m" },
  ],
  run(input: CalcInput): CalcResult {
    const Q_L = convert(input.inputs.liquidFlowrate.value, input.inputs.liquidFlowrate.unit, "m^3/s");
    const Q_G = convert(input.inputs.gasFlowrate.value, input.inputs.gasFlowrate.unit, "m^3/s");
    const D = convert(input.inputs.diameter.value, input.inputs.diameter.unit, "m");

    if (!(D > 0)) throw new Error("diameter must be > 0");
    if (Q_L < 0) throw new Error("liquidFlowrate must be >= 0");
    if (Q_G < 0) throw new Error("gasFlowrate must be >= 0");
    if (!(Q_L + Q_G > 0)) throw new Error("total flowrate (Q_L + Q_G) must be > 0");

    const A = (Math.PI * D * D) / 4;
    const Q_total = Q_L + Q_G;
    const lambda = Q_L / Q_total;
    const v_sL = Q_L / A;
    const v_sG = Q_G / A;
    const v_m = v_sL + v_sG;

    return {
      result: { value: lambda, unit: "" },
      formula: "λ_L = Q_L/(Q_L+Q_G);  v_m = v_sL + v_sG = (Q_L+Q_G)/A",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        { label: "Cross-sectional area", expression: `A = π·(${D})²/4`, result: { value: A, unit: "m^2" } },
        { label: "No-slip liquid holdup", expression: `λ = ${Q_L}/(${Q_L}+${Q_G})`, result: { value: lambda, unit: "" } },
        { label: "Superficial liquid velocity", expression: `v_sL = ${Q_L}/${A}`, result: { value: v_sL, unit: "m/s" } },
        { label: "Superficial gas velocity", expression: `v_sG = ${Q_G}/${A}`, result: { value: v_sG, unit: "m/s" } },
        { label: "Mixture velocity", expression: `v_m = ${v_sL} + ${v_sG}`, result: { value: v_m, unit: "m/s" } },
      ],
      method: "No-slip homogeneous",
      trustTier: "computed",
      flags: [],
    };
  },
};
