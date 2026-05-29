import { math } from "./registry";

/**
 * Convert a numeric value between two compatible units.
 * Throws if the units are dimensionally incompatible.
 */
export function convert(value: number, from: string, to: string): number {
  return math.unit(value, from).toNumber(to);
}
