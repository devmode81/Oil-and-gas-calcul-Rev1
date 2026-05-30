import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";

export const lmtd: Calc = {
  id: "lmtd",
  name: "Log Mean Temperature Difference (LMTD, counterflow)",
  requiredInputs: [
    { name: "hotIn", exampleUnit: "degC" },
    { name: "hotOut", exampleUnit: "degC" },
    { name: "coldIn", exampleUnit: "degC" },
    { name: "coldOut", exampleUnit: "degC" },
  ],
  run(input: CalcInput): CalcResult {
    // Convert to K for arithmetic differences (avoids offset issues)
    const hotIn = convert(input.inputs.hotIn.value, input.inputs.hotIn.unit, "K");
    const hotOut = convert(input.inputs.hotOut.value, input.inputs.hotOut.unit, "K");
    const coldIn = convert(input.inputs.coldIn.value, input.inputs.coldIn.unit, "K");
    const coldOut = convert(input.inputs.coldOut.value, input.inputs.coldOut.unit, "K");

    // Counterflow: ΔT1 = hot_in − cold_out; ΔT2 = hot_out − cold_in
    const dT1 = hotIn - coldOut;
    const dT2 = hotOut - coldIn;

    let lmtdVal: number;
    if (Math.abs(dT1 - dT2) < 1e-10) {
      lmtdVal = dT1;
    } else {
      lmtdVal = (dT1 - dT2) / Math.log(dT1 / dT2);
    }

    return {
      result: { value: lmtdVal, unit: "K" },
      formula: "LMTD = (ΔT₁−ΔT₂)/ln(ΔT₁/ΔT₂);  ΔT₁=T_hot,in−T_cold,out;  ΔT₂=T_hot,out−T_cold,in",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        { label: "ΔT₁ (hot in − cold out)", expression: `${hotIn} − ${coldOut}`, result: { value: dT1, unit: "K" } },
        { label: "ΔT₂ (hot out − cold in)", expression: `${hotOut} − ${coldIn}`, result: { value: dT2, unit: "K" } },
        { label: "LMTD", expression: Math.abs(dT1 - dT2) < 1e-10 ? `Equal ΔT → LMTD = ${dT1}` : `(${dT1}−${dT2})/ln(${dT1}/${dT2})`, result: { value: lmtdVal, unit: "K" } },
      ],
      method: "Counterflow LMTD",
      trustTier: "computed",
      flags: [],
    };
  },
};
