import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";

const KNOWN_HEADS = ["cylinder", "2:1elliptical"];

export const vesselVolume: Calc = {
  id: "vesselVolume",
  name: "Vessel / tank volume",
  requiredInputs: [
    { name: "diameter", exampleUnit: "m" },
    { name: "length", exampleUnit: "m" },
  ],
  run(input: CalcInput): CalcResult {
    const mode = input.method ?? "cylinder";
    if (!KNOWN_HEADS.includes(mode)) throw new Error(`Unknown head type "${mode}". Known: ${KNOWN_HEADS.join(", ")}`);
    const D = convert(input.inputs.diameter.value, input.inputs.diameter.unit, "m");
    const L = convert(input.inputs.length.value, input.inputs.length.unit, "m");
    if (!(D > 0)) throw new Error("diameter must be > 0");
    if (L < 0) throw new Error("length must be >= 0");

    const vCyl = ((Math.PI * D * D) / 4) * L;
    const vHeads = mode === "2:1elliptical" ? (Math.PI * D * D * D) / 12 : 0;
    const V = vCyl + vHeads;
    const steps = [
      { label: "Cylinder shell", expression: `V_cyl = (π·${D}²/4)·${L}`, result: { value: vCyl, unit: "m^3" } },
    ];
    if (mode === "2:1elliptical")
      steps.push({ label: "Two 2:1 elliptical heads", expression: `V_heads = π·${D}³/12`, result: { value: vHeads, unit: "m^3" } });
    return {
      result: { value: V, unit: "m^3" },
      formula: mode === "2:1elliptical" ? "V = π·D²/4·L + π·D³/12" : "V = π·D²/4·L",
      inputs: input.inputs,
      assumptions: [],
      steps,
      method: mode === "2:1elliptical" ? "Cylinder + 2:1 elliptical heads" : "Plain cylinder",
      alternativeMethods: ["cylinder", "2:1elliptical"],
      trustTier: "computed",
      flags: [],
    };
  },
};
