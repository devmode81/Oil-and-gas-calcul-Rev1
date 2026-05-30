import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";

export const ogipVolumetric: Calc = {
  id: "ogipVolumetric",
  name: "OGIP — volumetric",
  requiredInputs: [
    { name: "area", exampleUnit: "acre" },
    { name: "thickness", exampleUnit: "ft" },
    { name: "porosity", exampleUnit: "" },
    { name: "waterSaturation", exampleUnit: "" },
    { name: "bgi", exampleUnit: "ft^3/scf" },
  ],
  run(input: CalcInput): CalcResult {
    const A = convert(input.inputs.area.value, input.inputs.area.unit, "acre");
    const h = convert(input.inputs.thickness.value, input.inputs.thickness.unit, "ft");
    const phi = input.inputs.porosity.value;
    const Sw = input.inputs.waterSaturation.value;
    const Bgi = input.inputs.bgi.value;

    if (!(phi >= 0 && phi <= 1)) throw new Error("porosity must be in [0, 1]");
    if (!(Sw >= 0 && Sw <= 1)) throw new Error("waterSaturation must be in [0, 1]");
    if (!(Bgi > 0)) throw new Error("bgi must be > 0");
    if (!(A >= 0)) throw new Error("area must be >= 0");
    if (!(h >= 0)) throw new Error("thickness must be >= 0");

    // G = 43560 · A · h · φ · (1−Sw) / Bgi   [scf]
    // 43560 ft^3/acre-ft converts acre-ft to ft^3
    const G = (43560 * A * h * phi * (1 - Sw)) / Bgi;

    return {
      result: { value: G, unit: "scf" },
      formula: "G = 43560·A·h·φ·(1−Sw)/Bgi",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        {
          label: "Bulk volume",
          expression: `BV = 43560·${A}·${h} = ${(43560 * A * h).toFixed(0)} ft^3`,
        },
        {
          label: "Hydrocarbon pore volume",
          expression: `HCPV = BV·${phi}·(1−${Sw}) = ${(43560 * A * h * phi * (1 - Sw)).toFixed(0)} ft^3`,
        },
        {
          label: "OGIP",
          expression: `G = HCPV / ${Bgi}`,
          result: { value: G, unit: "scf" },
        },
      ],
      method: "Volumetric (field units)",
      reference: "SPE volumetric (OGIP)",
      trustTier: "validated",
      flags: [],
    };
  },
};
