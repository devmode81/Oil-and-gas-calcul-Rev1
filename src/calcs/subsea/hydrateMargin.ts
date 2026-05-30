import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";

// Katz hydrate temperature correlation constants for 0.6 SG gas
// T_hyd(°F) = A + B·ln(P_psia) + C·(ln(P_psia))²
const A = 12.739;
const B = 5.613;
const C = -0.1886;

export const hydrateMargin: Calc = {
  id: "hydrateMargin",
  name: "Hydrate sub-cooling margin (Katz correlation)",
  requiredInputs: [
    { name: "pressure", exampleUnit: "psi" },
    { name: "gasFlowingTemp", exampleUnit: "degC" },
  ],
  run(input: CalcInput): CalcResult {
    // Convert pressure to Pa then to psi (absolute ≡ psi for this correlation)
    const P_Pa = convert(input.inputs.pressure.value, input.inputs.pressure.unit, "Pa");
    const P_psia = P_Pa / 6894.757; // 1 psi = 6894.757 Pa

    if (!(P_psia > 0)) throw new Error("pressure must be > 0");

    // Convert flowing temperature to °C
    const T_flow_C = convert(input.inputs.gasFlowingTemp.value, input.inputs.gasFlowingTemp.unit, "degC");

    const lnP = Math.log(P_psia);
    const T_hyd_F = A + B * lnP + C * lnP * lnP;
    const T_hyd_C = (T_hyd_F - 32) / 1.8;

    // margin = T_hyd - T_flowing; positive = hydrate risk zone, negative = safe
    const margin = T_hyd_C - T_flow_C;

    return {
      result: { value: margin, unit: "degC" },
      formula: "T_hyd(°F) = A + B·ln(P_psia) + C·[ln(P_psia)]²;  margin = T_hyd − T_flowing",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        { label: "Pressure in psia", expression: `P = ${P_psia.toFixed(3)} psia` },
        { label: "Katz hydrate temperature", expression: `T_hyd = ${A} + ${B}·ln(${P_psia.toFixed(3)}) + (${C})·[ln(${P_psia.toFixed(3)})]²`, result: { value: T_hyd_F, unit: "degF" } },
        { label: "T_hyd in °C", expression: `T_hyd = (${T_hyd_F.toFixed(4)} − 32)/1.8`, result: { value: T_hyd_C, unit: "degC" } },
        { label: "Sub-cooling margin", expression: `margin = ${T_hyd_C.toFixed(4)} − ${T_flow_C}`, result: { value: margin, unit: "degC" } },
      ],
      method: "Katz hydrate correlation (gas SG≈0.6)",
      trustTier: "validated",
      reference: "Katz hydrate correlation (gas SG≈0.6)",
      flags: margin > 0 ? [{ severity: "warn", message: "Fluid is in hydrate formation zone; inhibitor or heat required." }] : [],
    };
  },
};
