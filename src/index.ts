// Types
export type {
  Quantity,
  Step,
  Assumption,
  SanityFlag,
  SanitySeverity,
  TrustTier,
  CalcResult,
  CalcInput,
  Calc,
} from "./core/types";

// Units & formatting
export { convert } from "./units/convert";
export { math } from "./units/registry";
export { toSigFigs } from "./format/sigfig";

// Core
export { DEFAULT_ASSUMPTIONS, mergeAssumptions } from "./core/assumptions";
export { checkMaxVelocity } from "./core/sanity";

// Calcs
export { cylinderVolume } from "./calcs/geometry/cylinderVolume";
export { reynolds } from "./calcs/fluids/reynolds";
export { pressureDrop } from "./calcs/flow/darcyWeisbach";
export { transitTime } from "./calcs/flow/transitTime";
export { apiToSg, sgToApi } from "./calcs/properties/apiGravity";
export { barlowWallThickness } from "./calcs/mechanical/barlow";

// A registry of the calcs available in this build (used by later sub-projects).
import { cylinderVolume } from "./calcs/geometry/cylinderVolume";
import { reynolds } from "./calcs/fluids/reynolds";
import { pressureDrop } from "./calcs/flow/darcyWeisbach";
import { transitTime } from "./calcs/flow/transitTime";
import { barlowWallThickness } from "./calcs/mechanical/barlow";
import type { Calc } from "./core/types";

export const CALC_REGISTRY: Record<string, Calc> = {
  [cylinderVolume.id]: cylinderVolume,
  [reynolds.id]: reynolds,
  [pressureDrop.id]: pressureDrop,
  [transitTime.id]: transitTime,
  [barlowWallThickness.id]: barlowWallThickness,
};
