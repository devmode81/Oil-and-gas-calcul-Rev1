import type { Calc, CalcInput, CalcResult, Assumption } from "../../core/types";
import { convert } from "../../units/convert";
import { mergeAssumptions } from "../../core/assumptions";

const BASE: Assumption[] = [
  { key: "K", label: "Souders-Brown coefficient", value: { value: 0.107, unit: "m/s" }, source: "GPSA typical vertical separator (≈0.35 ft/s)" },
];

export const separatorSizing: Calc = {
  id: "separatorSizing",
  name: "Gas-liquid separator sizing",
  requiredInputs: [
    { name: "liquidDensity", exampleUnit: "kg/m^3" },
    { name: "gasDensity", exampleUnit: "kg/m^3" },
    { name: "gasFlowrate", exampleUnit: "m^3/s" },
  ],
  run(input: CalcInput): CalcResult {
    const assumptions = mergeAssumptions(BASE, input.assumptionOverrides);
    const K = assumptions.find((a) => a.key === "K")!.value.value;
    const rhoL = convert(input.inputs.liquidDensity.value, input.inputs.liquidDensity.unit, "kg/m^3");
    const rhoG = convert(input.inputs.gasDensity.value, input.inputs.gasDensity.unit, "kg/m^3");
    const Qg = convert(input.inputs.gasFlowrate.value, input.inputs.gasFlowrate.unit, "m^3/s");
    if (!(rhoG > 0)) throw new Error("gas density must be > 0");
    if (!(rhoL > rhoG)) throw new Error("liquid density must exceed gas density");
    if (Qg < 0) throw new Error("gas flowrate must be >= 0");

    const vMax = K * Math.sqrt((rhoL - rhoG) / rhoG);
    const A = Qg / vMax;
    const D = Math.sqrt((4 * A) / Math.PI);
    return {
      result: { value: D, unit: "m" },
      formula: "v_max = K·√((ρ_L−ρ_g)/ρ_g) ;  A = Q_g/v_max ;  D = √(4A/π)",
      inputs: input.inputs,
      assumptions,
      steps: [
        { label: "Max vapour velocity", expression: `v_max = ${K}·√((${rhoL}−${rhoG})/${rhoG})`, result: { value: vMax, unit: "m/s" } },
        { label: "Required gas area", expression: `A = ${Qg}/${vMax}`, result: { value: A, unit: "m^2" } },
        { label: "Minimum vessel ID", expression: `D = √(4·${A}/π)`, result: { value: D, unit: "m" } },
      ],
      method: "Souders-Brown",
      reference: "Souders-Brown / GPSA Engineering Data Book (separator sizing)",
      trustTier: "validated",
      flags: [],
    };
  },
};
