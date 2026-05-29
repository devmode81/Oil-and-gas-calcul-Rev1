/**
 * Format a number to a given number of significant figures (default 4),
 * trimming trailing zeros and never returning scientific notation.
 */
export function toSigFigs(value: number, sig = 4): string {
  if (value === 0) return "0";
  const rounded = Number(value.toPrecision(sig));
  const s = String(rounded);
  if (!s.includes("e") && !s.includes("E")) {
    return s;
  }
  // JS emitted exponential form; reformat as plain decimal.
  // For a value like 1.234e-7 with sig=4, we need 10 decimal places.
  const exp = Math.floor(Math.log10(Math.abs(rounded)));
  const decimalPlaces = sig - 1 - exp; // exp is negative for small numbers
  if (decimalPlaces <= 0) return String(Math.round(rounded));
  return rounded.toFixed(decimalPlaces).replace(/\.?0+$/, "");
}
