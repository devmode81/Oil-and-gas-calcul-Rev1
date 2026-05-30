import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";

export const darcyRadialInflow: Calc = {
  id: "darcyRadialInflow",
  name: "Darcy radial inflow (steady/pseudo-steady state)",
  requiredInputs: [
    { name: "permeability", exampleUnit: "md" },
    { name: "thickness", exampleUnit: "ft" },
    { name: "deltaP", exampleUnit: "psi" },
    { name: "viscosity", exampleUnit: "cP" },
    { name: "formationVolumeFactor", exampleUnit: "" },
    { name: "drainageRadius", exampleUnit: "ft" },
    { name: "wellboreRadius", exampleUnit: "ft" },
  ],
  run(input: CalcInput): CalcResult {
    // Convert all inputs to Darcy field units: md, ft, psi, cp, rb/STB
    const k = convert(input.inputs.permeability.value, input.inputs.permeability.unit, "md");
    const h = convert(input.inputs.thickness.value, input.inputs.thickness.unit, "ft");
    const dP = convert(input.inputs.deltaP.value, input.inputs.deltaP.unit, "psi");
    const mu = convert(input.inputs.viscosity.value, input.inputs.viscosity.unit, "cP");
    const B = input.inputs.formationVolumeFactor.value; // dimensionless ratio (rb/STB)
    const re = convert(input.inputs.drainageRadius.value, input.inputs.drainageRadius.unit, "ft");
    const rw = convert(input.inputs.wellboreRadius.value, input.inputs.wellboreRadius.unit, "ft");

    if (!(k > 0)) throw new Error("permeability must be > 0");
    if (!(h > 0)) throw new Error("thickness must be > 0");
    if (!(dP > 0)) throw new Error("deltaP must be > 0");
    if (!(mu > 0)) throw new Error("viscosity must be > 0");
    if (!(B > 0)) throw new Error("formationVolumeFactor must be > 0");
    if (!(re > 0)) throw new Error("drainageRadius must be > 0");
    if (!(rw > 0)) throw new Error("wellboreRadius must be > 0");
    if (!(re > rw)) throw new Error("drainageRadius must be > wellboreRadius");

    // q = k·h·ΔP / (141.2·μ·B·ln(re/rw))   [STB/d]
    const lnRatio = Math.log(re / rw);
    const q = (k * h * dP) / (141.2 * mu * B * lnRatio);

    return {
      result: { value: q, unit: "STB/d" },
      formula: "q = k·h·ΔP / (141.2·μ·B·ln(re/rw))",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        {
          label: "Permeability",
          expression: `k = ${k.toFixed(3)} md`,
        },
        {
          label: "Pressure drawdown",
          expression: `ΔP = ${dP.toFixed(2)} psi`,
        },
        {
          label: "Radial ratio",
          expression: `ln(re/rw) = ln(${re}/${rw}) = ${lnRatio.toFixed(4)}`,
          result: { value: lnRatio, unit: "" },
        },
        {
          label: "Flow rate",
          expression: `q = ${k}·${h}·${dP.toFixed(2)} / (141.2·${mu}·${B}·${lnRatio.toFixed(4)})`,
          result: { value: q, unit: "STB/d" },
        },
      ],
      method: "Darcy radial flow (pseudo-steady/steady)",
      reference: "Darcy radial flow (pseudo-steady/steady)",
      trustTier: "validated",
      flags: [],
    };
  },
};
