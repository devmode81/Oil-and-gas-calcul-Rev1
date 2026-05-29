import type { Calc, CalcInput, CalcResult, Assumption } from "../../core/types";
import { convert } from "../../units/convert";
import { mergeAssumptions } from "../../core/assumptions";

const BASE: Assumption[] = [
  { key: "Cd", label: "Nozzle discharge coefficient", value: { value: 0.95, unit: "" }, source: "Typical drill bit nozzle" },
];

export const bitNozzleVelocity: Calc = {
  id: "bitNozzleVelocity",
  name: "Bit nozzle velocity",
  requiredInputs: [
    { name: "flowrate", exampleUnit: "gpm" },
    { name: "totalFlowArea", exampleUnit: "inch^2" },
    { name: "mudWeight", exampleUnit: "ppg" },
  ],
  run(input: CalcInput): CalcResult {
    const assumptions = mergeAssumptions(BASE, input.assumptionOverrides);
    const Cd = assumptions.find((a) => a.key === "Cd")!.value.value;
    const Q = convert(input.inputs.flowrate.value, input.inputs.flowrate.unit, "m^3/s");
    const TFA = convert(input.inputs.totalFlowArea.value, input.inputs.totalFlowArea.unit, "m^2");
    const rho = convert(input.inputs.mudWeight.value, input.inputs.mudWeight.unit, "kg/m^3");
    if (!(TFA > 0)) throw new Error("totalFlowArea must be > 0");
    if (Q < 0) throw new Error("flowrate must be >= 0");
    if (!(rho > 0)) throw new Error("mudWeight must be > 0");
    const v_n = Q / TFA;
    const dP = rho * Q * Q / (2 * Cd * Cd * TFA * TFA);
    const dP_psi = convert(dP, "Pa", "psi");
    return {
      result: { value: v_n, unit: "m/s" },
      formula: "v_n = Q/TFA ;  ΔP_bit = ρ·Q²/(2·Cd²·TFA²)",
      inputs: input.inputs,
      assumptions,
      steps: [
        { label: "Total flow area", expression: `TFA = ${TFA.toFixed(6)} m²` },
        { label: "Nozzle velocity", expression: `v_n = ${Q.toFixed(6)}/${TFA.toFixed(6)}`, result: { value: v_n, unit: "m/s" } },
        { label: "Bit pressure drop (Pa)", expression: `ΔP = ${rho.toFixed(2)}·${Q.toFixed(6)}²/(2·${Cd}²·${TFA.toFixed(6)}²)`, result: { value: dP, unit: "Pa" } },
        { label: "Bit pressure drop (psi)", expression: `${dP.toFixed(0)} Pa → psi`, result: { value: dP_psi, unit: "psi" } },
      ],
      method: "Nozzle velocity from TFA; bit ΔP from orifice equation",
      trustTier: "computed",
      flags: [],
    };
  },
};
