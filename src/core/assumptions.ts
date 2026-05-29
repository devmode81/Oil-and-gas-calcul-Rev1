import type { Assumption, Quantity } from "./types";

/** App-wide default assumptions. Standard conditions use SI (15 °C, 101.325 kPa). */
export const DEFAULT_ASSUMPTIONS: Assumption[] = [
  { key: "g", label: "Gravitational acceleration", value: { value: 9.80665, unit: "m/s^2" }, source: "Standard gravity" },
  { key: "P_atm", label: "Atmospheric pressure", value: { value: 101325, unit: "Pa" }, source: "Standard atmosphere" },
  { key: "T_std", label: "Standard temperature", value: { value: 15, unit: "degC" }, source: "ISO standard conditions (15 °C)" },
  { key: "P_std", label: "Standard pressure", value: { value: 101.325, unit: "kPa" }, source: "ISO standard conditions (101.325 kPa)" },
];

/** Return a new assumption list with any matching keys overridden. */
export function mergeAssumptions(
  base: Assumption[],
  overrides?: Record<string, Quantity>,
): Assumption[] {
  if (!overrides) return base.map((a) => ({ ...a }));
  return base.map((a) =>
    overrides[a.key] ? { ...a, value: overrides[a.key], source: "User override" } : { ...a },
  );
}
