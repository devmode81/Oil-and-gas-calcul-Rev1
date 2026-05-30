import type { Calc, CalcInput, CalcResult, Quantity } from "../../core/types";
import { convert } from "../../units/convert";

/** Convert an electrical power quantity (W, kW, VA, kVA, VAR, kVAR) to watts. */
function toWatts(q: Quantity): number {
  const u = q.unit.trim();
  // Handle kilo-prefixed electrical units that mathjs may not know
  if (u === "kW" || u === "kVA" || u === "kVAR") return q.value * 1000;
  if (u === "W" || u === "VA" || u === "VAR" || u === "") return q.value;
  // Fallback to mathjs for other units (e.g. MW)
  return convert(q.value, u, "W");
}

export const powerTriangle: Calc = {
  id: "powerTriangle",
  name: "Power triangle (P, Q, S, pf)",
  requiredInputs: [
    { name: "activePower", exampleUnit: "W" },
  ],
  run(input: CalcInput): CalcResult {
    const method = input.method ?? "from_PQ";

    if (method === "from_PQ") {
      const P = toWatts(input.inputs.activePower);
      const Q = toWatts(input.inputs.reactivePower);
      if (!(P >= 0)) throw new Error("activePower must be >= 0");
      if (!(Q >= 0)) throw new Error("reactivePower must be >= 0");
      const S = Math.sqrt(P * P + Q * Q);
      const pf = S > 0 ? P / S : 1;
      return {
        result: { value: S, unit: "VA" },
        formula: "S = √(P² + Q²);  pf = P/S",
        inputs: input.inputs,
        assumptions: [],
        steps: [
          { label: "Apparent power S", expression: `S = √(${P}²+${Q}²)`, result: { value: S, unit: "VA" } },
          { label: "Power factor pf", expression: `pf = ${P}/${S}`, result: { value: pf, unit: "" } },
        ],
        method: "from_PQ",
        trustTier: "computed",
        flags: [],
      };
    }

    if (method === "from_PS") {
      const P = toWatts(input.inputs.activePower);
      const S = toWatts(input.inputs.apparentPower);
      if (!(P >= 0)) throw new Error("activePower must be >= 0");
      if (!(S > 0)) throw new Error("apparentPower must be > 0");
      if (P > S) throw new Error("activePower cannot exceed apparentPower");
      const pf = P / S;
      const Q = Math.sqrt(S * S - P * P);
      return {
        result: { value: pf, unit: "" },
        formula: "pf = P/S;  Q = √(S² − P²)",
        inputs: input.inputs,
        assumptions: [],
        steps: [
          { label: "Power factor pf", expression: `pf = ${P}/${S}`, result: { value: pf, unit: "" } },
          { label: "Reactive power Q", expression: `Q = √(${S}²−${P}²)`, result: { value: Q, unit: "VAR" } },
        ],
        method: "from_PS",
        trustTier: "computed",
        flags: [],
      };
    }

    if (method === "from_Ppf") {
      const P = toWatts(input.inputs.activePower);
      const pf = input.inputs.powerFactor.value;
      if (!(P >= 0)) throw new Error("activePower must be >= 0");
      if (!(pf > 0 && pf <= 1)) throw new Error("powerFactor must be in (0, 1]");
      const sinPhi = Math.sqrt(1 - pf * pf);
      const Q = P * (sinPhi / pf);
      const S = P / pf;
      return {
        result: { value: Q, unit: "VAR" },
        formula: "Q = P·tanφ;  S = P/pf",
        inputs: input.inputs,
        assumptions: [],
        steps: [
          { label: "Reactive power Q", expression: `Q = ${P}·${(sinPhi / pf).toFixed(4)}`, result: { value: Q, unit: "VAR" } },
          { label: "Apparent power S", expression: `S = ${P}/${pf}`, result: { value: S, unit: "VA" } },
        ],
        method: "from_Ppf",
        trustTier: "computed",
        flags: [],
      };
    }

    throw new Error(`Unknown method "${method}". Use "from_PQ", "from_PS", or "from_Ppf".`);
  },
};
