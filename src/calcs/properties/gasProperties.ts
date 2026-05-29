import type { Calc, CalcInput, CalcResult, SanityFlag } from "../../core/types";
import { convert } from "../../units/convert";

// Dranchuk-Abou-Kassem (1975) — solve Z by iterating on reduced density ρr.
function zFactorDAK(Tpr: number, Ppr: number): number {
  const A = [0.3265, -1.07, -0.5339, 0.01569, -0.05165, 0.5475, -0.7361, 0.1844, 0.1056, 0.6134, 0.721];
  let Z = 1.0;
  for (let i = 0; i < 100; i++) {
    const rhor = (0.27 * Ppr) / (Z * Tpr);
    const r2 = rhor * rhor;
    const Zc =
      1 +
      (A[0] + A[1] / Tpr + A[2] / Tpr ** 3 + A[3] / Tpr ** 4 + A[4] / Tpr ** 5) * rhor +
      (A[5] + A[6] / Tpr + A[7] / Tpr ** 2) * r2 -
      A[8] * (A[6] / Tpr + A[7] / Tpr ** 2) * rhor ** 5 +
      A[9] * (1 + A[10] * r2) * (r2 / Tpr ** 3) * Math.exp(-A[10] * r2);
    if (Math.abs(Zc - Z) < 1e-10) return Zc;
    Z = Zc;
  }
  return Z;
}

export const gasProperties: Calc = {
  id: "gasProperties",
  name: "Natural gas properties",
  requiredInputs: [
    { name: "gasSG", exampleUnit: "" },
    { name: "temperature", exampleUnit: "degF" },
    { name: "pressure", exampleUnit: "psi" },
  ],
  run(input: CalcInput): CalcResult {
    const SG = input.inputs.gasSG.value;
    if (!(SG > 0)) throw new Error("gas SG must be > 0");
    const Tk = convert(input.inputs.temperature.value, input.inputs.temperature.unit, "K");
    const Ppsia = convert(input.inputs.pressure.value, input.inputs.pressure.unit, "psi");
    if (!(Tk > 0)) throw new Error("temperature must be > 0");
    if (!(Ppsia > 0)) throw new Error("pressure must be > 0");

    const MW = 28.964 * SG; // air basis (g/mol = kg/kmol)
    // Sutton pseudo-criticals (°R, psia)
    const Tpc = 169.2 + 349.5 * SG - 74 * SG * SG; // °R
    const Ppc = 756.8 - 131.0 * SG - 3.6 * SG * SG; // psia
    const TR = Tk * 1.8; // K → °R
    const Tpr = TR / Tpc;
    const Ppr = Ppsia / Ppc;
    const Z = zFactorDAK(Tpr, Ppr);

    // Density in SI: ρ = P·MW / (Z·R·T)
    const Ppa = convert(Ppsia, "psi", "Pa");
    const R = 8314.46; // J/(kmol·K)
    const rho = (Ppa * MW) / (Z * R * Tk);

    const flags: SanityFlag[] = [];
    if (Tpr < 1.0 || Tpr > 3.0 || Ppr < 0.2 || Ppr > 30) {
      flags.push({ severity: "info", message: `Reduced conditions (Tpr=${Tpr.toFixed(2)}, Ppr=${Ppr.toFixed(2)}) are outside the DAK validity window; verify.`, reference: "Dranchuk-Abou-Kassem (1975)" });
    }

    return {
      result: { value: Z, unit: "" },
      formula: "Z = DAK(Tpr, Ppr) ;  Tpr = T/Tpc, Ppr = P/Ppc (Sutton)",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        { label: "Molecular weight", expression: `MW = 28.964·${SG}`, result: { value: MW, unit: "g/mol" } },
        { label: "Pseudo-criticals (Sutton)", expression: `Tpc=${Tpc.toFixed(1)} °R, Ppc=${Ppc.toFixed(1)} psia` },
        { label: "Reduced", expression: `Tpr=${Tpr.toFixed(3)}, Ppr=${Ppr.toFixed(3)}` },
        { label: "Z-factor (DAK)", expression: "iterate ρr", result: { value: Z, unit: "" } },
        { label: "Gas density", expression: "ρ = P·MW/(Z·R·T)", result: { value: rho, unit: "kg/m^3" } },
      ],
      method: "Dranchuk-Abou-Kassem Z-factor; Sutton pseudo-criticals",
      reference: "Dranchuk-Abou-Kassem (1975); Sutton (1985)",
      trustTier: "computed",
      flags,
    };
  },
};
