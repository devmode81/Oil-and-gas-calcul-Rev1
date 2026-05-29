# Drilling Calc Batch (Batch 2) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans. TDD per calc.

**Goal:** Add 9 drilling calcs to the deterministic core, each a pure `Calc` with hand-computed + benchmark-validated tests.

**Architecture:** Each calc is a new pure `Calc` in `src/calcs/drilling/` (new dir) returning the existing `CalcResult`, registered in `CALC_REGISTRY`. SI-internal: convert all inputs via `convert()`, compute in SI, report field units in steps. Tunable constants via `mergeAssumptions`. Input-domain guards throw on non-physical inputs. Follow the existing calc file pattern exactly (see `src/calcs/mechanical/pumpPower.ts`, `src/calcs/flow/lineVelocity.ts`).

**Tech Stack:** TypeScript, mathjs, vitest. Run tests: `npm_config_cache=/tmp/npm-cache-albert npx vitest run <file>`.

**Conventions reminder:** result = headline Quantity; steps show derivation; `validated` calcs carry `reference`; guards use `!(x > 0)` (catches NaN); commit per calc.

---

## Files
```
src/calcs/drilling/{mudHydrostaticPressure,mudWeightGradient,ecd,equivalentMudWeight,annularVelocity,bitNozzleVelocity,killMudWeight,buoyancyFactor,pumpOutput}.ts
tests/calcs/<same>.test.ts
src/index.ts  (export + register all 9)
```

Units note: `ppg` is already registered (= lbm/gal). Use `convert(v,"ppg","kg/m^3")` for mud weight. Standard gravity g = 9.80665 m/s² (use a local assumption like the other calcs).

---

## Calcs (formula · inputs · benchmark · tier)

All densities computed in SI then reported. **Benchmarks are SI-exact** (slightly different from the field "0.052" rule of thumb — that is expected; do not "correct" to 0.052).

### 1. `mudHydrostaticPressure` — Tier computed
- Formula: `P = ρ·g·TVD` (ρ from mud weight)
- Inputs: `mudWeight` (ppg), `tvd` (ft). Guard MW>0, tvd≥0.
- Headline: pressure in **psi**; show Pa in steps.
- Benchmark: MW=10 ppg, TVD=10000 ft → ρ=1198.26 kg/m³, h=3048 m, P=3.5817e7 Pa = **5195 psi** (assert psi `toBeCloseTo(5195, 0)`).

### 2. `mudWeightGradient` — Tier computed
- Formula: `gradient = ρ·g` (pressure per length)
- Inputs: `mudWeight` (ppg). Guard MW>0.
- Headline: gradient in **psi/ft**.
- Benchmark: 10 ppg → 0.51945 psi/ft (assert `toBeCloseTo(0.5195, 3)`).

### 3. `ecd` — Tier validated (well control)
- Formula: `ECD = mudWeight + ΔP_ann/(g·TVD)` (as density)
- Inputs: `mudWeight` (ppg), `annularPressureLoss` (psi), `tvd` (ft). Guard MW>0, tvd>0.
- Headline: ECD in **ppg**; kg/m³ in steps. Reference: "IADC/IWCF well control (ECD)".
- Benchmark: MW=10 ppg, ΔP=200 psi, TVD=10000 ft → ECD ≈ **10.39 ppg** (assert `toBeCloseTo(10.39, 2)`). (Δρ = 1.379e6/(9.80665·3048)=46.13 kg/m³; 1198.26+46.13=1244.4 kg/m³ = 10.385 ppg.)

### 4. `equivalentMudWeight` — Tier computed
- Formula: `EMW = P/(g·TVD)` (density)
- Inputs: `pressure` (psi), `tvd` (ft). Guard tvd>0.
- Headline: EMW in **ppg**.
- Benchmark: P=5195 psi, TVD=10000 ft → **10.0 ppg** (assert `toBeCloseTo(10.0, 1)`).

### 5. `annularVelocity` — Tier computed
- Formula: `A = π(D_hole² − D_pipe²)/4 ; v = Q/A`
- Inputs: `flowrate` (gpm), `holeDiameter` (inch), `pipeOuterDiameter` (inch). Guard D_hole>D_pipe>0, Q≥0.
- Headline: velocity in **m/s**; ft/min in steps.
- Benchmark: Q=500 gpm (0.0315451 m³/s), hole=8.5 in (0.2159 m), pipe=5 in (0.127 m) → A=0.023943 m², v= **1.318 m/s** (≈259 ft/min) (assert `toBeCloseTo(1.318, 2)`).

### 6. `bitNozzleVelocity` — Tier computed
- Formula: `v_n = Q/TFA` (TFA = total nozzle flow area); also bit ΔP = `ρ·Q²/(2·Cd²·TFA²)` in steps.
- Inputs: `flowrate` (gpm), `totalFlowArea` (inch^2), `mudWeight` (ppg). Assumption: `Cd` (default 0.95). Guard TFA>0, Q≥0.
- Headline: nozzle velocity in **m/s**; bit ΔP (psi) in steps.
- Benchmark: Q=500 gpm (0.0315451 m³/s), TFA=0.5 in² (3.2258e-4 m²) → v= **97.79 m/s**; with MW=10 ppg, Cd=0.95 → ΔP_bit ≈ 6.35e6 Pa ≈ 921 psi (assert v `toBeCloseTo(97.79, 1)`).

### 7. `killMudWeight` — Tier validated (IWCF)
- Formula: `KMW = mudWeight + SIDPP/(g·TVD)` (density)
- Inputs: `mudWeight` (ppg), `sidpp` shut-in drillpipe pressure (psi), `tvd` (ft). Guard MW>0, tvd>0. Reference: "IWCF well control (kill mud weight)".
- Headline: KMW in **ppg**.
- Benchmark: MW=10 ppg, SIDPP=500 psi, TVD=10000 ft → Δρ=115.3 kg/m³ → KMW=1313.6 kg/m³ = **10.96 ppg** (assert `toBeCloseTo(10.96, 2)`).

### 8. `buoyancyFactor` — Tier computed
- Formula: `BF = 1 − ρ_mud/ρ_steel`; buoyed weight = air weight·BF (in steps if airWeight given)
- Inputs: `mudWeight` (ppg); optional `airWeight` (N or kgf). Assumption: `steelDensity` (default 7850 kg/m³). Guard MW>0.
- Headline: BF (dimensionless).
- Benchmark: MW=10 ppg (1198.26 kg/m³), steel 7850 → BF= **0.8474** (assert `toBeCloseTo(0.8474, 3)`).

### 9. `pumpOutput` — Tier computed
- Formula (triplex/duplex): `V_stroke = n_cyl·(π/4·D_liner²·strokeLength)·η_vol`
- Inputs: `linerDiameter` (inch), `strokeLength` (inch). Assumptions: `cylinders` (default 3), `volumetricEfficiency` (default 1.0). Guard D>0, stroke≥0.
- Headline: output in **bbl/stroke**; m³/stroke in steps.
- Benchmark: D=6 in (0.1524 m), stroke=12 in (0.3048 m), 3 cyl, η=1 → V=0.016679 m³/stroke = **0.10497 bbl/stroke** (assert `toBeCloseTo(0.1050, 3)`).

---

## Per-calc TDD procedure (apply to each of the 9)
1. Write the test file: import the calc; assert the benchmark result `toBeCloseTo(...)` at the stated precision; assert `trustTier`; for `validated` calcs assert `reference` contains the cited source; add one guard test (throws on a non-physical input). Use a non-SI input unit in at least 3 of the 9 tests (e.g. mudWeight in "kg/m^3", tvd in "m") to exercise `convert()`.
2. Run it → FAIL.
3. Implement the calc following the existing pattern (Calc object with id/name/requiredInputs/run; convert inputs to SI; guards; compute; return full CalcResult with formula, inputs, assumptions, steps, method, trustTier, flags).
4. Run it → PASS.
5. Commit: `feat(calcs): add <name> (drilling)`.

## Final task
Add all 9 exports + `CALC_REGISTRY` entries to `src/index.ts`. Run full suite (`npm_config_cache=/tmp/npm-cache-albert npm test`, expect 49 + new), `npm run typecheck`, `npm_config_cache=/tmp/npm-cache-albert npm run build`. Commit `feat(core): export and register drilling calcs`.

## Self-review
All 9 roadmap drilling calcs covered. Benchmarks hand-derived in SI. `ecd`/`killMudWeight` are `validated` with references; rest `computed`. Guards on every calc. No placeholders.
