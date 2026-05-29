import type { Quantity, SanityFlag } from "./types";
import { convert } from "../units/convert";

/**
 * Flag fluid velocities above a conservative liquid-line rule-of-thumb
 * (~4.5 m/s ≈ 15 ft/s). This is a heuristic guard, not a full API RP 14E
 * erosional-velocity calculation (which depends on mixture density).
 */
export function checkMaxVelocity(velocity: Quantity, limitMs = 4.5): SanityFlag | null {
  const v = convert(velocity.value, velocity.unit, "m/s");
  if (v <= limitMs) return null;
  return {
    severity: "warn",
    message: `Velocity ${v.toFixed(1)} m/s exceeds the ${limitMs} m/s liquid-line guideline; check erosional velocity.`,
    reference: "API RP 14E (erosional velocity guidance)",
  };
}
