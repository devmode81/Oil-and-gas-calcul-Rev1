import type { Calc, CalcInput, CalcResult, Assumption } from "../../core/types";
import { convert } from "../../units/convert";
import { mergeAssumptions } from "../../core/assumptions";

const BASE: Assumption[] = [
  { key: "g", label: "Gravitational acceleration", value: { value: 9.80665, unit: "m/s^2" }, source: "Standard gravity" },
];

export const npshAvailable: Calc = {
  id: "npshAvailable",
  name: "NPSH available",
  requiredInputs: [
    { name: "suctionPressure", exampleUnit: "Pa" },
    { name: "vaporPressure", exampleUnit: "Pa" },
    { name: "density", exampleUnit: "kg/m^3" },
    { name: "staticHead", exampleUnit: "m" },
    { name: "frictionLoss", exampleUnit: "m" },
  ],
  run(input: CalcInput): CalcResult {
    const assumptions = mergeAssumptions(BASE, input.assumptionOverrides);
    const g = assumptions.find((a) => a.key === "g")!.value.value;
    const Ps = convert(input.inputs.suctionPressure.value, input.inputs.suctionPressure.unit, "Pa");
    const Pv = convert(input.inputs.vaporPressure.value, input.inputs.vaporPressure.unit, "Pa");
    const rho = convert(input.inputs.density.value, input.inputs.density.unit, "kg/m^3");
    const zs = convert(input.inputs.staticHead.value, input.inputs.staticHead.unit, "m");
    const hf = convert(input.inputs.frictionLoss.value, input.inputs.frictionLoss.unit, "m");
    if (!(rho > 0)) throw new Error("density must be > 0");
    const npsha = (Ps - Pv) / (rho * g) + zs - hf;
    return {
      result: { value: npsha, unit: "m" },
      formula: "NPSHa = (P_s − P_v)/(ρ·g) + z_s − h_f",
      inputs: input.inputs,
      assumptions,
      steps: [
        { label: "Pressure head", expression: `(${Ps} − ${Pv})/(${rho}·${g})`, result: { value: (Ps - Pv) / (rho * g), unit: "m" } },
        { label: "Add static head, subtract friction", expression: `+ ${zs} − ${hf}`, result: { value: npsha, unit: "m" } },
      ],
      method: "NPSH available",
      trustTier: "computed",
      flags: [],
    };
  },
};
