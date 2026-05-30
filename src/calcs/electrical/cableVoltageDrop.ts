import type { Calc, CalcInput, CalcResult, Assumption } from "../../core/types";
import { convert } from "../../units/convert";
import { mergeAssumptions } from "../../core/assumptions";

const BASE: Assumption[] = [
  { key: "powerFactor", label: "Power factor", value: { value: 0.85, unit: "" }, source: "Typical load assumption" },
];

export const cableVoltageDrop: Calc = {
  id: "cableVoltageDrop",
  name: "Cable voltage drop (3-phase)",
  requiredInputs: [
    { name: "current", exampleUnit: "A" },
    { name: "resistance", exampleUnit: "Ohm/km" },
    { name: "reactance", exampleUnit: "Ohm/km" },
    { name: "length", exampleUnit: "km" },
    { name: "voltage", exampleUnit: "V" },
  ],
  run(input: CalcInput): CalcResult {
    const assumptions = mergeAssumptions(BASE, input.assumptionOverrides);
    const pf = assumptions.find((a) => a.key === "powerFactor")!.value.value;

    const I = convert(input.inputs.current.value, input.inputs.current.unit, "A");
    const V = convert(input.inputs.voltage.value, input.inputs.voltage.unit, "V");
    // resistance and reactance are in Ohm/km — treat as dimensionless per-km values
    const R = input.inputs.resistance.value; // Ω/km
    const X = input.inputs.reactance.value;  // Ω/km
    const L = convert(input.inputs.length.value, input.inputs.length.unit, "km");

    if (!(I > 0)) throw new Error("current must be > 0");
    if (!(R >= 0)) throw new Error("resistance must be >= 0");
    if (!(X >= 0)) throw new Error("reactance must be >= 0");
    if (!(L >= 0)) throw new Error("length must be >= 0");
    if (!(V > 0)) throw new Error("voltage must be > 0");
    if (!(pf > 0 && pf <= 1)) throw new Error("powerFactor must be in (0, 1]");

    const sqrt3 = Math.sqrt(3);
    const sinPhi = Math.sqrt(1 - pf * pf);
    const Vd = sqrt3 * I * (R * pf + X * sinPhi) * L;
    const pctVd = (Vd / V) * 100;

    return {
      result: { value: Vd, unit: "V" },
      formula: "Vd = √3·I·(R·cosφ + X·sinφ)·L",
      inputs: input.inputs,
      assumptions,
      steps: [
        { label: "sinφ", expression: `sinφ = √(1−${pf}²) = ${sinPhi.toFixed(4)}` },
        { label: "Voltage drop", expression: `Vd = √3·${I}·(${R}·${pf}+${X}·${sinPhi.toFixed(4)})·${L}`, result: { value: Vd, unit: "V" } },
        { label: "%Vd", expression: `%Vd = ${Vd.toFixed(2)}/${V}·100`, result: { value: pctVd, unit: "%" } },
      ],
      method: "IEC/IEEE voltage drop",
      reference: "IEC 60364 / IEEE voltage drop",
      trustTier: "validated",
      flags: [],
    };
  },
};
