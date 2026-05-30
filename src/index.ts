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

// Drilling calcs
export { mudHydrostaticPressure } from "./calcs/drilling/mudHydrostaticPressure";
export { mudWeightGradient } from "./calcs/drilling/mudWeightGradient";
export { ecd } from "./calcs/drilling/ecd";
export { equivalentMudWeight } from "./calcs/drilling/equivalentMudWeight";
export { annularVelocity } from "./calcs/drilling/annularVelocity";
export { bitNozzleVelocity } from "./calcs/drilling/bitNozzleVelocity";
export { killMudWeight } from "./calcs/drilling/killMudWeight";
export { buoyancyFactor } from "./calcs/drilling/buoyancyFactor";
export { pumpOutput } from "./calcs/drilling/pumpOutput";

// Reservoir calcs
export { stoiipVolumetric } from "./calcs/reservoir/stoiipVolumetric";
export { ogipVolumetric } from "./calcs/reservoir/ogipVolumetric";
export { gasFvf } from "./calcs/reservoir/gasFvf";
export { oilFvfStanding } from "./calcs/reservoir/oilFvfStanding";
export { solutionGorStanding } from "./calcs/reservoir/solutionGorStanding";
export { darcyRadialInflow } from "./calcs/reservoir/darcyRadialInflow";
export { vogelIpr } from "./calcs/reservoir/vogelIpr";
export { productivityIndex } from "./calcs/reservoir/productivityIndex";
export { arpsDecline } from "./calcs/reservoir/arpsDecline";

// Mechanical / rotating calcs (batch 5)
export { compressorPolytropicPower } from "./calcs/mechanical/compressorPolytropicPower";
export { pumpAffinityLaws } from "./calcs/mechanical/pumpAffinityLaws";
export { heatExchangerDuty } from "./calcs/mechanical/heatExchangerDuty";
export { lmtd } from "./calcs/mechanical/lmtd";
export { heatExchangerArea } from "./calcs/mechanical/heatExchangerArea";
export { asmeViiThickness } from "./calcs/mechanical/asmeViiThickness";
export { pipeStress } from "./calcs/mechanical/pipeStress";
export { fanBlowerPower } from "./calcs/mechanical/fanBlowerPower";

// Subsea / flow-assurance calcs
export { pipelinePressureDrop } from "./calcs/subsea/pipelinePressureDrop";
export { hydrateMargin } from "./calcs/subsea/hydrateMargin";
export { hammerschmidtInhibitorDose } from "./calcs/subsea/hammerschmidtInhibitorDose";
export { insulationHeatLoss } from "./calcs/subsea/insulationHeatLoss";
export { cooldownTime } from "./calcs/subsea/cooldownTime";
export { jouleThomsonCooling } from "./calcs/subsea/jouleThomsonCooling";
export { collapsePressure } from "./calcs/subsea/collapsePressure";
export { liquidHoldup } from "./calcs/subsea/liquidHoldup";

// Electrical calcs (batch 6)
export { motorPowerCurrent } from "./calcs/electrical/motorPowerCurrent";
export { cableVoltageDrop } from "./calcs/electrical/cableVoltageDrop";
export { transformerKva } from "./calcs/electrical/transformerKva";
export { powerFactorCorrection } from "./calcs/electrical/powerFactorCorrection";
export { fullLoadCurrent } from "./calcs/electrical/fullLoadCurrent";
export { cableAmpacityDerating } from "./calcs/electrical/cableAmpacityDerating";
export { powerTriangle } from "./calcs/electrical/powerTriangle";
export { generatorSizing } from "./calcs/electrical/generatorSizing";

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
import { mudHydrostaticPressure } from "./calcs/drilling/mudHydrostaticPressure";
import { mudWeightGradient } from "./calcs/drilling/mudWeightGradient";
import { ecd } from "./calcs/drilling/ecd";
import { equivalentMudWeight } from "./calcs/drilling/equivalentMudWeight";
import { annularVelocity } from "./calcs/drilling/annularVelocity";
import { bitNozzleVelocity } from "./calcs/drilling/bitNozzleVelocity";
import { killMudWeight } from "./calcs/drilling/killMudWeight";
import { buoyancyFactor } from "./calcs/drilling/buoyancyFactor";
import { pumpOutput } from "./calcs/drilling/pumpOutput";
import { stoiipVolumetric } from "./calcs/reservoir/stoiipVolumetric";
import { ogipVolumetric } from "./calcs/reservoir/ogipVolumetric";
import { gasFvf } from "./calcs/reservoir/gasFvf";
import { oilFvfStanding } from "./calcs/reservoir/oilFvfStanding";
import { solutionGorStanding } from "./calcs/reservoir/solutionGorStanding";
import { darcyRadialInflow } from "./calcs/reservoir/darcyRadialInflow";
import { vogelIpr } from "./calcs/reservoir/vogelIpr";
import { productivityIndex } from "./calcs/reservoir/productivityIndex";
import { arpsDecline } from "./calcs/reservoir/arpsDecline";
import { compressorPolytropicPower } from "./calcs/mechanical/compressorPolytropicPower";
import { pumpAffinityLaws } from "./calcs/mechanical/pumpAffinityLaws";
import { heatExchangerDuty } from "./calcs/mechanical/heatExchangerDuty";
import { lmtd } from "./calcs/mechanical/lmtd";
import { heatExchangerArea } from "./calcs/mechanical/heatExchangerArea";
import { asmeViiThickness } from "./calcs/mechanical/asmeViiThickness";
import { pipeStress } from "./calcs/mechanical/pipeStress";
import { fanBlowerPower } from "./calcs/mechanical/fanBlowerPower";
import { pipelinePressureDrop } from "./calcs/subsea/pipelinePressureDrop";
import { hydrateMargin } from "./calcs/subsea/hydrateMargin";
import { hammerschmidtInhibitorDose } from "./calcs/subsea/hammerschmidtInhibitorDose";
import { insulationHeatLoss } from "./calcs/subsea/insulationHeatLoss";
import { cooldownTime } from "./calcs/subsea/cooldownTime";
import { jouleThomsonCooling } from "./calcs/subsea/jouleThomsonCooling";
import { collapsePressure } from "./calcs/subsea/collapsePressure";
import { liquidHoldup } from "./calcs/subsea/liquidHoldup";
import { motorPowerCurrent } from "./calcs/electrical/motorPowerCurrent";
import { cableVoltageDrop } from "./calcs/electrical/cableVoltageDrop";
import { transformerKva } from "./calcs/electrical/transformerKva";
import { powerFactorCorrection } from "./calcs/electrical/powerFactorCorrection";
import { fullLoadCurrent } from "./calcs/electrical/fullLoadCurrent";
import { cableAmpacityDerating } from "./calcs/electrical/cableAmpacityDerating";
import { powerTriangle } from "./calcs/electrical/powerTriangle";
import { generatorSizing } from "./calcs/electrical/generatorSizing";
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
  [mudHydrostaticPressure.id]: mudHydrostaticPressure,
  [mudWeightGradient.id]: mudWeightGradient,
  [ecd.id]: ecd,
  [equivalentMudWeight.id]: equivalentMudWeight,
  [annularVelocity.id]: annularVelocity,
  [bitNozzleVelocity.id]: bitNozzleVelocity,
  [killMudWeight.id]: killMudWeight,
  [buoyancyFactor.id]: buoyancyFactor,
  [pumpOutput.id]: pumpOutput,
  [stoiipVolumetric.id]: stoiipVolumetric,
  [ogipVolumetric.id]: ogipVolumetric,
  [gasFvf.id]: gasFvf,
  [oilFvfStanding.id]: oilFvfStanding,
  [solutionGorStanding.id]: solutionGorStanding,
  [darcyRadialInflow.id]: darcyRadialInflow,
  [vogelIpr.id]: vogelIpr,
  [productivityIndex.id]: productivityIndex,
  [arpsDecline.id]: arpsDecline,
  [pipelinePressureDrop.id]: pipelinePressureDrop,
  [hydrateMargin.id]: hydrateMargin,
  [hammerschmidtInhibitorDose.id]: hammerschmidtInhibitorDose,
  [insulationHeatLoss.id]: insulationHeatLoss,
  [cooldownTime.id]: cooldownTime,
  [jouleThomsonCooling.id]: jouleThomsonCooling,
  [collapsePressure.id]: collapsePressure,
  [liquidHoldup.id]: liquidHoldup,
  [compressorPolytropicPower.id]: compressorPolytropicPower,
  [pumpAffinityLaws.id]: pumpAffinityLaws,
  [heatExchangerDuty.id]: heatExchangerDuty,
  [lmtd.id]: lmtd,
  [heatExchangerArea.id]: heatExchangerArea,
  [asmeViiThickness.id]: asmeViiThickness,
  [pipeStress.id]: pipeStress,
  [fanBlowerPower.id]: fanBlowerPower,
  [motorPowerCurrent.id]: motorPowerCurrent,
  [cableVoltageDrop.id]: cableVoltageDrop,
  [transformerKva.id]: transformerKva,
  [powerFactorCorrection.id]: powerFactorCorrection,
  [fullLoadCurrent.id]: fullLoadCurrent,
  [cableAmpacityDerating.id]: cableAmpacityDerating,
  [powerTriangle.id]: powerTriangle,
  [generatorSizing.id]: generatorSizing,
};
