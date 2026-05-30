import type { Calc, CalcInput, CalcResult } from "../../core/types";

// Hammerschmidt equation: W = 100·ΔT·M / (K_h + ΔT·M)
// K_h: inhibitor constant; M: molar mass
const INHIBITORS: Record<string, { Kh: number; M: number; label: string }> = {
  MeOH: { Kh: 2335, M: 32.04, label: "Methanol (MeOH)" },
  MEG: { Kh: 2000, M: 62.07, label: "Monoethylene glycol (MEG)" },
};

/** Convert a temperature-difference quantity to °C-equivalent (delta). */
function convertDeltaTemp(value: number, unit: string): number {
  switch (unit) {
    case "degC":
    case "K":
      return value;
    case "degF":
    case "rankine":
      return value * (5 / 9);
    default:
      throw new Error(`Unsupported temperature-difference unit "${unit}". Use degC, K, or degF.`);
  }
}

export const hammerschmidtInhibitorDose: Calc = {
  id: "hammerschmidtInhibitorDose",
  name: "Hammerschmidt inhibitor dose (%wt)",
  requiredInputs: [
    { name: "subCoolingRequired", exampleUnit: "degC" },
  ],
  run(input: CalcInput): CalcResult {
    const method = input.method ?? "MeOH";
    if (!Object.keys(INHIBITORS).includes(method)) {
      throw new Error(`Unknown inhibitor type "${method}". Supported: ${Object.keys(INHIBITORS).join(", ")}`);
    }
    const { Kh, M, label } = INHIBITORS[method];

    const dT = convertDeltaTemp(
      input.inputs.subCoolingRequired.value,
      input.inputs.subCoolingRequired.unit,
    );
    if (!(dT >= 0)) throw new Error("subCoolingRequired must be >= 0");

    // W = 100 * ΔT * M / (K_h + ΔT * M)
    const W = (100 * dT * M) / (Kh + dT * M);

    return {
      result: { value: W, unit: "%wt" },
      formula: "W = 100·ΔT·M / (K_h + ΔT·M)",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        { label: "Inhibitor constants", expression: `${label}: K_h=${Kh}, M=${M} g/mol` },
        { label: "Sub-cooling (°C)", expression: `ΔT = ${dT} °C` },
        { label: "Inhibitor dose", expression: `W = 100·${dT}·${M} / (${Kh} + ${dT}·${M})`, result: { value: W, unit: "%wt" } },
      ],
      method,
      alternativeMethods: ["MeOH", "MEG"].filter((m) => m !== method),
      reference: "Hammerschmidt equation",
      trustTier: "validated",
      flags: [],
    };
  },
};
