# Deterministic Core — Foundation & Units Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the deterministic, unit-aware calculation core for the O&G calc app — a standalone TypeScript library that converts units (incl. oilfield units) and runs real engineering calcs, each returning a "show your work" result with formula, inputs, assumptions, standard citation, trust tier, and sanity flags.

**Architecture:** A pure, dependency-light TypeScript library with no UI and no AI. Unit conversion is delegated to `mathjs` (extended with custom oilfield units). Every calculation is a pure function conforming to a single `Calc` interface and returns a structured `CalcResult` that carries everything the UI needs to "show the work." Goal-seek, sliders, and batch (later sub-projects) wrap this same interface. This plan builds the foundation + a vertical slice of calcs that exercises every part of the framework.

**Tech Stack:** TypeScript, `mathjs` (units + arithmetic), `vitest` (testing), `tsup` (bundling). Node 20+. npm.

**Scope note:** This plan delivers the framework + units engine + a representative slice of calcs (cylinder volume, Reynolds number, Darcy-Weisbach ΔP with method choice, API-gravity↔SG property, Barlow pipe-wall-thickness as the standard-cited Tier 3 example, and pipeline transit time). The full discipline breadth (reservoir/drilling/electrical/etc. calcs) is added in later plans against this exact framework.

---

## File Structure

```
src/
  index.ts                       # public exports
  units/
    registry.ts                  # extends a mathjs instance with oilfield units
    convert.ts                   # convert(value, from, to); handles linear units
  format/
    sigfig.ts                    # significant-figure formatting
  core/
    types.ts                     # Quantity, CalcResult, Step, Assumption, SanityFlag, Calc
    assumptions.ts               # default assumptions + standard conditions
    sanity.ts                    # sanity-check helpers
  calcs/
    geometry/cylinderVolume.ts
    fluids/reynolds.ts
    flow/darcyWeisbach.ts        # method choice: Darcy-Weisbach | Hazen-Williams
    flow/transitTime.ts
    properties/apiGravity.ts     # nonlinear API<->SG (not a mathjs unit)
    mechanical/barlow.ts         # Tier 3, ASME B31.x hoop stress; cites standard
tests/
  units/convert.test.ts
  format/sigfig.test.ts
  core/assumptions.test.ts
  core/sanity.test.ts
  calcs/cylinderVolume.test.ts
  calcs/reynolds.test.ts
  calcs/darcyWeisbach.test.ts
  calcs/transitTime.test.ts
  calcs/apiGravity.test.ts
  calcs/barlow.test.ts
```

---

### Task 1: Project scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `vitest.config.ts`, `src/index.ts`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "@oilgas/core",
  "version": "0.0.0",
  "description": "Deterministic, unit-aware engineering calculation core",
  "type": "module",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "build": "tsup src/index.ts --format esm --dts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "mathjs": "^13.0.0"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vitest": "^2.0.0",
    "tsup": "^8.0.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "outDir": "dist",
    "lib": ["ES2022"]
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
```

- [ ] **Step 4: Create placeholder `src/index.ts` and install**

```ts
export const VERSION = "0.0.0";
```

Run: `npm install`
Expected: dependencies install with no errors; `node_modules/` created.

- [ ] **Step 5: Commit**

```bash
git add package.json tsconfig.json vitest.config.ts src/index.ts package-lock.json
git commit -m "chore: scaffold deterministic core TS library"
```

---

### Task 2: Core types

**Files:**
- Create: `src/core/types.ts`

These types are the contract every later task depends on. Define them once, completely.

- [ ] **Step 1: Write `src/core/types.ts`**

```ts
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
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS (no errors).

- [ ] **Step 3: Commit**

```bash
git add src/core/types.ts
git commit -m "feat(core): add core result/calc type definitions"
```

---

### Task 3: Units registry (extend mathjs with oilfield units)

**Files:**
- Create: `src/units/registry.ts`
- Test: `tests/units/convert.test.ts` (created in Task 4; this task is verified via Task 4 tests)

- [ ] **Step 1: Write `src/units/registry.ts`**

```ts
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

// Oil barrel (US, 42 US gal).
math.createUnit("bbl", "0.158987294928 m^3");
// Standard cubic foot / million standard cubic feet (dimensionally volume).
math.createUnit("scf", "1 ft^3");
math.createUnit("MMscf", "1e6 ft^3");
// Permeability.
math.createUnit("darcy", "9.869233e-13 m^2");
// Viscosity.
math.createUnit("cP", "0.001 Pa s");
// Mud weight: pounds-mass per US gallon.
math.createUnit("ppg", "1 lbm/galUS");
// Common flow-rate shorthands (depend on bbl above).
math.createUnit("bopd", "1 bbl/day", { aliases: ["bwpd", "blpd"] });
```

- [ ] **Step 2: Typecheck**

Run: `npm run typecheck`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/units/registry.ts
git commit -m "feat(units): extend mathjs with oilfield units"
```

---

### Task 4: Unit conversion

**Files:**
- Create: `src/units/convert.ts`
- Test: `tests/units/convert.test.ts`

- [ ] **Step 1: Write the failing test `tests/units/convert.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { convert } from "../../src/units/convert";

describe("convert", () => {
  it("converts 1550 psi to bar", () => {
    expect(convert(1550, "psi", "bar")).toBeCloseTo(106.87, 2);
  });

  it("converts 1 bbl to m^3", () => {
    expect(convert(1, "bbl", "m^3")).toBeCloseTo(0.158987, 5);
  });

  it("converts 1 MMscf to ft^3", () => {
    expect(convert(1, "MMscf", "ft^3")).toBeCloseTo(1e6, 0);
  });

  it("throws on incompatible dimensions", () => {
    expect(() => convert(1, "psi", "m")).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/units/convert.test.ts`
Expected: FAIL — `convert` is not defined / module not found.

- [ ] **Step 3: Write `src/units/convert.ts`**

```ts
import { math } from "./registry";

/**
 * Convert a numeric value between two compatible units.
 * Throws if the units are dimensionally incompatible.
 */
export function convert(value: number, from: string, to: string): number {
  return math.unit(value, from).toNumber(to);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/units/convert.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/units/convert.ts tests/units/convert.test.ts
git commit -m "feat(units): add convert() with oilfield-unit coverage"
```

---

### Task 5: Significant-figure formatting

**Files:**
- Create: `src/format/sigfig.ts`
- Test: `tests/format/sigfig.test.ts`

- [ ] **Step 1: Write the failing test `tests/format/sigfig.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { toSigFigs } from "../../src/format/sigfig";

describe("toSigFigs", () => {
  it("rounds to default 4 significant figures", () => {
    expect(toSigFigs(8.333333)).toBe("8.333");
  });

  it("respects requested sig figs", () => {
    expect(toSigFigs(2827.4333882, 5)).toBe("2827.4");
  });

  it("handles zero", () => {
    expect(toSigFigs(0)).toBe("0");
  });

  it("handles large numbers", () => {
    expect(toSigFigs(200000, 3)).toBe("200000");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/format/sigfig.test.ts`
Expected: FAIL — `toSigFigs` is not defined.

- [ ] **Step 3: Write `src/format/sigfig.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/format/sigfig.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/format/sigfig.ts tests/format/sigfig.test.ts
git commit -m "feat(format): add significant-figure formatting"
```

---

### Task 6: Assumptions & standard conditions

**Files:**
- Create: `src/core/assumptions.ts`
- Test: `tests/core/assumptions.test.ts`

- [ ] **Step 1: Write the failing test `tests/core/assumptions.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { DEFAULT_ASSUMPTIONS, mergeAssumptions } from "../../src/core/assumptions";

describe("assumptions", () => {
  it("provides standard gravity by default", () => {
    const g = DEFAULT_ASSUMPTIONS.find((a) => a.key === "g");
    expect(g?.value.value).toBeCloseTo(9.80665, 5);
    expect(g?.value.unit).toBe("m/s^2");
  });

  it("merges an override by key", () => {
    const merged = mergeAssumptions(DEFAULT_ASSUMPTIONS, {
      g: { value: 9.81, unit: "m/s^2" },
    });
    const g = merged.find((a) => a.key === "g");
    expect(g?.value.value).toBe(9.81);
  });

  it("leaves non-overridden assumptions unchanged", () => {
    const merged = mergeAssumptions(DEFAULT_ASSUMPTIONS, {
      g: { value: 9.81, unit: "m/s^2" },
    });
    const patm = merged.find((a) => a.key === "P_atm");
    expect(patm?.value.value).toBeCloseTo(101325, 0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/assumptions.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/core/assumptions.ts`**

```ts
import type { Assumption, Quantity } from "./types";

/** App-wide default assumptions. Standard conditions use SI (15 °C, 101.325 kPa). */
export const DEFAULT_ASSUMPTIONS: Assumption[] = [
  { key: "g", label: "Gravitational acceleration", value: { value: 9.80665, unit: "m/s^2" }, source: "Standard gravity" },
  { key: "P_atm", label: "Atmospheric pressure", value: { value: 101325, unit: "Pa" }, source: "Standard atmosphere" },
  { key: "T_std", label: "Standard temperature", value: { value: 15, unit: "degC" }, source: "ISO standard conditions (15 °C)" },
  { key: "P_std", label: "Standard pressure", value: { value: 101.325, unit: "kPa" }, source: "ISO standard conditions (101.325 kPa)" },
];

/** Return a new assumption list with any matching keys overridden. */
export function mergeAssumptions(
  base: Assumption[],
  overrides?: Record<string, Quantity>,
): Assumption[] {
  if (!overrides) return base.map((a) => ({ ...a }));
  return base.map((a) =>
    overrides[a.key] ? { ...a, value: overrides[a.key], source: "User override" } : { ...a },
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/core/assumptions.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/core/assumptions.ts tests/core/assumptions.test.ts
git commit -m "feat(core): add default assumptions and override merge"
```

---

### Task 7: Sanity-check helpers

**Files:**
- Create: `src/core/sanity.ts`
- Test: `tests/core/sanity.test.ts`

- [ ] **Step 1: Write the failing test `tests/core/sanity.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { checkMaxVelocity } from "../../src/core/sanity";

describe("checkMaxVelocity", () => {
  it("flags liquid velocity above the erosional rule-of-thumb", () => {
    const flag = checkMaxVelocity({ value: 18, unit: "m/s" });
    expect(flag).not.toBeNull();
    expect(flag?.severity).toBe("warn");
    expect(flag?.reference).toContain("API RP 14E");
  });

  it("returns null for acceptable velocity", () => {
    expect(checkMaxVelocity({ value: 2, unit: "m/s" })).toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/core/sanity.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/core/sanity.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/core/sanity.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/core/sanity.ts tests/core/sanity.test.ts
git commit -m "feat(core): add velocity sanity-check helper"
```

---

### Task 8: Cylinder volume calc (Tier 2, geometry)

Implements example input: "volume of a cylinder with radius 3 m and length 100 m".

**Files:**
- Create: `src/calcs/geometry/cylinderVolume.ts`
- Test: `tests/calcs/cylinderVolume.test.ts`

- [ ] **Step 1: Write the failing test `tests/calcs/cylinderVolume.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { cylinderVolume } from "../../src/calcs/geometry/cylinderVolume";

describe("cylinderVolume", () => {
  it("computes V = π·r²·L for r=3 m, L=100 m", () => {
    const res = cylinderVolume.run({
      inputs: { radius: { value: 3, unit: "m" }, length: { value: 100, unit: "m" } },
    });
    expect(res.result.unit).toBe("m^3");
    expect(res.result.value).toBeCloseTo(2827.433, 2);
    expect(res.trustTier).toBe("computed");
    expect(res.formula).toContain("π");
    expect(res.steps.length).toBeGreaterThan(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/calcs/cylinderVolume.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/calcs/geometry/cylinderVolume.ts`**

```ts
import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";

export const cylinderVolume: Calc = {
  id: "cylinderVolume",
  name: "Cylinder volume",
  requiredInputs: [
    { name: "radius", exampleUnit: "m" },
    { name: "length", exampleUnit: "m" },
  ],
  run(input: CalcInput): CalcResult {
    const r = convert(input.inputs.radius.value, input.inputs.radius.unit, "m");
    const L = convert(input.inputs.length.value, input.inputs.length.unit, "m");
    const V = Math.PI * r * r * L;
    return {
      result: { value: V, unit: "m^3" },
      formula: "V = π·r²·L",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        { label: "Convert inputs to SI", expression: `r = ${r} m, L = ${L} m` },
        { label: "Apply formula", expression: `V = π·(${r} m)²·(${L} m)`, result: { value: V, unit: "m^3" } },
      ],
      method: "Right-circular cylinder",
      reference: undefined,
      trustTier: "computed",
      flags: [],
    };
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/calcs/cylinderVolume.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/calcs/geometry/cylinderVolume.ts tests/calcs/cylinderVolume.test.ts
git commit -m "feat(calcs): add cylinder volume (Tier 2)"
```

---

### Task 9: Reynolds number calc (Tier 2, fluids)

**Files:**
- Create: `src/calcs/fluids/reynolds.ts`
- Test: `tests/calcs/reynolds.test.ts`

- [ ] **Step 1: Write the failing test `tests/calcs/reynolds.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { reynolds } from "../../src/calcs/fluids/reynolds";

describe("reynolds", () => {
  it("computes Re = ρ·v·D/μ", () => {
    const res = reynolds.run({
      inputs: {
        density: { value: 1000, unit: "kg/m^3" },
        velocity: { value: 2, unit: "m/s" },
        diameter: { value: 0.1, unit: "m" },
        viscosity: { value: 0.001, unit: "Pa s" },
      },
    });
    expect(res.result.value).toBeCloseTo(200000, 0);
    expect(res.result.unit).toBe(""); // dimensionless
    expect(res.steps.length).toBeGreaterThan(0);
  });

  it("accepts viscosity in cP", () => {
    const res = reynolds.run({
      inputs: {
        density: { value: 1000, unit: "kg/m^3" },
        velocity: { value: 2, unit: "m/s" },
        diameter: { value: 0.1, unit: "m" },
        viscosity: { value: 1, unit: "cP" },
      },
    });
    expect(res.result.value).toBeCloseTo(200000, 0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/calcs/reynolds.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/calcs/fluids/reynolds.ts`**

```ts
import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";

export const reynolds: Calc = {
  id: "reynolds",
  name: "Reynolds number",
  requiredInputs: [
    { name: "density", exampleUnit: "kg/m^3" },
    { name: "velocity", exampleUnit: "m/s" },
    { name: "diameter", exampleUnit: "m" },
    { name: "viscosity", exampleUnit: "Pa s" },
  ],
  run(input: CalcInput): CalcResult {
    const rho = convert(input.inputs.density.value, input.inputs.density.unit, "kg/m^3");
    const v = convert(input.inputs.velocity.value, input.inputs.velocity.unit, "m/s");
    const D = convert(input.inputs.diameter.value, input.inputs.diameter.unit, "m");
    const mu = convert(input.inputs.viscosity.value, input.inputs.viscosity.unit, "Pa s");
    const Re = (rho * v * D) / mu;
    return {
      result: { value: Re, unit: "" },
      formula: "Re = ρ·v·D/μ",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        { label: "Normalise to SI", expression: `ρ=${rho} kg/m³, v=${v} m/s, D=${D} m, μ=${mu} Pa·s` },
        { label: "Apply formula", expression: `Re = (${rho}·${v}·${D})/${mu}`, result: { value: Re, unit: "" } },
      ],
      method: "Reynolds number",
      trustTier: "computed",
      flags: [],
    };
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/calcs/reynolds.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/calcs/fluids/reynolds.ts tests/calcs/reynolds.test.ts
git commit -m "feat(calcs): add Reynolds number (Tier 2)"
```

---

### Task 10: Darcy-Weisbach ΔP with method choice (Tier 2, flow)

Exercises the `method` / `alternativeMethods` mechanism.

**Files:**
- Create: `src/calcs/flow/darcyWeisbach.ts`
- Test: `tests/calcs/darcyWeisbach.test.ts`

- [ ] **Step 1: Write the failing test `tests/calcs/darcyWeisbach.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { pressureDrop } from "../../src/calcs/flow/darcyWeisbach";

describe("pressureDrop", () => {
  const baseInputs = {
    frictionFactor: { value: 0.02, unit: "" },
    length: { value: 100, unit: "m" },
    diameter: { value: 0.1, unit: "m" },
    density: { value: 1000, unit: "kg/m^3" },
    velocity: { value: 2, unit: "m/s" },
  };

  it("computes ΔP = f·(L/D)·(ρ·v²/2) = 40000 Pa", () => {
    const res = pressureDrop.run({ inputs: baseInputs });
    expect(res.result.value).toBeCloseTo(40000, 0);
    expect(res.result.unit).toBe("Pa");
    expect(res.method).toBe("Darcy-Weisbach");
    expect(res.alternativeMethods).toContain("Hazen-Williams");
  });

  it("reports the chosen method when overridden", () => {
    const res = pressureDrop.run({ inputs: baseInputs, method: "Darcy-Weisbach" });
    expect(res.method).toBe("Darcy-Weisbach");
  });

  it("throws on an unsupported method", () => {
    expect(() => pressureDrop.run({ inputs: baseInputs, method: "Bogus" })).toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/calcs/darcyWeisbach.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/calcs/flow/darcyWeisbach.ts`**

```ts
import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";

const SUPPORTED = ["Darcy-Weisbach", "Hazen-Williams"];

export const pressureDrop: Calc = {
  id: "pressureDrop",
  name: "Pipe pressure drop",
  requiredInputs: [
    { name: "frictionFactor", exampleUnit: "" },
    { name: "length", exampleUnit: "m" },
    { name: "diameter", exampleUnit: "m" },
    { name: "density", exampleUnit: "kg/m^3" },
    { name: "velocity", exampleUnit: "m/s" },
  ],
  run(input: CalcInput): CalcResult {
    const method = input.method ?? "Darcy-Weisbach";
    if (!SUPPORTED.includes(method)) {
      throw new Error(`Unsupported method "${method}". Supported: ${SUPPORTED.join(", ")}`);
    }
    if (method !== "Darcy-Weisbach") {
      // Hazen-Williams requires a C-factor input set; not part of this slice.
      throw new Error(`Method "${method}" not implemented in this build.`);
    }
    const f = input.inputs.frictionFactor.value;
    const L = convert(input.inputs.length.value, input.inputs.length.unit, "m");
    const D = convert(input.inputs.diameter.value, input.inputs.diameter.unit, "m");
    const rho = convert(input.inputs.density.value, input.inputs.density.unit, "kg/m^3");
    const v = convert(input.inputs.velocity.value, input.inputs.velocity.unit, "m/s");
    const dP = f * (L / D) * ((rho * v * v) / 2);
    return {
      result: { value: dP, unit: "Pa" },
      formula: "ΔP = f·(L/D)·(ρ·v²/2)",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        { label: "Normalise to SI", expression: `f=${f}, L=${L} m, D=${D} m, ρ=${rho} kg/m³, v=${v} m/s` },
        { label: "Apply formula", expression: `ΔP = ${f}·(${L}/${D})·(${rho}·${v}²/2)`, result: { value: dP, unit: "Pa" } },
      ],
      method: "Darcy-Weisbach",
      alternativeMethods: ["Hazen-Williams"],
      trustTier: "computed",
      flags: [],
    };
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/calcs/darcyWeisbach.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/calcs/flow/darcyWeisbach.ts tests/calcs/darcyWeisbach.test.ts
git commit -m "feat(calcs): add Darcy-Weisbach pressure drop with method choice"
```

---

### Task 11: API gravity ↔ SG property (nonlinear correlation)

**Files:**
- Create: `src/calcs/properties/apiGravity.ts`
- Test: `tests/calcs/apiGravity.test.ts`

- [ ] **Step 1: Write the failing test `tests/calcs/apiGravity.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { apiToSg, sgToApi } from "../../src/calcs/properties/apiGravity";

describe("API gravity", () => {
  it("converts 30 °API to specific gravity ≈ 0.8762", () => {
    expect(apiToSg(30)).toBeCloseTo(0.8762, 4);
  });

  it("converts SG 0.8762 back to ≈ 30 °API", () => {
    expect(sgToApi(0.8762)).toBeCloseTo(30, 1);
  });

  it("water (10 °API) ≈ SG 1.0", () => {
    expect(apiToSg(10)).toBeCloseTo(1.0, 3);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/calcs/apiGravity.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/calcs/properties/apiGravity.ts`**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/calcs/apiGravity.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/calcs/properties/apiGravity.ts tests/calcs/apiGravity.test.ts
git commit -m "feat(calcs): add API gravity <-> SG correlation"
```

---

### Task 12: Barlow pipe wall thickness (Tier 3, standard-cited)

This is the vertical slice's **validated, standard-cited** calc — proves the Tier 3 path (reference + `validated` tier).

**Files:**
- Create: `src/calcs/mechanical/barlow.ts`
- Test: `tests/calcs/barlow.test.ts`

- [ ] **Step 1: Write the failing test `tests/calcs/barlow.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { barlowWallThickness } from "../../src/calcs/mechanical/barlow";

describe("barlowWallThickness", () => {
  it("computes t = P·D/(2·S·E) = 0.25 in", () => {
    const res = barlowWallThickness.run({
      inputs: {
        pressure: { value: 1000, unit: "psi" },
        outsideDiameter: { value: 10, unit: "inch" },
        allowableStress: { value: 20000, unit: "psi" },
      },
      assumptionOverrides: { E: { value: 1, unit: "" } },
    });
    expect(res.result.unit).toBe("inch");
    expect(res.result.value).toBeCloseTo(0.25, 4);
    expect(res.trustTier).toBe("validated");
    expect(res.reference).toContain("Barlow");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/calcs/barlow.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/calcs/mechanical/barlow.ts`**

```ts
import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";
import { mergeAssumptions } from "../../core/assumptions";
import type { Assumption } from "../../core/types";

const BASE_ASSUMPTIONS: Assumption[] = [
  { key: "E", label: "Longitudinal joint factor", value: { value: 1, unit: "" }, source: "Seamless pipe (E=1)" },
];

/**
 * Barlow's formula for minimum wall thickness (hoop stress):
 *   t = P·D / (2·S·E)
 * where D is outside diameter, S the allowable stress, E the joint factor.
 * Cited per ASME B31.x / Barlow's equation.
 */
export const barlowWallThickness: Calc = {
  id: "barlowWallThickness",
  name: "Pipe wall thickness (Barlow)",
  requiredInputs: [
    { name: "pressure", exampleUnit: "psi" },
    { name: "outsideDiameter", exampleUnit: "inch" },
    { name: "allowableStress", exampleUnit: "psi" },
  ],
  run(input: CalcInput): CalcResult {
    const assumptions = mergeAssumptions(BASE_ASSUMPTIONS, input.assumptionOverrides);
    const E = assumptions.find((a) => a.key === "E")!.value.value;
    const P = convert(input.inputs.pressure.value, input.inputs.pressure.unit, "psi");
    const D = convert(input.inputs.outsideDiameter.value, input.inputs.outsideDiameter.unit, "inch");
    const S = convert(input.inputs.allowableStress.value, input.inputs.allowableStress.unit, "psi");
    const t = (P * D) / (2 * S * E);
    return {
      result: { value: t, unit: "inch" },
      formula: "t = P·D / (2·S·E)",
      inputs: input.inputs,
      assumptions,
      steps: [
        { label: "Normalise to field units", expression: `P=${P} psi, D=${D} in, S=${S} psi, E=${E}` },
        { label: "Apply Barlow", expression: `t = (${P}·${D})/(2·${S}·${E})`, result: { value: t, unit: "inch" } },
      ],
      method: "Barlow hoop-stress",
      reference: "Barlow's formula (ASME B31.x hoop stress)",
      trustTier: "validated",
      flags: [],
    };
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/calcs/barlow.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/calcs/mechanical/barlow.ts tests/calcs/barlow.test.ts
git commit -m "feat(calcs): add Barlow wall thickness (Tier 3, standard-cited)"
```

---

### Task 13: Pipeline transit time (Tier 2, flow) + sanity flag wiring

Implements the engine behind example input #2 (chemical/fluid transit time). The brain (Sub-project 2) aggregates phase flowrates into `flowrate`; the core takes total volumetric flow + geometry. Also wires the velocity sanity check into a `CalcResult.flags`.

**Files:**
- Create: `src/calcs/flow/transitTime.ts`
- Test: `tests/calcs/transitTime.test.ts`

- [ ] **Step 1: Write the failing test `tests/calcs/transitTime.test.ts`**

```ts
import { describe, it, expect } from "vitest";
import { transitTime } from "../../src/calcs/flow/transitTime";

describe("transitTime", () => {
  // D=0.1 m → A=0.0078539816 m²; Q=0.01 m³/s → v≈1.273 m/s; t=300/v≈235.6 s
  it("computes transit time t = L·A/Q", () => {
    const res = transitTime.run({
      inputs: {
        flowrate: { value: 0.01, unit: "m^3/s" },
        diameter: { value: 0.1, unit: "m" },
        distance: { value: 300, unit: "m" },
      },
    });
    expect(res.result.unit).toBe("s");
    expect(res.result.value).toBeCloseTo(235.6, 1);
    expect(res.flags.length).toBe(0); // ~1.27 m/s is below the guideline
  });

  it("raises a velocity sanity flag at high flow", () => {
    const res = transitTime.run({
      inputs: {
        flowrate: { value: 0.4, unit: "m^3/s" }, // v≈50.9 m/s
        diameter: { value: 0.1, unit: "m" },
        distance: { value: 300, unit: "m" },
      },
    });
    expect(res.flags.some((f) => f.severity === "warn")).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/calcs/transitTime.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `src/calcs/flow/transitTime.ts`**

```ts
import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";
import { checkMaxVelocity } from "../../core/sanity";

/**
 * Time for fluid to travel a distance L through a pipe of inside diameter D
 * at total volumetric flowrate Q (at line conditions):
 *   A = π·D²/4 ;  v = Q/A ;  t = L/v = L·A/Q
 */
export const transitTime: Calc = {
  id: "transitTime",
  name: "Pipeline transit time",
  requiredInputs: [
    { name: "flowrate", exampleUnit: "m^3/s" },
    { name: "diameter", exampleUnit: "m" },
    { name: "distance", exampleUnit: "m" },
  ],
  run(input: CalcInput): CalcResult {
    const Q = convert(input.inputs.flowrate.value, input.inputs.flowrate.unit, "m^3/s");
    const D = convert(input.inputs.diameter.value, input.inputs.diameter.unit, "m");
    const L = convert(input.inputs.distance.value, input.inputs.distance.unit, "m");
    const A = (Math.PI * D * D) / 4;
    const v = Q / A;
    const t = L / v;
    const velocityFlag = checkMaxVelocity({ value: v, unit: "m/s" });
    return {
      result: { value: t, unit: "s" },
      formula: "t = L·A/Q,  A = π·D²/4,  v = Q/A",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        { label: "Cross-sectional area", expression: `A = π·(${D} m)²/4`, result: { value: A, unit: "m^2" } },
        { label: "Velocity", expression: `v = ${Q}/${A}`, result: { value: v, unit: "m/s" } },
        { label: "Transit time", expression: `t = ${L}/${v}`, result: { value: t, unit: "s" } },
      ],
      method: "Plug-flow transit time",
      trustTier: "computed",
      flags: velocityFlag ? [velocityFlag] : [],
    };
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/calcs/transitTime.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/calcs/flow/transitTime.ts tests/calcs/transitTime.test.ts
git commit -m "feat(calcs): add pipeline transit time with velocity sanity flag"
```

---

### Task 14: Public API surface + full test run

**Files:**
- Modify: `src/index.ts`

- [ ] **Step 1: Replace `src/index.ts` with the public exports**

```ts
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
```

- [ ] **Step 2: Run the full test suite**

Run: `npm test`
Expected: PASS — all test files green (units, format, assumptions, sanity, and the six calc tests).

- [ ] **Step 3: Typecheck and build**

Run: `npm run typecheck && npm run build`
Expected: typecheck passes; `dist/index.js` and `dist/index.d.ts` are produced.

- [ ] **Step 4: Commit**

```bash
git add src/index.ts
git commit -m "feat(core): expose public API and calc registry"
```

---

## Self-Review

**1. Spec coverage (against the v1 design doc, Sub-project 1 scope):**
- Units engine extending an existing library (mathjs) + oilfield units → Tasks 3–4 ✅
- Tier 2 standard formulas → cylinder volume, Reynolds, Darcy-Weisbach, transit time (Tasks 8–10, 13) ✅
- Tier 3 curated standard-cited calc → Barlow (Task 12) ✅
- Fluid/material property correlation → API↔SG (Task 11) ✅
- Editable assumptions + standard conditions → Task 6, used by Barlow (Task 12) ✅
- Sig-figs → Task 5 ✅
- Sanity checks → Task 7, wired into transit time (Task 13) ✅
- Method choice → Darcy-Weisbach (Task 10) ✅
- Pure unit-aware `Calc` interface (so later goal-seek/sliders/batch wrap it) → Task 2, used throughout ✅
- *Deferred to later plans (calc breadth):* reservoir/drilling/electrical calcs, PSV/separator/Cv/NPSH/orifice, full Hazen-Williams, gas Z-factor & viscosity correlations. Explicitly noted in the scope note — not gaps. ✅

**2. Placeholder scan:** No TBD/TODO/"handle edge cases" — every code step contains complete code. ✅

**3. Type consistency:** `Calc`, `CalcInput`, `CalcResult`, `Quantity`, `Assumption`, `SanityFlag` defined in Task 2 and used with identical signatures in Tasks 8–14. `convert(value, from, to)` signature consistent across all calcs. `mergeAssumptions(base, overrides)` defined in Task 6, used in Task 12. `checkMaxVelocity(velocity, limit?)` defined Task 7, used Task 13. ✅
