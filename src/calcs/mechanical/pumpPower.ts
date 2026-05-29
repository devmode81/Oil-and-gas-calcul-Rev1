import type { Calc, CalcInput, CalcResult, Assumption } from "../../core/types";
import { convert } from "../../units/convert";
import { mergeAssumptions } from "../../core/assumptions";

const BASE: Assumption[] = [
  { key: "g", label: "Gravitational acceleration", value: { value: 9.80665, unit: "m/s^2" }, source: "Standard gravity" },
  { key: "efficiency", label: "Pump efficiency", value: { value: 0.7, unit: "" }, source: "Typical centrifugal pump" },
];

export const pumpPower: Calc = {
  id: "pumpPower",
  name: "Pump power & head",
  requiredInputs: [
    { name: "flowrate", exampleUnit: "m^3/s" },
    { name: "head", exampleUnit: "m" },
    { name: "density", exampleUnit: "kg/m^3" },
  ],
  run(input: CalcInput): CalcResult {
    const assumptions = mergeAssumptions(BASE, input.assumptionOverrides);
    const g = assumptions.find((a) => a.key === "g")!.value.value;
    const eta = assumptions.find((a) => a.key === "efficiency")!.value.value;
    const Q = convert(input.inputs.flowrate.value, input.inputs.flowrate.unit, "m^3/s");
    const rho = convert(input.inputs.density.value, input.inputs.density.unit, "kg/m^3");
    if (!(rho > 0)) throw new Error("density must be > 0");
    if (Q < 0) throw new Error("flowrate must be >= 0");
    if (!(eta > 0 && eta <= 1)) throw new Error("efficiency must be in (0, 1]");

    let H: number;
    if (input.inputs.head) {
      H = convert(input.inputs.head.value, input.inputs.head.unit, "m");
    } else if (input.inputs.differentialPressure) {
      const dP = convert(input.inputs.differentialPressure.value, input.inputs.differentialPressure.unit, "Pa");
      H = dP / (rho * g);
    } else {
      throw new Error("provide either head or differentialPressure");
    }

    const Phyd = rho * g * Q * H;
    const Pbrake = Phyd / eta;
    return {
      result: { value: Phyd, unit: "W" },
      formula: "P_hyd = ρ·g·Q·H ;  P_brake = P_hyd/η",
      inputs: input.inputs,
      assumptions,
      steps: [
        { label: "Head", expression: `H = ${H} m` },
        { label: "Hydraulic power", expression: `P_hyd = ${rho}·${g}·${Q}·${H}`, result: { value: Phyd, unit: "W" } },
        { label: "Brake power", expression: `P_brake = P_hyd/${eta}`, result: { value: Pbrake, unit: "W" } },
      ],
      method: "Hydraulic power",
      trustTier: "computed",
      flags: [],
    };
  },
};
