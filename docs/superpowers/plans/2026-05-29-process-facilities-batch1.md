# Process/Facilities Calc Batch 1 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 8 high-frequency process/facilities calcs (line velocity, Colebrook friction factor, pump power, NPSHa, separator sizing, vessel volume, gas properties, erosional velocity) to the deterministic core, each a pure `Calc` with hand-computed + benchmark-validated tests.

**Architecture:** Every calc is a new pure `Calc` returning the existing `CalcResult` shape and registered in `CALC_REGISTRY`. No framework changes; each calc adds input-domain guards (throw on non-physical inputs rather than returning Infinity/NaN). Inputs are normalized through the existing `convert()`.

**Tech Stack:** TypeScript, `mathjs`, `vitest`. Existing repo at `/Users/albert/Claude Projects/oilgas-calc-app`.

**Run tests with:** `npm_config_cache=/tmp/npm-cache-albert npx vitest run <file>` (cache flag avoids an npm permissions issue on this machine).

---

## File Structure

```
src/calcs/
  flow/lineVelocity.ts            # NEW
  flow/colebrook.ts               # NEW
  flow/erosionalVelocity.ts       # NEW
  mechanical/pumpPower.ts         # NEW
  mechanical/npsh.ts              # NEW
  process/separatorSizing.ts      # NEW (new dir)
  geometry/vesselVolume.ts        # NEW
  properties/gasProperties.ts     # NEW
tests/calcs/                      # one *.test.ts per calc
src/index.ts                      # MODIFY: export + register the 8 calcs
```

All calcs import types from `../../core/types` and `convert` from `../../units/convert`. Calcs with tunable constants import `mergeAssumptions` from `../../core/assumptions`.

---

### Task 1: Line velocity

**Files:** Create `src/calcs/flow/lineVelocity.ts`, `tests/calcs/lineVelocity.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { lineVelocity } from "../../src/calcs/flow/lineVelocity";

describe("lineVelocity", () => {
  it("computes v = Q/A for Q=0.05 m^3/s, D=0.2 m", () => {
    const res = lineVelocity.run({
      inputs: { flowrate: { value: 0.05, unit: "m^3/s" }, diameter: { value: 0.2, unit: "m" } },
    });
    expect(res.result.unit).toBe("m/s");
    expect(res.result.value).toBeCloseTo(1.5915, 3);
    expect(res.trustTier).toBe("computed");
  });

  it("throws on zero diameter", () => {
    expect(() =>
      lineVelocity.run({ inputs: { flowrate: { value: 1, unit: "m^3/s" }, diameter: { value: 0, unit: "m" } } }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run test, verify FAIL** — `npm_config_cache=/tmp/npm-cache-albert npx vitest run tests/calcs/lineVelocity.test.ts` → module not found.

- [ ] **Step 3: Implement**

```ts
import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";

export const lineVelocity: Calc = {
  id: "lineVelocity",
  name: "Pipe line velocity",
  requiredInputs: [
    { name: "flowrate", exampleUnit: "m^3/s" },
    { name: "diameter", exampleUnit: "m" },
  ],
  run(input: CalcInput): CalcResult {
    const Q = convert(input.inputs.flowrate.value, input.inputs.flowrate.unit, "m^3/s");
    const D = convert(input.inputs.diameter.value, input.inputs.diameter.unit, "m");
    if (!(D > 0)) throw new Error("diameter must be > 0");
    if (Q < 0) throw new Error("flowrate must be >= 0");
    const A = (Math.PI * D * D) / 4;
    const v = Q / A;
    return {
      result: { value: v, unit: "m/s" },
      formula: "v = Q/A,  A = π·D²/4",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        { label: "Cross-sectional area", expression: `A = π·(${D} m)²/4`, result: { value: A, unit: "m^2" } },
        { label: "Velocity", expression: `v = ${Q}/${A}`, result: { value: v, unit: "m/s" } },
      ],
      method: "Continuity (Q = v·A)",
      trustTier: "computed",
      flags: [],
    };
  },
};
```

- [ ] **Step 4: Run test, verify PASS** (2 tests).
- [ ] **Step 5: Commit** — `git add -A && git commit -m "feat(calcs): add line velocity"`

---

### Task 2: Colebrook friction factor

**Files:** Create `src/calcs/flow/colebrook.ts`, `tests/calcs/colebrook.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { colebrookFrictionFactor } from "../../src/calcs/flow/colebrook";

describe("colebrookFrictionFactor", () => {
  it("matches a Moody-chart point: Re=1e5, eps/D=1e-4 -> f≈0.0185", () => {
    const res = colebrookFrictionFactor.run({
      inputs: { reynolds: { value: 1e5, unit: "" }, relativeRoughness: { value: 1e-4, unit: "" } },
    });
    expect(res.result.value).toBeCloseTo(0.0185, 3);
    expect(res.result.unit).toBe("");
  });

  it("uses laminar f=64/Re below Re=2300", () => {
    const res = colebrookFrictionFactor.run({
      inputs: { reynolds: { value: 1000, unit: "" }, relativeRoughness: { value: 1e-4, unit: "" } },
    });
    expect(res.result.value).toBeCloseTo(0.064, 5);
    expect(res.method).toContain("Laminar");
  });

  it("throws on non-positive Reynolds number", () => {
    expect(() =>
      colebrookFrictionFactor.run({ inputs: { reynolds: { value: 0, unit: "" }, relativeRoughness: { value: 1e-4, unit: "" } } }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run test, verify FAIL.**

- [ ] **Step 3: Implement**

```ts
import type { Calc, CalcInput, CalcResult } from "../../core/types";

export const colebrookFrictionFactor: Calc = {
  id: "colebrookFrictionFactor",
  name: "Darcy friction factor (Colebrook)",
  requiredInputs: [
    { name: "reynolds", exampleUnit: "" },
    { name: "relativeRoughness", exampleUnit: "" },
  ],
  run(input: CalcInput): CalcResult {
    const Re = input.inputs.reynolds.value;
    const epsD = input.inputs.relativeRoughness.value;
    if (!(Re > 0)) throw new Error("Reynolds number must be > 0");
    if (epsD < 0) throw new Error("relative roughness must be >= 0");

    if (Re < 2300) {
      const f = 64 / Re;
      return {
        result: { value: f, unit: "" },
        formula: "f = 64/Re (laminar)",
        inputs: input.inputs,
        assumptions: [],
        steps: [{ label: "Laminar regime", expression: `f = 64/${Re}`, result: { value: f, unit: "" } }],
        method: "Laminar (Re < 2300)",
        trustTier: "computed",
        flags: [],
      };
    }

    // Swamee-Jain explicit estimate as the seed.
    let f = 0.25 / Math.pow(Math.log10(epsD / 3.7 + 5.74 / Math.pow(Re, 0.9)), 2);
    // Fixed-point iteration of the implicit Colebrook equation.
    for (let i = 0; i < 50; i++) {
      const rhs = -2 * Math.log10(epsD / 3.7 + 2.51 / (Re * Math.sqrt(f)));
      const fNew = 1 / (rhs * rhs);
      if (Math.abs(fNew - f) < 1e-8) {
        f = fNew;
        break;
      }
      f = fNew;
    }
    return {
      result: { value: f, unit: "" },
      formula: "1/√f = −2·log₁₀( ε/(3.7·D) + 2.51/(Re·√f) )",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        { label: "Seed (Swamee-Jain)", expression: "f₀ = 0.25 / [log₁₀(ε/3.7D + 5.74/Re^0.9)]²" },
        { label: "Iterate Colebrook to |Δf| < 1e-8", expression: "f", result: { value: f, unit: "" } },
      ],
      method: "Colebrook-White (iterative)",
      trustTier: "computed",
      flags: [],
    };
  },
};
```

- [ ] **Step 4: Run test, verify PASS** (3 tests).
- [ ] **Step 5: Commit** — `feat(calcs): add Colebrook friction factor`

---

### Task 3: Pump power & head

**Files:** Create `src/calcs/mechanical/pumpPower.ts`, `tests/calcs/pumpPower.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { pumpPower } from "../../src/calcs/mechanical/pumpPower";

describe("pumpPower", () => {
  it("computes hydraulic & brake power (Q=0.05, H=50 m, ρ=1000, η=0.70)", () => {
    const res = pumpPower.run({
      inputs: {
        flowrate: { value: 0.05, unit: "m^3/s" },
        head: { value: 50, unit: "m" },
        density: { value: 1000, unit: "kg/m^3" },
      },
    });
    expect(res.result.unit).toBe("W");
    expect(res.result.value).toBeCloseTo(24516.6, 0); // hydraulic power
    const brake = res.steps.find((s) => s.label.includes("Brake"));
    expect(brake?.result?.value).toBeCloseTo(35023.8, 0);
  });

  it("derives head from differential pressure", () => {
    const res = pumpPower.run({
      inputs: {
        flowrate: { value: 0.05, unit: "m^3/s" },
        differentialPressure: { value: 490332.5, unit: "Pa" }, // ρgH for H=50, ρ=1000
        density: { value: 1000, unit: "kg/m^3" },
      },
    });
    expect(res.result.value).toBeCloseTo(24516.6, 0);
  });

  it("throws on non-positive density", () => {
    expect(() =>
      pumpPower.run({ inputs: { flowrate: { value: 1, unit: "m^3/s" }, head: { value: 1, unit: "m" }, density: { value: 0, unit: "kg/m^3" } } }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run test, verify FAIL.**

- [ ] **Step 3: Implement**

```ts
import type { Calc, CalcInput, CalcResult, Assumption } from "../../core/types";
import { convert } from "../../units/convert";
import { mergeAssumptions } from "../../core/assumptions";

const BASE: Assumption[] = [
  { key: "g", label: "Gravitational acceleration", value: { value: 9.80665, unit: "m/s^2" }, source: "Standard gravity" },
  { key: "efficiency", label: "Pump efficiency", value: { value: 0.7, unit: "" }, source: "Typical centrifugal pump" },
];

export const pumpPower: Calc = {
  id: "pumpPower",
  name: "Pump power & head",
  requiredInputs: [
    { name: "flowrate", exampleUnit: "m^3/s" },
    { name: "head", exampleUnit: "m" },
    { name: "density", exampleUnit: "kg/m^3" },
  ],
  run(input: CalcInput): CalcResult {
    const assumptions = mergeAssumptions(BASE, input.assumptionOverrides);
    const g = assumptions.find((a) => a.key === "g")!.value.value;
    const eta = assumptions.find((a) => a.key === "efficiency")!.value.value;
    const Q = convert(input.inputs.flowrate.value, input.inputs.flowrate.unit, "m^3/s");
    const rho = convert(input.inputs.density.value, input.inputs.density.unit, "kg/m^3");
    if (!(rho > 0)) throw new Error("density must be > 0");
    if (Q < 0) throw new Error("flowrate must be >= 0");
    if (!(eta > 0 && eta <= 1)) throw new Error("efficiency must be in (0, 1]");

    let H: number;
    if (input.inputs.head) {
      H = convert(input.inputs.head.value, input.inputs.head.unit, "m");
    } else if (input.inputs.differentialPressure) {
      const dP = convert(input.inputs.differentialPressure.value, input.inputs.differentialPressure.unit, "Pa");
      H = dP / (rho * g);
    } else {
      throw new Error("provide either head or differentialPressure");
    }

    const Phyd = rho * g * Q * H;
    const Pbrake = Phyd / eta;
    return {
      result: { value: Phyd, unit: "W" },
      formula: "P_hyd = ρ·g·Q·H ;  P_brake = P_hyd/η",
      inputs: input.inputs,
      assumptions,
      steps: [
        { label: "Head", expression: `H = ${H} m` },
        { label: "Hydraulic power", expression: `P_hyd = ${rho}·${g}·${Q}·${H}`, result: { value: Phyd, unit: "W" } },
        { label: "Brake power", expression: `P_brake = P_hyd/${eta}`, result: { value: Pbrake, unit: "W" } },
      ],
      method: "Hydraulic power",
      trustTier: "computed",
      flags: [],
    };
  },
};
```

- [ ] **Step 4: Run test, verify PASS** (3 tests).
- [ ] **Step 5: Commit** — `feat(calcs): add pump power & head`

---

### Task 4: NPSH available

**Files:** Create `src/calcs/mechanical/npsh.ts`, `tests/calcs/npsh.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { npshAvailable } from "../../src/calcs/mechanical/npsh";

describe("npshAvailable", () => {
  it("computes NPSHa = (P_s − P_v)/(ρg) + z_s − h_f", () => {
    const res = npshAvailable.run({
      inputs: {
        suctionPressure: { value: 101325, unit: "Pa" },
        vaporPressure: { value: 2339, unit: "Pa" },
        density: { value: 998, unit: "kg/m^3" },
        staticHead: { value: 2, unit: "m" },
        frictionLoss: { value: 0.5, unit: "m" },
      },
    });
    expect(res.result.unit).toBe("m");
    expect(res.result.value).toBeCloseTo(11.615, 2);
  });

  it("throws on non-positive density", () => {
    expect(() =>
      npshAvailable.run({
        inputs: {
          suctionPressure: { value: 101325, unit: "Pa" },
          vaporPressure: { value: 2339, unit: "Pa" },
          density: { value: 0, unit: "kg/m^3" },
          staticHead: { value: 2, unit: "m" },
          frictionLoss: { value: 0.5, unit: "m" },
        },
      }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run test, verify FAIL.**

- [ ] **Step 3: Implement**

```ts
import type { Calc, CalcInput, CalcResult, Assumption } from "../../core/types";
import { convert } from "../../units/convert";
import { mergeAssumptions } from "../../core/assumptions";

const BASE: Assumption[] = [
  { key: "g", label: "Gravitational acceleration", value: { value: 9.80665, unit: "m/s^2" }, source: "Standard gravity" },
];

export const npshAvailable: Calc = {
  id: "npshAvailable",
  name: "NPSH available",
  requiredInputs: [
    { name: "suctionPressure", exampleUnit: "Pa" },
    { name: "vaporPressure", exampleUnit: "Pa" },
    { name: "density", exampleUnit: "kg/m^3" },
    { name: "staticHead", exampleUnit: "m" },
    { name: "frictionLoss", exampleUnit: "m" },
  ],
  run(input: CalcInput): CalcResult {
    const assumptions = mergeAssumptions(BASE, input.assumptionOverrides);
    const g = assumptions.find((a) => a.key === "g")!.value.value;
    const Ps = convert(input.inputs.suctionPressure.value, input.inputs.suctionPressure.unit, "Pa");
    const Pv = convert(input.inputs.vaporPressure.value, input.inputs.vaporPressure.unit, "Pa");
    const rho = convert(input.inputs.density.value, input.inputs.density.unit, "kg/m^3");
    const zs = convert(input.inputs.staticHead.value, input.inputs.staticHead.unit, "m");
    const hf = convert(input.inputs.frictionLoss.value, input.inputs.frictionLoss.unit, "m");
    if (!(rho > 0)) throw new Error("density must be > 0");
    const npsha = (Ps - Pv) / (rho * g) + zs - hf;
    return {
      result: { value: npsha, unit: "m" },
      formula: "NPSHa = (P_s − P_v)/(ρ·g) + z_s − h_f",
      inputs: input.inputs,
      assumptions,
      steps: [
        { label: "Pressure head", expression: `(${Ps} − ${Pv})/(${rho}·${g})`, result: { value: (Ps - Pv) / (rho * g), unit: "m" } },
        { label: "Add static head, subtract friction", expression: `+ ${zs} − ${hf}`, result: { value: npsha, unit: "m" } },
      ],
      method: "NPSH available",
      trustTier: "computed",
      flags: [],
    };
  },
};
```

- [ ] **Step 4: Run test, verify PASS** (2 tests).
- [ ] **Step 5: Commit** — `feat(calcs): add NPSH available`

---

### Task 5: Separator sizing (Souders-Brown)

**Files:** Create `src/calcs/process/separatorSizing.ts`, `tests/calcs/separatorSizing.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { separatorSizing } from "../../src/calcs/process/separatorSizing";

describe("separatorSizing", () => {
  it("Souders-Brown: K=0.107, ρL=800, ρg=20, Qg=0.5 → D≈0.976 m", () => {
    const res = separatorSizing.run({
      inputs: {
        liquidDensity: { value: 800, unit: "kg/m^3" },
        gasDensity: { value: 20, unit: "kg/m^3" },
        gasFlowrate: { value: 0.5, unit: "m^3/s" },
      },
    });
    expect(res.result.unit).toBe("m");
    expect(res.result.value).toBeCloseTo(0.976, 3);
    expect(res.trustTier).toBe("validated");
    expect(res.reference).toContain("Souders");
    const vmax = res.steps.find((s) => s.label.includes("vapour"));
    expect(vmax?.result?.value).toBeCloseTo(0.6682, 3);
  });

  it("throws when gas density >= liquid density", () => {
    expect(() =>
      separatorSizing.run({
        inputs: {
          liquidDensity: { value: 20, unit: "kg/m^3" },
          gasDensity: { value: 20, unit: "kg/m^3" },
          gasFlowrate: { value: 0.5, unit: "m^3/s" },
        },
      }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run test, verify FAIL.**

- [ ] **Step 3: Implement**

```ts
import type { Calc, CalcInput, CalcResult, Assumption } from "../../core/types";
import { convert } from "../../units/convert";
import { mergeAssumptions } from "../../core/assumptions";

const BASE: Assumption[] = [
  { key: "K", label: "Souders-Brown coefficient", value: { value: 0.107, unit: "m/s" }, source: "GPSA typical vertical separator (≈0.35 ft/s)" },
];

export const separatorSizing: Calc = {
  id: "separatorSizing",
  name: "Gas-liquid separator sizing",
  requiredInputs: [
    { name: "liquidDensity", exampleUnit: "kg/m^3" },
    { name: "gasDensity", exampleUnit: "kg/m^3" },
    { name: "gasFlowrate", exampleUnit: "m^3/s" },
  ],
  run(input: CalcInput): CalcResult {
    const assumptions = mergeAssumptions(BASE, input.assumptionOverrides);
    const K = assumptions.find((a) => a.key === "K")!.value.value;
    const rhoL = convert(input.inputs.liquidDensity.value, input.inputs.liquidDensity.unit, "kg/m^3");
    const rhoG = convert(input.inputs.gasDensity.value, input.inputs.gasDensity.unit, "kg/m^3");
    const Qg = convert(input.inputs.gasFlowrate.value, input.inputs.gasFlowrate.unit, "m^3/s");
    if (!(rhoG > 0)) throw new Error("gas density must be > 0");
    if (!(rhoL > rhoG)) throw new Error("liquid density must exceed gas density");
    if (Qg < 0) throw new Error("gas flowrate must be >= 0");

    const vMax = K * Math.sqrt((rhoL - rhoG) / rhoG);
    const A = Qg / vMax;
    const D = Math.sqrt((4 * A) / Math.PI);
    return {
      result: { value: D, unit: "m" },
      formula: "v_max = K·√((ρ_L−ρ_g)/ρ_g) ;  A = Q_g/v_max ;  D = √(4A/π)",
      inputs: input.inputs,
      assumptions,
      steps: [
        { label: "Max vapour velocity", expression: `v_max = ${K}·√((${rhoL}−${rhoG})/${rhoG})`, result: { value: vMax, unit: "m/s" } },
        { label: "Required gas area", expression: `A = ${Qg}/${vMax}`, result: { value: A, unit: "m^2" } },
        { label: "Minimum vessel ID", expression: `D = √(4·${A}/π)`, result: { value: D, unit: "m" } },
      ],
      method: "Souders-Brown",
      reference: "Souders-Brown / GPSA Engineering Data Book (separator sizing)",
      trustTier: "validated",
      flags: [],
    };
  },
};
```

- [ ] **Step 4: Run test, verify PASS** (2 tests).
- [ ] **Step 5: Commit** — `feat(calcs): add gas-liquid separator sizing (Souders-Brown)`

---

### Task 6: Vessel/tank volume

**Files:** Create `src/calcs/geometry/vesselVolume.ts`, `tests/calcs/vesselVolume.test.ts`

Head type is selected via `CalcInput.method` ("cylinder" default, or "2:1elliptical").

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { vesselVolume } from "../../src/calcs/geometry/vesselVolume";

describe("vesselVolume", () => {
  it("plain cylinder D=2 m, L=5 m → 15.708 m³", () => {
    const res = vesselVolume.run({
      inputs: { diameter: { value: 2, unit: "m" }, length: { value: 5, unit: "m" } },
    });
    expect(res.result.unit).toBe("m^3");
    expect(res.result.value).toBeCloseTo(15.708, 3);
  });

  it("adds 2:1 elliptical heads → 17.80 m³", () => {
    const res = vesselVolume.run({
      inputs: { diameter: { value: 2, unit: "m" }, length: { value: 5, unit: "m" } },
      method: "2:1elliptical",
    });
    expect(res.result.value).toBeCloseTo(17.802, 2);
    expect(res.method).toContain("2:1");
  });

  it("throws on unknown head type", () => {
    expect(() =>
      vesselVolume.run({ inputs: { diameter: { value: 2, unit: "m" }, length: { value: 5, unit: "m" } }, method: "spherical" }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run test, verify FAIL.**

- [ ] **Step 3: Implement**

```ts
import type { Calc, CalcInput, CalcResult } from "../../core/types";
import { convert } from "../../units/convert";

const KNOWN_HEADS = ["cylinder", "2:1elliptical"];

export const vesselVolume: Calc = {
  id: "vesselVolume",
  name: "Vessel / tank volume",
  requiredInputs: [
    { name: "diameter", exampleUnit: "m" },
    { name: "length", exampleUnit: "m" },
  ],
  run(input: CalcInput): CalcResult {
    const mode = input.method ?? "cylinder";
    if (!KNOWN_HEADS.includes(mode)) throw new Error(`Unknown head type "${mode}". Known: ${KNOWN_HEADS.join(", ")}`);
    const D = convert(input.inputs.diameter.value, input.inputs.diameter.unit, "m");
    const L = convert(input.inputs.length.value, input.inputs.length.unit, "m");
    if (!(D > 0)) throw new Error("diameter must be > 0");
    if (L < 0) throw new Error("length must be >= 0");

    const vCyl = ((Math.PI * D * D) / 4) * L;
    const vHeads = mode === "2:1elliptical" ? (Math.PI * D * D * D) / 12 : 0;
    const V = vCyl + vHeads;
    const steps = [
      { label: "Cylinder shell", expression: `V_cyl = (π·${D}²/4)·${L}`, result: { value: vCyl, unit: "m^3" } },
    ];
    if (mode === "2:1elliptical")
      steps.push({ label: "Two 2:1 elliptical heads", expression: `V_heads = π·${D}³/12`, result: { value: vHeads, unit: "m^3" } });
    return {
      result: { value: V, unit: "m^3" },
      formula: mode === "2:1elliptical" ? "V = π·D²/4·L + π·D³/12" : "V = π·D²/4·L",
      inputs: input.inputs,
      assumptions: [],
      steps,
      method: mode === "2:1elliptical" ? "Cylinder + 2:1 elliptical heads" : "Plain cylinder",
      alternativeMethods: ["cylinder", "2:1elliptical"],
      trustTier: "computed",
      flags: [],
    };
  },
};
```

- [ ] **Step 4: Run test, verify PASS** (3 tests).
- [ ] **Step 5: Commit** — `feat(calcs): add vessel/tank volume`

---

### Task 7: Gas properties (MW, pseudo-criticals, Z via Dranchuk-Abou-Kassem, density)

**Files:** Create `src/calcs/properties/gasProperties.ts`, `tests/calcs/gasProperties.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { gasProperties } from "../../src/calcs/properties/gasProperties";

describe("gasProperties", () => {
  it("SG=0.65, 120 °F, 1000 psia → Z≈0.887, MW≈18.83", () => {
    const res = gasProperties.run({
      inputs: {
        gasSG: { value: 0.65, unit: "" },
        temperature: { value: 120, unit: "degF" },
        pressure: { value: 1000, unit: "psi" },
      },
    });
    expect(res.result.unit).toBe(""); // Z is the headline (dimensionless)
    expect(res.result.value).toBeCloseTo(0.887, 2);
    const mw = res.steps.find((s) => s.label.includes("Molecular weight"));
    expect(mw?.result?.value).toBeCloseTo(18.83, 2);
    const dens = res.steps.find((s) => s.label.includes("density"));
    expect(dens?.result?.value).toBeGreaterThan(50);
    expect(dens?.result?.value).toBeLessThan(58);
  });

  it("throws on non-positive SG", () => {
    expect(() =>
      gasProperties.run({
        inputs: { gasSG: { value: 0, unit: "" }, temperature: { value: 120, unit: "degF" }, pressure: { value: 1000, unit: "psi" } },
      }),
    ).toThrow();
  });
});
```

- [ ] **Step 2: Run test, verify FAIL.**

- [ ] **Step 3: Implement**

```ts
import type { Calc, CalcInput, CalcResult, SanityFlag } from "../../core/types";
import { convert } from "../../units/convert";

// Dranchuk-Abou-Kassem (1975) — solve Z by iterating on reduced density ρr.
function zFactorDAK(Tpr: number, Ppr: number): number {
  const A = [0.3265, -1.07, -0.5339, 0.01569, -0.05165, 0.5475, -0.7361, 0.1844, 0.1056, 0.6134, 0.721];
  let Z = 1.0;
  for (let i = 0; i < 100; i++) {
    const rhor = (0.27 * Ppr) / (Z * Tpr);
    const r2 = rhor * rhor;
    const Zc =
      1 +
      (A[0] + A[1] / Tpr + A[2] / Tpr ** 3 + A[3] / Tpr ** 4 + A[4] / Tpr ** 5) * rhor +
      (A[5] + A[6] / Tpr + A[7] / Tpr ** 2) * r2 -
      A[8] * (A[6] / Tpr + A[7] / Tpr ** 2) * rhor ** 5 +
      A[9] * (1 + A[10] * r2) * (r2 / Tpr ** 3) * Math.exp(-A[10] * r2);
    if (Math.abs(Zc - Z) < 1e-10) return Zc;
    Z = Zc;
  }
  return Z;
}

export const gasProperties: Calc = {
  id: "gasProperties",
  name: "Natural gas properties",
  requiredInputs: [
    { name: "gasSG", exampleUnit: "" },
    { name: "temperature", exampleUnit: "degF" },
    { name: "pressure", exampleUnit: "psi" },
  ],
  run(input: CalcInput): CalcResult {
    const SG = input.inputs.gasSG.value;
    if (!(SG > 0)) throw new Error("gas SG must be > 0");
    const Tk = convert(input.inputs.temperature.value, input.inputs.temperature.unit, "K");
    const Ppsia = convert(input.inputs.pressure.value, input.inputs.pressure.unit, "psi");
    if (!(Tk > 0)) throw new Error("temperature must be > 0");
    if (!(Ppsia > 0)) throw new Error("pressure must be > 0");

    const MW = 28.964 * SG; // air basis (g/mol = kg/kmol)
    // Sutton pseudo-criticals (°R, psia)
    const Tpc = 169.2 + 349.5 * SG - 74 * SG * SG; // °R
    const Ppc = 756.8 - 131.0 * SG - 3.6 * SG * SG; // psia
    const TR = Tk * 1.8; // K → °R
    const Tpr = TR / Tpc;
    const Ppr = Ppsia / Ppc;
    const Z = zFactorDAK(Tpr, Ppr);

    // Density in SI: ρ = P·MW / (Z·R·T)
    const Ppa = convert(Ppsia, "psi", "Pa");
    const R = 8314.46; // J/(kmol·K)
    const rho = (Ppa * MW) / (Z * R * Tk);

    const flags: SanityFlag[] = [];
    if (Tpr < 1.0 || Tpr > 3.0 || Ppr < 0.2 || Ppr > 30) {
      flags.push({ severity: "info", message: `Reduced conditions (Tpr=${Tpr.toFixed(2)}, Ppr=${Ppr.toFixed(2)}) are outside the DAK validity window; verify.`, reference: "Dranchuk-Abou-Kassem (1975)" });
    }

    return {
      result: { value: Z, unit: "" },
      formula: "Z = DAK(Tpr, Ppr) ;  Tpr = T/Tpc, Ppr = P/Ppc (Sutton)",
      inputs: input.inputs,
      assumptions: [],
      steps: [
        { label: "Molecular weight", expression: `MW = 28.964·${SG}`, result: { value: MW, unit: "g/mol" } },
        { label: "Pseudo-criticals (Sutton)", expression: `Tpc=${Tpc.toFixed(1)} °R, Ppc=${Ppc.toFixed(1)} psia` },
        { label: "Reduced", expression: `Tpr=${Tpr.toFixed(3)}, Ppr=${Ppr.toFixed(3)}` },
        { label: "Z-factor (DAK)", expression: "iterate ρr", result: { value: Z, unit: "" } },
        { label: "Gas density", expression: "ρ = P·MW/(Z·R·T)", result: { value: rho, unit: "kg/m^3" } },
      ],
      method: "Dranchuk-Abou-Kassem Z-factor; Sutton pseudo-criticals",
      reference: "Dranchuk-Abou-Kassem (1975); Sutton (1985)",
      trustTier: "computed",
      flags,
    };
  },
};
```

- [ ] **Step 4: Run test, verify PASS** (2 tests). If `Z` differs from 0.887 by more than the tolerance, do NOT change the expected value — recheck the DAK constants and the Sutton formulas against this task's code.
- [ ] **Step 5: Commit** — `feat(calcs): add natural gas properties (DAK Z-factor)`

---

### Task 8: Erosional velocity (API RP 14E)

**Files:** Create `src/calcs/flow/erosionalVelocity.ts`, `tests/calcs/erosionalVelocity.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { erosionalVelocity } from "../../src/calcs/flow/erosionalVelocity";

describe("erosionalVelocity", () => {
  it("API RP 14E: ρm=3 lb/ft³, C=100 → Ve≈17.6 m/s", () => {
    const res = erosionalVelocity.run({
      inputs: { mixtureDensity: { value: 3, unit: "lbm/ft^3" } },
    });
    expect(res.result.unit).toBe("m/s");
    expect(res.result.value).toBeCloseTo(17.6, 1);
    expect(res.trustTier).toBe("validated");
    expect(res.reference).toContain("14E");
    const fts = res.steps.find((s) => s.label.includes("ft/s"));
    expect(fts?.result?.value).toBeCloseTo(57.74, 1);
  });

  it("accepts SI mixture density and uses intermittent C=125 override", () => {
    const res = erosionalVelocity.run({
      inputs: { mixtureDensity: { value: 48.0554, unit: "kg/m^3" } }, // = 3 lb/ft³
      assumptionOverrides: { C: { value: 125, unit: "" } },
    });
    // Ve = 125/√3 ft/s = 72.17 ft/s = 22.0 m/s
    expect(res.result.value).toBeCloseTo(22.0, 1);
  });

  it("throws on non-positive density", () => {
    expect(() => erosionalVelocity.run({ inputs: { mixtureDensity: { value: 0, unit: "kg/m^3" } } })).toThrow();
  });
});
```

- [ ] **Step 2: Run test, verify FAIL.**

- [ ] **Step 3: Implement**

```ts
import type { Calc, CalcInput, CalcResult, Assumption } from "../../core/types";
import { convert } from "../../units/convert";
import { mergeAssumptions } from "../../core/assumptions";

const BASE: Assumption[] = [
  { key: "C", label: "Erosional constant", value: { value: 100, unit: "" }, source: "API RP 14E continuous service (use 125 intermittent)" },
];

export const erosionalVelocity: Calc = {
  id: "erosionalVelocity",
  name: "Erosional velocity (API RP 14E)",
  requiredInputs: [{ name: "mixtureDensity", exampleUnit: "kg/m^3" }],
  run(input: CalcInput): CalcResult {
    const assumptions = mergeAssumptions(BASE, input.assumptionOverrides);
    const C = assumptions.find((a) => a.key === "C")!.value.value;
    const rhoSI = convert(input.inputs.mixtureDensity.value, input.inputs.mixtureDensity.unit, "kg/m^3");
    if (!(rhoSI > 0)) throw new Error("mixture density must be > 0");
    const rhoLb = convert(rhoSI, "kg/m^3", "lbm/ft^3");
    const veFts = C / Math.sqrt(rhoLb); // ft/s
    const veMs = convert(veFts, "ft/s", "m/s");
    return {
      result: { value: veMs, unit: "m/s" },
      formula: "Ve = C/√ρ_m  (ρ in lb/ft³, Ve in ft/s)",
      inputs: input.inputs,
      assumptions,
      steps: [
        { label: "Mixture density (field units)", expression: `ρ_m = ${rhoLb} lb/ft³` },
        { label: "Erosional velocity (ft/s)", expression: `Ve = ${C}/√${rhoLb}`, result: { value: veFts, unit: "ft/s" } },
        { label: "Convert to SI", expression: `Ve = ${veFts} ft/s`, result: { value: veMs, unit: "m/s" } },
      ],
      method: "API RP 14E erosional velocity",
      reference: "API RP 14E §2.5 (erosional velocity)",
      trustTier: "validated",
      flags: [],
    };
  },
};
```

- [ ] **Step 4: Run test, verify PASS** (3 tests).
- [ ] **Step 5: Commit** — `feat(calcs): add erosional velocity (API RP 14E)`

---

### Task 9: Export + register all 8 calcs; full suite + build

**Files:** Modify `src/index.ts`

- [ ] **Step 1: Add exports + registry entries**

Add these export lines alongside the existing calc exports:

```ts
export { lineVelocity } from "./calcs/flow/lineVelocity";
export { colebrookFrictionFactor } from "./calcs/flow/colebrook";
export { erosionalVelocity } from "./calcs/flow/erosionalVelocity";
export { pumpPower } from "./calcs/mechanical/pumpPower";
export { npshAvailable } from "./calcs/mechanical/npsh";
export { separatorSizing } from "./calcs/process/separatorSizing";
export { vesselVolume } from "./calcs/geometry/vesselVolume";
export { gasProperties } from "./calcs/properties/gasProperties";
```

Add matching imports near the other registry imports, then extend `CALC_REGISTRY` with the 6 that are `Calc` objects (all 8 here are `Calc` objects):

```ts
import { lineVelocity } from "./calcs/flow/lineVelocity";
import { colebrookFrictionFactor } from "./calcs/flow/colebrook";
import { erosionalVelocity } from "./calcs/flow/erosionalVelocity";
import { pumpPower } from "./calcs/mechanical/pumpPower";
import { npshAvailable } from "./calcs/mechanical/npsh";
import { separatorSizing } from "./calcs/process/separatorSizing";
import { vesselVolume } from "./calcs/geometry/vesselVolume";
import { gasProperties } from "./calcs/properties/gasProperties";
```

Extend the `CALC_REGISTRY` object literal with:

```ts
  [lineVelocity.id]: lineVelocity,
  [colebrookFrictionFactor.id]: colebrookFrictionFactor,
  [erosionalVelocity.id]: erosionalVelocity,
  [pumpPower.id]: pumpPower,
  [npshAvailable.id]: npshAvailable,
  [separatorSizing.id]: separatorSizing,
  [vesselVolume.id]: vesselVolume,
  [gasProperties.id]: gasProperties,
```

- [ ] **Step 2: Run the full suite** — `npm_config_cache=/tmp/npm-cache-albert npm test`
Expected: all prior 29 tests + the new tests pass (≈49 total).

- [ ] **Step 3: Typecheck and build** — `npm run typecheck && npm_config_cache=/tmp/npm-cache-albert npm run build`
Expected: clean typecheck; `dist/index.js` + `dist/index.d.ts` produced.

- [ ] **Step 4: Commit** — `feat(core): export and register Batch 1 process/facilities calcs`

---

## Self-Review

**1. Spec coverage:** All 8 spec calcs have tasks — line velocity (T1), Colebrook (T2), pump power (T3), NPSHa (T4), separator (T5), vessel volume (T6), gas properties (T7), erosional velocity (T8); registry/exports (T9). Input-domain guards present in every calc. Validation: each calc has a hand-computed benchmark test; separator/erosional/gas-Z carry standard references and benchmark values (GPSA, API RP 14E, Standing-Katz/DAK). Unit-flexibility tests included (erosional accepts lbm/ft³ and kg/m³; gas props takes degF/psi). ✅

**2. Placeholder scan:** No TBD/TODO; every code step contains complete code. ✅

**3. Type consistency:** All calcs implement the existing `Calc`/`CalcResult`/`CalcInput` contract with matching field names. `convert(value, from, to)` signature consistent. `mergeAssumptions(base, overrides)` used identically to the core. Head-type and friction-method selection use `CalcInput.method` (string), consistent with `darcyWeisbach`/`barlow` patterns. Registry keys use each calc's `.id`. ✅

**Benchmark values are hand-verified in the spec:** line v=1.5915; Colebrook f≈0.0185; pump 24516.6 W / 35023.8 W; NPSHa=11.615 m; separator v_max=0.6682, D=0.976 m; vessel 15.708 / 17.802 m³; erosional 57.74 ft/s / 17.6 m/s. Gas-Z (DAK) ≈0.887 is asserted at precision 2 to absorb iteration rounding.
