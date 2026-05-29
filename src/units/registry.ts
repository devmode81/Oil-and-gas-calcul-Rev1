import { create, all, type MathJsInstance } from "mathjs";

/**
 * A mathjs instance extended with oil & gas units.
 * Notes:
 * - "scf"/"MMscf" are treated dimensionally as volumes (standard-condition
 *   amount-of-gas semantics are handled by calcs/assumptions, not the unit).
 * - API gravity is NONLINEAR and is intentionally NOT a unit here; see
 *   calcs/properties/apiGravity.ts.
 */
export const math: MathJsInstance = create(all, {});

// Oil barrel (US, 42 US gal). mathjs ships an Imperial bbl (36 gal); override it.
math.createUnit("bbl", "0.158987294928 m^3", { override: true });
// Standard cubic foot / million standard cubic feet (dimensionally volume).
math.createUnit("scf", "1 ft^3");
math.createUnit("MMscf", "1e6 ft^3");
// Permeability.
math.createUnit("darcy", "9.869233e-13 m^2");
// Viscosity.
math.createUnit("cP", "0.001 Pa s");
// Mud weight: pounds-mass per US gallon (mathjs calls it "gal", not "galUS").
math.createUnit("ppg", "1 lbm/gal");
// Common flow-rate shorthands (depend on bbl above).
math.createUnit("bopd", "1 bbl/day", { aliases: ["bwpd", "blpd"] });
