import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";

export const powerFactorCorrection: Calc = {
  id: "powerFactorCorrection",
  name: "Power factor correction (capacitor bank)",
  requiredInputs: [
    { name: "activePower", exampleUnit: "W" },
    { name: "currentPowerFactor", exampleUnit: "" },
    { name: "targetPowerFactor", exampleUnit: "" },
  ],
  run(input: CalcInput): CalcResult {
    const P = convert(input.inputs.activePower.value, input.inputs.activePower.unit, "W");
    const pf1 = input.inputs.currentPowerFactor.value;
    const pf2 = input.inputs.targetPowerFactor.value;

    if (!(P >= 0)) throw new Error("activePower must be >= 0");
    if (!(pf1 > 0 && pf1 < 1)) throw new Error("currentPowerFactor must be in (0, 1)");
    if (!(pf2 > 0 && pf2 <= 1)) throw new Error("targetPowerFactor must be in (0, 1]");
    if (!(pf1 < pf2)) throw new Error("targetPowerFactor must be greater than currentPowerFactor");

    const tanPhi1 = Math.sqrt(1 - pf1 * pf1) / pf1;
    const tanPhi2 = Math.sqrt(1 - pf2 * pf2) / pf2;
    const Qc = P * (tanPhi1 - tanPhi2);

    return {
      result: { value: Qc, unit: "VAR" },
      formula: "Q_c = P·(tanφ₁ − tanφ₂)",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        { label: "tanφ₁", expression: `tanφ₁ = √(1−${pf1}²)/${pf1} = ${tanPhi1.toFixed(4)}` },
        { label: "tanφ₂", expression: `tanφ₂ = √(1−${pf2}²)/${pf2} = ${tanPhi2.toFixed(4)}` },
        { label: "Required kVAR", expression: `Q_c = ${P}·(${tanPhi1.toFixed(4)}−${tanPhi2.toFixed(4)})`, result: { value: Qc, unit: "VAR" } },
      ],
      method: "Capacitor bank sizing",
      trustTier: "computed",
      flags: [],
    };
  },
};
