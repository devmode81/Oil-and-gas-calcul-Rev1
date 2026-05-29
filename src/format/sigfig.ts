/**
 * Format a number to a given number of significant figures (default 4),
 * trimming trailing zeros and avoiding scientific notation for typical
 * engineering magnitudes.
 */
export function toSigFigs(value: number, sig = 4): string {
  if (value === 0) return "0";
  const rounded = Number(value.toPrecision(sig));
  // toPrecision can emit exponential form; normalise back to plain decimal.
  return String(rounded);
}
