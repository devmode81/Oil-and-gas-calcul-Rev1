/**
 * API gravity <-> specific gravity (at 60 °F).
 * SG = 141.5 / (131.5 + °API)   ;   °API = 141.5/SG − 131.5
 * This is a nonlinear relationship, intentionally not modelled as a unit.
 */
export function apiToSg(api: number): number {
  return 141.5 / (131.5 + api);
}

export function sgToApi(sg: number): number {
  return 141.5 / sg - 131.5;
}
