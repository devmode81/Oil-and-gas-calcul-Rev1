import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";

export const pumpAffinityLaws: Calc = {
  id: "pumpAffinityLaws",
  name: "Pump affinity laws",
  requiredInputs: [
    { name: "speed1", exampleUnit: "rpm" },
    { name: "speed2", exampleUnit: "rpm" },
    { name: "flow1", exampleUnit: "m^3/s" },
    { name: "head1", exampleUnit: "m" },
    { name: "power1", exampleUnit: "W" },
  ],
  run(input: CalcInput): CalcResult {
    // Speed: same unit both sides — only the ratio N2/N1 matters.
    // Accept rpm as raw numeric value (mathjs doesn't support rpm natively).
    const N1 = input.inputs.speed1.value;
    const N2 = input.inputs.speed2.value;
    const Q1 = convert(input.inputs.flow1.value, input.inputs.flow1.unit, "m^3/s");
    const H1 = convert(input.inputs.head1.value, input.inputs.head1.unit, "m");
    const P1 = convert(input.inputs.power1.value, input.inputs.power1.unit, "W");

    if (!(N1 > 0)) throw new Error("speed1 must be > 0");
    if (!(N2 > 0)) throw new Error("speed2 must be > 0");

    const ratio = N2 / N1;
    const Q2 = Q1 * ratio;
    const H2 = H1 * ratio ** 2;
    const P2 = P1 * ratio ** 3;

    return {
      result: { value: P2, unit: "W" },
      formula: "Q₂=Q₁·(N₂/N₁);  H₂=H₁·(N₂/N₁)²;  P₂=P₁·(N₂/N₁)³",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        { label: "Speed ratio", expression: `N₂/N₁ = ${N2}/${N1} = ${ratio}` },
        { label: "Flow2", expression: `Q₂ = ${Q1}·${ratio}`, result: { value: Q2, unit: "m^3/s" } },
        { label: "Head2", expression: `H₂ = ${H1}·${ratio}²`, result: { value: H2, unit: "m" } },
        { label: "Power2", expression: `P₂ = ${P1}·${ratio}³`, result: { value: P2, unit: "W" } },
      ],
      method: "Pump affinity laws",
      trustTier: "computed",
      flags: [],
    };
  },
};
