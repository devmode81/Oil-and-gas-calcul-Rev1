import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";

export const stoiipVolumetric: Calc = {
  id: "stoiipVolumetric",
  name: "STOIIP — volumetric",
  requiredInputs: [
    { name: "area", exampleUnit: "acre" },
    { name: "thickness", exampleUnit: "ft" },
    { name: "porosity", exampleUnit: "" },
    { name: "waterSaturation", exampleUnit: "" },
    { name: "boi", exampleUnit: "rb/STB" },
  ],
  run(input: CalcInput): CalcResult {
    const A = convert(input.inputs.area.value, input.inputs.area.unit, "acre");
    const h = convert(input.inputs.thickness.value, input.inputs.thickness.unit, "ft");
    const phi = input.inputs.porosity.value;
    const Sw = input.inputs.waterSaturation.value;
    const Boi = input.inputs.boi.value;

    if (!(phi >= 0 && phi <= 1)) throw new Error("porosity must be in [0, 1]");
    if (!(Sw >= 0 && Sw <= 1)) throw new Error("waterSaturation must be in [0, 1]");
    if (!(Boi > 0)) throw new Error("boi must be > 0");
    if (!(A >= 0)) throw new Error("area must be >= 0");
    if (!(h >= 0)) throw new Error("thickness must be >= 0");

    // N = 7758.4 · A · h · φ · (1−Sw) / Boi   [STB]
    const N = (7758.4 * A * h * phi * (1 - Sw)) / Boi;

    return {
      result: { value: N, unit: "STB" },
      formula: "N = 7758.4·A·h·φ·(1−Sw)/Boi",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        {
          label: "Pore volume",
          expression: `PV = 7758.4·${A}·${h}·${phi} = ${(7758.4 * A * h * phi).toFixed(0)} bbl`,
        },
        {
          label: "Hydrocarbon pore volume",
          expression: `HCPV = PV·(1−${Sw}) = ${(7758.4 * A * h * phi * (1 - Sw)).toFixed(0)} bbl`,
        },
        {
          label: "STOIIP",
          expression: `N = HCPV / ${Boi}`,
          result: { value: N, unit: "STB" },
        },
      ],
      method: "Volumetric (field units)",
      reference: "SPE volumetric (STOIIP)",
      trustTier: "validated",
      flags: [],
    };
  },
};
