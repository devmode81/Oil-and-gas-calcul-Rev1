import type { Calc, CalcInput, CalcResult, Assumption } from "../../core/types";
import { convert } from "../../units/convert";
import { mergeAssumptions } from "../../core/assumptions";

const BASE: Assumption[] = [
  { key: "cylinders", label: "Number of cylinders", value: { value: 3, unit: "" }, source: "Triplex pump (default)" },
  { key: "volumetricEfficiency", label: "Volumetric efficiency", value: { value: 1.0, unit: "" }, source: "Assumed 100%" },
];

// 1 US oil barrel = 0.158987294928 m³
const BBL_PER_M3 = 1 / 0.158987294928;

export const pumpOutput: Calc = {
  id: "pumpOutput",
  name: "Pump output (triplex/duplex)",
  requiredInputs: [
    { name: "linerDiameter", exampleUnit: "inch" },
    { name: "strokeLength", exampleUnit: "inch" },
  ],
  run(input: CalcInput): CalcResult {
    const assumptions = mergeAssumptions(BASE, input.assumptionOverrides);
    const n_cyl = assumptions.find((a) => a.key === "cylinders")!.value.value;
    const eta = assumptions.find((a) => a.key === "volumetricEfficiency")!.value.value;
    const D = convert(input.inputs.linerDiameter.value, input.inputs.linerDiameter.unit, "m");
    const L = convert(input.inputs.strokeLength.value, input.inputs.strokeLength.unit, "m");
    if (!(D > 0)) throw new Error("linerDiameter must be > 0");
    if (!(L >= 0)) throw new Error("strokeLength must be >= 0");
    const V_m3 = n_cyl * (Math.PI / 4) * D * D * L * eta;
    const V_bbl = V_m3 * BBL_PER_M3;
    return {
      result: { value: V_bbl, unit: "bbl/stroke" },
      formula: "V_stroke = n_cyl·(π/4·D_liner²·strokeLength)·η_vol",
      inputs: input.inputs,
      assumptions,
      steps: [
        { label: "Liner diameter", expression: `D = ${D.toFixed(4)} m` },
        { label: "Stroke length", expression: `L = ${L.toFixed(4)} m` },
        { label: "Volume per stroke (m³)", expression: `V = ${n_cyl}·(π/4)·${D.toFixed(4)}²·${L.toFixed(4)}·${eta}`, result: { value: V_m3, unit: "m^3/stroke" } },
        { label: "Volume per stroke (bbl)", expression: `${V_m3.toFixed(6)} m³ → bbl`, result: { value: V_bbl, unit: "bbl/stroke" } },
      ],
      method: "Positive displacement pump geometry",
      trustTier: "computed",
      flags: [],
    };
  },
};
