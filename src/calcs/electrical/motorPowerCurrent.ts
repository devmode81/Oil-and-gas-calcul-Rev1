import type { Calc, CalcInput, CalcResult, Assumption } from "../../core/types";
import { convert } from "../../units/convert";
import { mergeAssumptions } from "../../core/assumptions";

const BASE: Assumption[] = [
  { key: "powerFactor", label: "Power factor", value: { value: 0.85, unit: "" }, source: "Typical induction motor" },
  { key: "efficiency", label: "Motor efficiency", value: { value: 0.92, unit: "" }, source: "Typical induction motor" },
];

export const motorPowerCurrent: Calc = {
  id: "motorPowerCurrent",
  name: "3-Phase motor power & current",
  requiredInputs: [
    { name: "voltage", exampleUnit: "V" },
    { name: "current", exampleUnit: "A" },
  ],
  run(input: CalcInput): CalcResult {
    const assumptions = mergeAssumptions(BASE, input.assumptionOverrides);
    const pf = assumptions.find((a) => a.key === "powerFactor")!.value.value;
    const eta = assumptions.find((a) => a.key === "efficiency")!.value.value;
    const sqrt3 = Math.sqrt(3);

    if (!(pf > 0 && pf <= 1)) throw new Error("powerFactor must be in (0, 1]");
    if (!(eta > 0 && eta <= 1)) throw new Error("efficiency must be in (0, 1]");

    const V = convert(input.inputs.voltage.value, input.inputs.voltage.unit, "V");
    if (!(V > 0)) throw new Error("voltage must be > 0");

    const method = input.method ?? "power";

    if (method === "current") {
      // Given activePower, compute current
      const P = convert(input.inputs.activePower.value, input.inputs.activePower.unit, "W");
      if (!(P > 0)) throw new Error("activePower must be > 0");
      const I = P / (sqrt3 * V * pf * eta);
      return {
        result: { value: I, unit: "A" },
        formula: "I = P / (√3·V·pf·η)",
        inputs: input.inputs,
        assumptions,
        steps: [
          { label: "Active power", expression: `P = ${P} W` },
          { label: "Full-load current", expression: `I = ${P}/(√3·${V}·${pf}·${eta})`, result: { value: I, unit: "A" } },
        ],
        method: "3-phase current from power",
        trustTier: "computed",
        flags: [],
      };
    }

    // Default "power" mode: given current, compute P
    const I = convert(input.inputs.current.value, input.inputs.current.unit, "A");
    if (!(I > 0)) throw new Error("current must be > 0");
    const P = sqrt3 * V * I * pf * eta;
    return {
      result: { value: P, unit: "W" },
      formula: "P = √3·V·I·pf·η",
      inputs: input.inputs,
      assumptions,
      steps: [
        { label: "3-phase motor power", expression: `P = √3·${V}·${I}·${pf}·${eta}`, result: { value: P, unit: "W" } },
        { label: "Power (kW)", expression: `P = ${P}/1000`, result: { value: P / 1000, unit: "kW" } },
      ],
      method: "3-phase power from current",
      trustTier: "computed",
      flags: [],
    };
  },
};
