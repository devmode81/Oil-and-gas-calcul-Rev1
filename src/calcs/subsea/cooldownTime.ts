import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";

export const cooldownTime: Calc = {
  id: "cooldownTime",
  name: "Pipeline cooldown time (lumped capacitance)",
  requiredInputs: [
    { name: "mass", exampleUnit: "kg" },
    { name: "heatCapacity", exampleUnit: "J/(kg K)" },
    { name: "heatLossCoeff", exampleUnit: "W/K" },
    { name: "initialTemp", exampleUnit: "degC" },
    { name: "targetTemp", exampleUnit: "degC" },
    { name: "ambientTemp", exampleUnit: "degC" },
  ],
  run(input: CalcInput): CalcResult {
    const m = convert(input.inputs.mass.value, input.inputs.mass.unit, "kg");
    // heatCapacity and heatLossCoeff treated as SI scalars
    const Cp = input.inputs.heatCapacity.value; // J/(kg·K)
    const UA = input.inputs.heatLossCoeff.value; // W/K

    // Temperatures: convert to °C (offset conversion)
    const T_init = convert(input.inputs.initialTemp.value, input.inputs.initialTemp.unit, "degC");
    const T_target = convert(input.inputs.targetTemp.value, input.inputs.targetTemp.unit, "degC");
    const T_env = convert(input.inputs.ambientTemp.value, input.inputs.ambientTemp.unit, "degC");

    if (!(m > 0)) throw new Error("mass must be > 0");
    if (!(Cp > 0)) throw new Error("heatCapacity must be > 0");
    if (!(UA > 0)) throw new Error("heatLossCoeff must be > 0");
    if (!(T_init > T_target)) throw new Error("initialTemp must be > targetTemp");
    if (!(T_target > T_env)) throw new Error("targetTemp must be > ambientTemp");

    // τ = m·Cp/UA
    const tau = (m * Cp) / UA;
    // t = −τ·ln((T_target − T_env)/(T_init − T_env))
    const ratio = (T_target - T_env) / (T_init - T_env);
    const t = -tau * Math.log(ratio);

    return {
      result: { value: t, unit: "s" },
      formula: "t = −τ·ln[(T_target−T_env)/(T_init−T_env)];  τ = m·Cp/UA",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        { label: "Normalise to SI", expression: `m=${m} kg, Cp=${Cp} J/(kg·K), UA=${UA} W/K` },
        { label: "Temperature in °C", expression: `T_init=${T_init}, T_target=${T_target}, T_env=${T_env}` },
        { label: "Time constant τ", expression: `τ = ${m}·${Cp}/${UA}`, result: { value: tau, unit: "s" } },
        { label: "Temperature ratio", expression: `ratio = (${T_target}−${T_env})/(${T_init}−${T_env}) = ${ratio}` },
        { label: "Cooldown time", expression: `t = −${tau}·ln(${ratio})`, result: { value: t, unit: "s" } },
      ],
      method: "Lumped capacitance",
      trustTier: "computed",
      flags: [],
    };
  },
};
