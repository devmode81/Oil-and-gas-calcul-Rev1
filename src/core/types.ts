/** A numeric value with an attached unit string (e.g. { value: 1550, unit: "psi" }). */
export interface Quantity {
  value: number;
  unit: string;
}

/** One line in the "show your work" derivation. */
export interface Step {
  /** Human-readable label, e.g. "Cross-sectional area". */
  label: string;
  /** The expression as shown, e.g. "A = π·r² = π·(0.05 m)²". */
  expression: string;
  /** The resulting quantity for this step, if any. */
  result?: Quantity;
}

/** An assumption used by a calc; visible and overridable by the caller. */
export interface Assumption {
  key: string;
  label: string;
  value: Quantity;
  /** Where the default comes from, e.g. "Standard gravity". */
  source?: string;
}

export type SanitySeverity = "info" | "warn";

/** A flagged concern about a result (e.g. velocity exceeds erosional limit). */
export interface SanityFlag {
  severity: SanitySeverity;
  message: string;
  /** Optional standard/clause backing the flag, e.g. "API RP 14E". */
  reference?: string;
}

export type TrustTier =
  | "exact" // Tier 1: conversions
  | "computed" // Tier 2: standard formula
  | "validated" // Tier 3: curated, standard-cited
  | "ai-estimate"; // Tier 4: AI-derived (not produced by this core)

/** The structured output of every calc — everything the UI needs to show the work. */
export interface CalcResult {
  /** The headline answer. */
  result: Quantity;
  /** The primary formula in display form, e.g. "V = π·r²·L". */
  formula: string;
  /** Inputs as provided (after normalization). */
  inputs: Record<string, Quantity>;
  /** Assumptions actually used (defaults merged with overrides). */
  assumptions: Assumption[];
  /** Ordered derivation steps. */
  steps: Step[];
  /** Method/correlation used, e.g. "Darcy-Weisbach". */
  method: string;
  /** Alternative methods the caller could have chosen. */
  alternativeMethods?: string[];
  /** Standard + clause, e.g. "ASME B31.8 §841.1.1". */
  reference?: string;
  trustTier: TrustTier;
  flags: SanityFlag[];
}

/** Inputs to a calc: named quantities plus optional assumption overrides + method choice. */
export interface CalcInput {
  inputs: Record<string, Quantity>;
  assumptionOverrides?: Record<string, Quantity>;
  method?: string;
}

/** Every calculation conforms to this pure-function interface. */
export interface Calc {
  /** Stable id, e.g. "cylinderVolume". */
  id: string;
  /** Display name. */
  name: string;
  /** Names of required inputs and their expected dimension (unit example). */
  requiredInputs: { name: string; exampleUnit: string }[];
  run(input: CalcInput): CalcResult;
}
