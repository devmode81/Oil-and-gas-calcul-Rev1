# Process/Facilities Calc Batch 1 — Design

**Date:** 2026-05-29
**Status:** Approved (brainstorming) — ready for implementation planning
**Depends on:** the Deterministic Core (`Calc`/`CalcResult` contract, units engine, assumptions, sanity, sig-figs) already built and on GitHub.

---

## 1. Context & purpose

The deterministic core proved the framework with 6 vertical-slice calcs. This is **Batch 1 of the discipline-breadth program** — the first "deep" batch, covering high-frequency **process/facilities** calcs. It exists to turn the engine from a proof into a genuinely useful day-to-day tool for process/facilities engineers, while keeping the trust guarantees intact.

This is one batch in a planned sequence (Process → Drilling → Reservoir → Subsea/Flow-Assurance → Mechanical → Electrical → EHS/Process-Safety). Each batch is its own spec → plan → validated build, plugging into the same `Calc` contract.

**Scope discipline:** Batch 1 is the 8 simpler, high-frequency calcs. The heavy standard-sizing calcs (PSV, fire-case relief, Cv, orifice) are deferred to a follow-on Process batch.

---

## 2. Architecture

No framework changes. Every calc is a new pure `Calc` implementation returning the existing `CalcResult` shape (result, formula, inputs, assumptions, steps, method, trust tier, sanity flags), registered in `CALC_REGISTRY`.

**One small framework addition: input-domain guards.** Each calc validates its inputs and throws a clear `Error` (not `Infinity`/`NaN`) on non-physical values (zero diameter, zero/negative density, negative flow, etc.). This implements part of the previously-flagged follow-up and protects the future goal-seek/batch layer from degenerate sweeps.

**File structure** (following existing convention; each calc + parallel test file):
```
src/calcs/
  flow/
    lineVelocity.ts            # NEW
    colebrook.ts               # NEW (friction factor)
    erosionalVelocity.ts       # NEW (API RP 14E)
  mechanical/
    pumpPower.ts               # NEW
    npsh.ts                    # NEW
  process/                     # NEW directory
    separatorSizing.ts         # NEW (Souders-Brown)
  geometry/
    vesselVolume.ts            # NEW
  properties/
    gasProperties.ts           # NEW (MW, pseudo-criticals, Z via DAK, density)
tests/calcs/...                # one test file per calc
```
`src/index.ts` re-exports each new calc and adds it to `CALC_REGISTRY`.

---

## 3. The 8 calcs

Units shown are the canonical internal units; every input is normalized via `convert()` so callers may pass any compatible unit.

### 3.1 Line velocity — `lineVelocity` (Tier: computed)
- **Formula:** `A = π·D²/4 ; v = Q/A`
- **Inputs:** `flowrate` (m³/s), `diameter` (m, pipe ID)
- **Output:** velocity (m/s)
- **Guards:** D > 0, Q ≥ 0
- **Benchmark (hand):** Q=0.05 m³/s, D=0.2 m → A=0.031416 m², **v=1.5915 m/s**

### 3.2 Colebrook friction factor — `colebrookFrictionFactor` (Tier: computed)
- **Formula (implicit, solved iteratively):** `1/√f = −2·log₁₀( ε/(3.7·D) + 2.51/(Re·√f) )`
- **Inputs:** `reynolds` (dimensionless), `relativeRoughness` ε/D (dimensionless) — or `roughness` ε (m) + `diameter` (m)
- **Output:** Darcy friction factor f (dimensionless)
- **Method:** fixed-point iteration seeded with the Swamee-Jain explicit estimate; iterate to |Δf| < 1e-8 (cap ~50 iterations)
- **Guards:** Re > 0; if Re < 2300, return laminar `f = 64/Re` with a step noting the laminar regime
- **Benchmark (Moody point):** Re=1e5, ε/D=1e-4 → **f ≈ 0.0185**

### 3.3 Pump power & head — `pumpPower` (Tier: computed)
- **Formula:** `P_hydraulic = ρ·g·Q·H ; P_brake = P_hydraulic / η`. Head from differential pressure if given: `H = ΔP/(ρ·g)`.
- **Inputs:** `flowrate` (m³/s), `head` (m) *or* `differentialPressure` (Pa), `density` (kg/m³)
- **Assumptions:** `g` (default 9.80665 m/s²), `efficiency` η (default 0.70)
- **Output:** hydraulic power (W) as the headline; brake power (W) in steps
- **Guards:** Q ≥ 0, ρ > 0, 0 < η ≤ 1
- **Benchmark (hand):** Q=0.05, H=50 m, ρ=1000, η=0.70 → P_hyd=ρgQH = **24.52 kW**, P_brake = **35.02 kW**

### 3.4 NPSH available — `npshAvailable` (Tier: computed)
- **Formula:** `NPSHa = (P_s − P_v)/(ρ·g) + z_s − h_f`
- **Inputs:** `suctionPressure` P_s (Pa, absolute), `vaporPressure` P_v (Pa, absolute), `density` (kg/m³), `staticHead` z_s (m, +above pump), `frictionLoss` h_f (m)
- **Assumptions:** `g` (9.80665)
- **Output:** NPSHa (m)
- **Guards:** ρ > 0
- **Benchmark (hand):** P_s=101325, P_v=2339, ρ=998, z_s=2, h_f=0.5 → **NPSHa ≈ 11.61 m**

### 3.5 Gas-liquid separator sizing — `separatorSizing` (Tier: validated — GPSA / Souders-Brown)
- **Formula:** `v_max = K·√((ρ_L − ρ_g)/ρ_g)` ; required gas cross-section `A = Q_g/v_max` ; min vessel ID `D = √(4A/π)`
- **Inputs:** `liquidDensity` ρ_L (kg/m³), `gasDensity` ρ_g (kg/m³), `gasFlowrate` Q_g (m³/s, actual conditions)
- **Assumptions:** `K` Souders-Brown coefficient (default 0.107 m/s ≈ 0.35 ft/s, GPSA vertical separator typical)
- **Output:** minimum vessel internal diameter (m); v_max in steps
- **Reference:** "Souders-Brown / GPSA Engineering Data Book (separator sizing)"
- **Guards:** ρ_g > 0, ρ_L > ρ_g, Q_g ≥ 0
- **Benchmark (hand + GPSA basis):** K=0.107, ρ_L=800, ρ_g=20, Q_g=0.5 → v_max=**0.668 m/s**, D=**0.976 m**

### 3.6 Vessel/tank volume — `vesselVolume` (Tier: computed)
- **Formulas:**
  - Vertical/horizontal cylinder shell: `V_cyl = (π·D²/4)·L`
  - 2:1 elliptical heads (two): `V_heads = π·D³/12` (i.e. `π·D³/24` each)
  - Total (with heads): `V = V_cyl + V_heads`
- **Inputs:** `diameter` (m), `length` (m, tan-to-tan), `heads` ("none" | "2:1elliptical", default "none")
- **Output:** total volume (m³)
- **Guards:** D > 0, L ≥ 0
- **Benchmark (hand):** D=2 m, L=5 m, 2:1 elliptical heads → V_cyl=15.708, V_heads=2.094 → **V=17.80 m³**
- **Deferred:** partial-fill (liquid-level→volume) horizontal segment math → follow-on batch

### 3.7 Gas properties — `gasProperties` (Tier: computed — correlations)
- **Components:**
  - **MW:** `MW = 28.964·SG_gas` (air basis)
  - **Pseudo-criticals (Sutton, °R / psia):** `Tpc = 169.2 + 349.5·SG − 74·SG²` ; `Ppc = 756.8 − 131.0·SG − 3.6·SG²`
  - **Reduced:** `Tpr = T/Tpc`, `Ppr = P/Ppc`
  - **Z-factor:** **Dranchuk-Abou-Kassem (DAK)** — iterative solve for reduced density ρ_r, valid 0.2 ≤ Ppr ≤ 30, 1.0 ≤ Tpr ≤ 3.0
  - **Gas density:** `ρ = P·MW/(Z·R·T)`
- **Inputs:** `gasSG` (dimensionless), `temperature` (K or °R/°C/°F via convert), `pressure` (Pa or psia via convert)
- **Output:** headline = Z-factor (dimensionless); MW, Tpr, Ppr, density reported in steps
- **Method note:** DAK constants A1…A11 per the published correlation; Newton iteration on ρ_r to |Δ| < 1e-10
- **Guards:** SG > 0, T > 0, P > 0; if Ppr/Tpr fall outside the DAK validity window, attach an `info` sanity flag ("outside correlation range — verify")
- **Benchmark (Standing-Katz point):** SG=0.65, T=120 °F (580 °R), P=1000 psia → Tpc≈365 °R, Ppc≈670 psia, Tpr≈1.59, Ppr≈1.49 → **Z ≈ 0.87** (assert toBeCloseTo(0.87, 2) against the DAK result; MW≈18.83)
- **Drop:** `k` (Cp/Cv) — needs Cp data; only the deferred PSV-gas/Cv-gas need it.

### 3.8 Erosional velocity — `erosionalVelocity` (Tier: validated — API RP 14E)
- **Formula:** `Ve = C/√ρ_m` (field units: ρ_m in lb/ft³, Ve in ft/s; result also reported in m/s)
- **Inputs:** `mixtureDensity` ρ_m (kg/m³, converted to lb/ft³ internally)
- **Assumptions:** `C` (default 100 continuous service; 125 intermittent), per API RP 14E
- **Output:** erosional velocity Ve (m/s headline; ft/s in steps)
- **Reference:** "API RP 14E §2.5 (erosional velocity)"
- **Guards:** ρ_m > 0
- **Benchmark (API basis):** ρ_m=3 lb/ft³ (≈48.06 kg/m³), C=100 → **Ve=57.74 ft/s ≈ 17.6 m/s**
- **Note:** this is the proper erosional-velocity calc; the existing `checkMaxVelocity` heuristic in `core/sanity.ts` remains as a quick liquid-line guard and is unchanged.

---

## 4. Validation strategy

Per agreed approach: **hand-computed + published benchmarks.**
- Every calc has at least one test asserting the result against a value computed by hand from the canonical formula (proves code matches formula).
- The standard-cited calcs (separator, erosional velocity, gas Z-factor) additionally assert against a published worked-example value (GPSA, API RP 14E, Standing-Katz) at the tolerance noted above.
- Unit-flexibility tests: at least one calc per group takes a non-SI input unit (e.g. pressure in psia, density in lb/ft³, diameter in inch) to confirm `convert()` normalization.
- Guard tests: each calc has a test asserting it throws on a non-physical input rather than returning `Infinity`/`NaN`.

---

## 5. Trust tiers

- **validated** (standard-cited, carry `reference`): separator sizing (GPSA/Souders-Brown), erosional velocity (API RP 14E).
- **computed** (formula shown): line velocity, Colebrook, pump power, NPSHa, vessel volume, gas properties (correlation-based; gas properties may add an `info` flag when outside the DAK validity window).

---

## 6. Out of scope (deferred to follow-on Process batch)

- PSV sizing — vapor/gas and liquid (API 520 Pt I)
- Fire-case relief load (API 521)
- Control-valve Cv — liquid and gas (ISA/IEC 60534)
- Orifice metering (ISO 5167)
- `k` (Cp/Cv) correlation
- Partial-fill (liquid-level → volume) vessel math
- Two-phase line sizing
