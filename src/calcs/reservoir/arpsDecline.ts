import type { Calc, CalcInput, CalcResult } from "../../core/types";

export const arpsDecline: Calc = {
  id: "arpsDecline",
  name: "Arps decline curve",
  requiredInputs: [
    { name: "initialRate", exampleUnit: "STB/d" },
    { name: "declineRate", exampleUnit: "" },
    { name: "time", exampleUnit: "" },
  ],
  run(input: CalcInput): CalcResult {
    const qi = input.inputs.initialRate.value; // STB/d
    const D = input.inputs.declineRate.value;  // 1/yr
    const t = input.inputs.time.value;          // yr
    const method = input.method ?? "exponential";

    if (!(qi >= 0)) throw new Error("initialRate must be >= 0");
    if (!(D >= 0)) throw new Error("declineRate must be >= 0");
    if (!(t >= 0)) throw new Error("time must be >= 0");

    let q: number;
    let formula: string;
    let expression: string;

    if (method === "hyperbolic") {
      const b = input.inputs.bExponent?.value ?? 0;
      if (!(b > 0)) throw new Error("bExponent must be > 0 for hyperbolic decline");
      // q = qi / (1 + b·D·t)^(1/b)
      const base = 1 + b * D * t;
      q = qi / Math.pow(base, 1 / b);
      formula = "q = qi / (1 + b·D·t)^(1/b)";
      expression = `q = ${qi} / (1 + ${b}·${D}·${t})^(1/${b}) = ${qi} / ${base.toFixed(6)}^${(1 / b).toFixed(4)}`;
    } else {
      // exponential: q = qi · e^(−D·t)
      q = qi * Math.exp(-D * t);
      formula = "q = qi·e^(−D·t)";
      expression = `q = ${qi} · e^(−${D}·${t}) = ${qi} · e^(${(-D * t).toFixed(4)})`;
    }

    return {
      result: { value: q, unit: "STB/d" },
      formula,
      inputs: input.inputs,
      assumptions: [],
      steps: [
        {
          label: "Decline calculation",
          expression,
          result: { value: q, unit: "STB/d" },
        },
      ],
      method: `Arps decline — ${method}`,
      alternativeMethods: ["exponential", "hyperbolic"],
      trustTier: "computed",
      flags: [],
    };
  },
};
