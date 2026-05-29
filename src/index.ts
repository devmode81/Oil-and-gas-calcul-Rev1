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
export { lineVelocity } from "./calcs/flow/lineVelocity";
export { colebrookFrictionFactor } from "./calcs/flow/colebrook";
export { erosionalVelocity } from "./calcs/flow/erosionalVelocity";
export { pumpPower } from "./calcs/mechanical/pumpPower";
export { npshAvailable } from "./calcs/mechanical/npsh";
export { separatorSizing } from "./calcs/process/separatorSizing";
export { vesselVolume } from "./calcs/geometry/vesselVolume";
export { gasProperties } from "./calcs/properties/gasProperties";

// A registry of the calcs available in this build (used by later sub-projects).
import { cylinderVolume } from "./calcs/geometry/cylinderVolume";
import { reynolds } from "./calcs/fluids/reynolds";
import { pressureDrop } from "./calcs/flow/darcyWeisbach";
import { transitTime } from "./calcs/flow/transitTime";
import { barlowWallThickness } from "./calcs/mechanical/barlow";
import { lineVelocity } from "./calcs/flow/lineVelocity";
import { colebrookFrictionFactor } from "./calcs/flow/colebrook";
import { erosionalVelocity } from "./calcs/flow/erosionalVelocity";
import { pumpPower } from "./calcs/mechanical/pumpPower";
import { npshAvailable } from "./calcs/mechanical/npsh";
import { separatorSizing } from "./calcs/process/separatorSizing";
import { vesselVolume } from "./calcs/geometry/vesselVolume";
import { gasProperties } from "./calcs/properties/gasProperties";
import type { Calc } from "./core/types";

export const CALC_REGISTRY: Record<string, Calc> = {
  [cylinderVolume.id]: cylinderVolume,
  [reynolds.id]: reynolds,
  [pressureDrop.id]: pressureDrop,
  [transitTime.id]: transitTime,
  [barlowWallThickness.id]: barlowWallThickness,
  [lineVelocity.id]: lineVelocity,
  [colebrookFrictionFactor.id]: colebrookFrictionFactor,
  [erosionalVelocity.id]: erosionalVelocity,
  [pumpPower.id]: pumpPower,
  [npshAvailable.id]: npshAvailable,
  [separatorSizing.id]: separatorSizing,
  [vesselVolume.id]: vesselVolume,
  [gasProperties.id]: gasProperties,
};
