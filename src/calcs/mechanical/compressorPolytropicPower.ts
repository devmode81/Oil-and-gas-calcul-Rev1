import type { Calc, CalcInput, CalcResult, Assumption } from "../../core/types";
import { convert } from "../../units/convert";
import { mergeAssumptions } from "../../core/assumptions";

const R = 8314.46; // J/(kmol·K)

const BASE: Assumption[] = [
  { key: "polytropicEfficiency", label: "Polytropic efficiency", value: { value: 0.78, unit: "" }, source: "Typical centrifugal compressor" },
];

export const compressorPolytropicPower: Calc = {
  id: "compressorPolytropicPower",
  name: "Compressor polytropic power",
  requiredInputs: [
    { name: "massFlowrate", exampleUnit: "kg/s" },
    { name: "inletTemp", exampleUnit: "K" },
    { name: "inletPressure", exampleUnit: "Pa" },
    { name: "outletPressure", exampleUnit: "Pa" },
    { name: "zFactor", exampleUnit: "" },
    { name: "molarMass", exampleUnit: "g/mol" },
    { name: "polytropicIndex", exampleUnit: "" },
  ],
  run(input: CalcInput): CalcResult {
    const assumptions = mergeAssumptions(BASE, input.assumptionOverrides);
    const eta_p = assumptions.find((a) => a.key === "polytropicEfficiency")!.value.value;

    const mdot = convert(input.inputs.massFlowrate.value, input.inputs.massFlowrate.unit, "kg/s");
    // Absolute temperature — convert to K
    const T1 = convert(input.inputs.inletTemp.value, input.inputs.inletTemp.unit, "K");
    const P1 = convert(input.inputs.inletPressure.value, input.inputs.inletPressure.unit, "Pa");
    const P2 = convert(input.inputs.outletPressure.value, input.inputs.outletPressure.unit, "Pa");
    const Z = input.inputs.zFactor.value;
    // g/mol === kg/kmol numerically — use as kg/kmol for R in J/(kmol·K)
    const MW = input.inputs.molarMass.value; // g/mol = kg/kmol
    const n = input.inputs.polytropicIndex.value;

    if (!(T1 > 0)) throw new Error("inletTemp must be > 0 K");
    if (!(P1 > 0)) throw new Error("inletPressure must be > 0");
    if (!(P2 > P1)) throw new Error("outletPressure must be > inletPressure");
    if (!(mdot >= 0)) throw new Error("massFlowrate must be >= 0");
    if (!(eta_p > 0)) throw new Error("polytropicEfficiency must be > 0");
    if (!(n > 1)) throw new Error("polytropicIndex must be > 1");
    if (!(MW > 0)) throw new Error("molarMass must be > 0");

    // Polytropic head (J/kg): H_p = Z·R·T1/(MW·(n/(n-1)))·[(P2/P1)^((n-1)/n) - 1]
    const exp = (n - 1) / n;
    const H_p = (Z * R * T1) / (MW * (n / (n - 1))) * (Math.pow(P2 / P1, exp) - 1);
    const P_shaft = (mdot * H_p) / eta_p;

    return {
      result: { value: P_shaft, unit: "W" },
      formula: "H_p = Z·R·T₁/(MW·(n/(n−1)))·[(P₂/P₁)^((n−1)/n)−1];  P = ṁ·H_p/η_p",
      inputs: input.inputs,
      assumptions,
      steps: [
        { label: "Polytropic exponent", expression: `(n−1)/n = (${n}−1)/${n} = ${exp}` },
        { label: "Pressure ratio", expression: `P₂/P₁ = ${P2}/${P1} = ${P2 / P1}` },
        { label: "Polytropic head", expression: `H_p = ${Z}·${R}·${T1}/(${MW}·${n / (n - 1)})·(${Math.pow(P2 / P1, exp)}−1)`, result: { value: H_p, unit: "J/kg" } },
        { label: "Shaft power", expression: `P = ${mdot}·${H_p}/${eta_p}`, result: { value: P_shaft, unit: "W" } },
      ],
      method: "GPSA polytropic compression",
      reference: "GPSA Engineering Data Book §13; ASME PTC-10",
      trustTier: "validated",
      flags: [],
    };
  },
};
