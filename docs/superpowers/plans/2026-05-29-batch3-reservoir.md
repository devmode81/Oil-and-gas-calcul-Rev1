# Reservoir Calc Batch (Batch 3) — Implementation Plan

> REQUIRED SUB-SKILL: subagent-driven-development / executing-plans. TDD per calc.

**Goal:** Add 9 reservoir calcs as pure `Calc`s in `src/calcs/reservoir/` (new dir), hand-computed + benchmark-validated, registered in `CALC_REGISTRY`.

**Architecture/conventions:** Same as prior batches — `Calc` contract, full `CalcResult`, input-domain guards (`!(x>0)` throws), `mergeAssumptions` for tunables, commit per calc. Follow the existing pattern (e.g. `src/calcs/properties/gasProperties.ts`, `src/calcs/mechanical/pumpPower.ts`).

**Important — empirical correlations use FIELD units.** Several formulas bundle unit conversions into a constant (7758.4, 43560, 0.02827, 141.2) or are dimensional correlations (Standing). For these, **convert each input to the field unit named in the formula via `convert()`, then apply the field formula.** Do NOT re-derive these in SI. Temperature for correlations is °F unless noted. Run tests: `npm_config_cache=/tmp/npm-cache-albert npx vitest run <file>`.

---

## Calcs (formula · inputs[field unit] · benchmark · tier)

### 1. `stoiipVolumetric` — validated (SPE volumetrics)
- `N = 7758.4·A·h·φ·(1−Sw)/Boi` (STB); 7758.4 bbl/acre-ft
- Inputs: `area`(acre), `thickness`(ft), `porosity`(frac 0–1), `waterSaturation`(frac), `boi`(rb/STB). Guards: 0≤φ≤1, 0≤Sw≤1, Boi>0, area≥0, h≥0.
- Headline: STB. Reference "SPE volumetric (STOIIP)".
- Benchmark: A=500, h=50, φ=0.25, Sw=0.30, Boi=1.2 → N≈2.829e7 STB (assert `N/1e6` `toBeCloseTo(28.3, 1)`).

### 2. `ogipVolumetric` — validated (SPE volumetrics)
- `G = 43560·A·h·φ·(1−Sw)/Bgi` (scf); 43560 ft³/acre-ft, Bgi in ft³/scf
- Inputs: `area`(acre), `thickness`(ft), `porosity`, `waterSaturation`, `bgi`(ft^3/scf). Guards as above, Bgi>0.
- Headline: scf. Reference "SPE volumetric (OGIP)".
- Benchmark: A=500, h=50, φ=0.25, Sw=0.30, Bgi=0.005 → G≈3.81e10 scf (assert `G/1e9` `toBeCloseTo(38.1, 1)`).

### 3. `gasFvf` — computed
- `Bg = 0.02827·Z·T/P` (ft³/scf); T in °R, P in psia
- Inputs: `zFactor`(–), `temperature`(°R; accept degF/degC/K via convert→ then ×… use convert to "rankine" if available, else convert to K then ×1.8), `pressure`(psia). Guards Z>0, T>0, P>0.
- Headline: ft³/scf.
- Benchmark: Z=0.9, T=580 °R, P=2000 psia → Bg≈0.0073786 ft³/scf (assert `toBeCloseTo(0.007379, 5)`).

### 4. `oilFvfStanding` — computed (Standing)
- `Bo = 0.9759 + 0.00012·F^1.2`, `F = Rs·(γg/γo)^0.5 + 1.25·T`; T °F, γo = 141.5/(131.5+API)
- Inputs: `solutionGor` Rs(scf/STB), `gasSG`(–), `oilAPI`(°API), `temperature`(°F). Guards Rs≥0, gasSG>0, API>0.
- Headline: Bo (rb/STB).
- Benchmark: Rs=500, γg=0.7, API=30 (γo=0.8762), T=200 °F → F≈697.0, Bo≈1.286 (assert `toBeCloseTo(1.286, 2)`).

### 5. `solutionGorStanding` — computed (Standing)
- `Rs = γg·[(P/18.2 + 1.4)·10^(0.0125·API − 0.00091·T)]^1.2048`; P psia, T °F
- Inputs: `pressure`(psia), `gasSG`(–), `oilAPI`(°API), `temperature`(°F). Guards P>0, gasSG>0, API>0.
- Headline: Rs (scf/STB).
- Benchmark: P=2000, γg=0.7, API=30, T=200 → Rs≈349.5 (assert `toBeCloseTo(349.5, 0)`).

### 6. `darcyRadialInflow` — validated (Darcy)
- `q = k·h·ΔP / (141.2·μ·B·ln(re/rw))` (STB/d); k md, h ft, ΔP psi, μ cp, B rb/STB
- Inputs: `permeability`(md), `thickness`(ft), `deltaP`(psi), `viscosity`(cp; accept cP), `formationVolumeFactor`(–), `drainageRadius`(ft), `wellboreRadius`(ft). Guards all >0, re>rw.
- Headline: STB/d. Reference "Darcy radial flow (pseudo-steady/steady)".
- Benchmark: k=50, h=50, ΔP=500, μ=1, B=1.2, re=1000, rw=0.5 → ln(2000)=7.601, q≈970.5 STB/d (assert `toBeCloseTo(970.5, 0)`).

### 7. `vogelIpr` — validated (Vogel)
- `qo = qmax·[1 − 0.2(Pwf/Pr) − 0.8(Pwf/Pr)²]`
- Inputs: `reservoirPressure` Pr(psi), `flowingPressure` Pwf(psi), `maxFlow` qmax(STB/d). Guards Pr>0, 0≤Pwf≤Pr, qmax≥0.
- Headline: qo (STB/d). Reference "Vogel IPR".
- Benchmark: Pr=3000, Pwf=2000, qmax=1000 → ratio 0.6667 → qo≈511.1 (assert `toBeCloseTo(511.1, 1)`).

### 8. `productivityIndex` — computed
- `J = q/(Pr − Pwf)`
- Inputs: `flowrate` q(STB/d), `reservoirPressure` Pr(psi), `flowingPressure` Pwf(psi). Guard Pr>Pwf.
- Headline: J (STB/d/psi).
- Benchmark: q=500, Pr=3000, Pwf=2500 → J=1.0 (assert `toBeCloseTo(1.0, 3)`).

### 9. `arpsDecline` — computed (Arps)
- Method via `CalcInput.method`: "exponential" (default) `q = qi·e^(−D·t)`; "hyperbolic" `q = qi/(1 + b·D·t)^(1/b)`
- Inputs: `initialRate` qi(STB/d), `declineRate` D(1/yr), `time` t(yr); for hyperbolic also `bExponent` b. Guards qi≥0, D≥0, t≥0; hyperbolic b>0. alternativeMethods ["exponential","hyperbolic"].
- Headline: q at time t (STB/d).
- Benchmark exp: qi=1000, D=0.15, t=2 → q=1000·e^(−0.3)≈740.8 (assert `toBeCloseTo(740.8, 1)`). Hyperbolic: qi=1000, D=0.15, b=0.5, t=2 → q=1000/(1.15)²≈756.1 (assert `toBeCloseTo(756.1, 1)`).

---

## Per-calc TDD: write benchmark+guard test → FAIL → implement (follow pattern; convert inputs to the named field units first) → PASS → commit `feat(calcs): add <name> (reservoir)`. Use a non-field input unit in ≥3 tests (e.g. temperature in degC, viscosity in cP, deltaP in bar) to exercise convert(). validated calcs (stoiip, ogip, darcy, vogel) carry references.

## Final task: export + register all 9 in src/index.ts (registry → 31). Full suite + typecheck + build green. Commit `feat(core): export and register reservoir calcs`.

## Self-review: 9 roadmap reservoir calcs covered; benchmarks hand-derived; field-unit constants preserved (do not SI-convert empirical correlations); guards everywhere; no placeholders.
