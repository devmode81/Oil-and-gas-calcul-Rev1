# Subsea / Flow-Assurance Calc Batch (Batch 4) — Implementation Plan

> REQUIRED SUB-SKILL: subagent-driven-development / executing-plans. TDD per calc.

**Goal:** Add 8 subsea/flow-assurance calcs as pure `Calc`s in `src/calcs/subsea/` (new dir), registered in `CALC_REGISTRY`.

**Conventions:** same as prior batches — `Calc` contract, full `CalcResult`, `convert()` all dimensional inputs, input-domain guards (throw, not Infinity/NaN), `mergeAssumptions` for tunables, TDD per calc, commit per calc. Study `src/calcs/flow/darcyWeisbach.ts` and `src/calcs/properties/gasProperties.ts` before writing. Run tests: `npm_config_cache=/tmp/npm-cache-albert npx vitest run tests/calcs/<file>.test.ts`.

---

## Calcs

### 1. `pipelinePressureDrop` — computed
- Formula: `ΔP_total = ΔP_friction + ΔP_elevation`; friction from Darcy-Weisbach `ΔP_f = f·(L/D)·(ρv²/2)`; elevation `ΔP_elev = ρ·g·Δz` (positive Δz = uphill).
- Inputs: `frictionFactor`(–), `length`(m), `diameter`(m), `density`(kg/m³), `velocity`(m/s), `elevationChange`(m, +uphill). Assumption: `g`(9.80665). Guards D>0, ρ>0.
- Headline: Pa.
- Benchmark: f=0.02, L=1000, D=0.1, ρ=800, v=2, Δz=50 → ΔP_f=0.02·10000·(800·4/2)=320000 Pa; ΔP_elev=800·9.80665·50=392266 Pa; total=712266 Pa. Assert `toBeCloseTo(712266, 0)`.

### 2. `hydrateMargin` — validated
- Katz hydrate-temperature estimate: `T_hyd = A + B·ln(P_psia) + C·(ln(P_psia))²` with typical constants for a 0.6-SG gas: A=12.739, B=5.613, C=−0.1886 (gives T in °F; convert to °C).
- Inputs: `pressure`(psia), `gasFlowingTemp`(°C). Guard P>0.
- Headline: sub-cooling margin ΔT (°C) = T_hyd − T_flowing (positive = in hydrate region risk). Reference "Katz hydrate correlation (gas SG≈0.6)".
- Benchmark: P=1000 psia, T_flowing=10 °C → T_hyd=12.739+5.613·ln(1000)+0.1886·(ln(1000))²... wait, use: T_hyd_F = 12.739+5.613·6.9078−0.1886·47.717 = 12.739+38.78−9.00 = 42.52 °F = 5.84 °C; margin = 5.84−10 = −4.16 °C (negative = flowing above hydrate curve, safe). Assert `toBeCloseTo(-4.16, 1)`.

### 3. `hammerschmidtInhibitorDose` — validated
- `ΔT = K_h·W / (M·(100−W))` → solve for W: `W = 100·ΔT·M / (K_h + ΔT·M)` (%wt)
- K_h = 2335 for MeOH (M=32.04), 2000 for MEG (M=62.07). Assumption `inhibitorType` default "MeOH".
- Inputs: `subCoolingRequired`(°C), `inhibitorType`("MeOH"|"MEG"). Guard ΔT≥0.
- Headline: inhibitor wt% W. Reference "Hammerschmidt equation".
- Benchmark: ΔT=5 °C, MeOH → W = 100·5·32.04/(2335+5·32.04) = 16020/2495.2 = 6.42 %wt. Assert `toBeCloseTo(6.42, 2)`.

### 4. `insulationHeatLoss` — computed
- Series cylindrical resistance: `R_ins = ln(r2/r1)/(2π·k·L)` (K/W); `q = ΔT/R_ins`.
- Inputs: `pipeOuterRadius` r1(m), `insulationOuterRadius` r2(m), `length` L(m), `conductivity` k(W/m·K), `deltaTemp` ΔT(K or °C diff). Guard r2>r1>0, L>0, k>0.
- Headline: heat loss q (W).
- Benchmark: r1=0.05, r2=0.10, L=100, k=0.04, ΔT=50 → R=ln(2)/(2π·0.04·100)=0.6931/25.133=0.02758 K/W; q=50/0.02758=1813 W. Assert `toBeCloseTo(1813, 0)`.

### 5. `cooldownTime` — computed (lumped capacitance)
- `T(t) = T_env + (T_init−T_env)·e^(−t/τ)` → solve for t: `t = −τ·ln((T_target−T_env)/(T_init−T_env))`; `τ = m·Cp/UA`.
- Inputs: `mass`(kg), `heatCapacity` Cp(J/kg·K), `heatLossCoeff` UA(W/K), `initialTemp`(°C), `targetTemp`(°C), `ambientTemp`(°C). Guards m>0, Cp>0, UA>0; T_init>T_target>T_env.
- Headline: time to cool (s).
- Benchmark: m=5000, Cp=2000, UA=500, T_init=60, T_target=20, T_env=5 → τ=20000 s; ratio=(20−5)/(60−5)=15/55=0.2727; t=−20000·ln(0.2727)=−20000·(−1.3*log...)=20000·1.3010=26020 s. Assert `toBeCloseTo(26020, 0)`.
(Exact: ln(15/55)=ln(0.27273)=−1.30083; t=20000·1.30083=26017 s. Assert `toBeCloseTo(26017, 0)`.)

### 6. `jouleThomsonCooling` — computed
- `ΔT = μ_JT · ΔP`; μ_JT for natural gas ≈ 0.45 °C/bar (assumption, overridable).
- Inputs: `pressureDrop`(bar). Assumption: `jouleThomsonCoeff`(0.45 °C/bar). Guard ΔP≥0.
- Headline: temperature drop ΔT (°C).
- Benchmark: ΔP=100 bar, μ=0.45 → ΔT=45 °C. Assert `toBeCloseTo(45, 2)`.

### 7. `collapsePresssure` — validated (thin-wall external pressure)
- Elastic collapse: `P_cr = 2E·(t/D_o)³ / (1−ν²)` (thin wall, elastic). For reference.
- Inputs: `wallThickness` t(m), `outerDiameter` D_o(m), `youngsModulus` E(Pa), `poissonRatio` ν(–). Guards t>0, D_o>2t, 0<ν<0.5, E>0.
- Headline: P_cr (Pa). Reference "Thin-wall elastic collapse (Timoshenko)".
- Benchmark: t=0.01, D_o=0.3, E=200e9, ν=0.3 → P_cr=2·200e9·(0.01/0.3)³/(1−0.09)=400e9·(0.03333)³/0.91=400e9·3.7037e-5/0.91=1.4815e7/0.91=16.28e6 Pa. Assert `toBeCloseTo(16.28e6, -4)` (±1e4 Pa tolerance at this magnitude use `toBeCloseTo(1.628e7/1e6, 1)` i.e. result/1e6 `toBeCloseTo(16.28, 1)`).

### 8. `liquidHoldup` — computed
- No-slip holdup: `λ_L = Q_L/(Q_L+Q_G)`; superficial velocities `v_sL=Q_L/A`, `v_sG=Q_G/A`, mixture `v_m=v_sL+v_sG`.
- Inputs: `liquidFlowrate`(m³/s), `gasFlowrate`(m³/s), `diameter`(m). Guard D>0, Q_L≥0, Q_G≥0, Q_L+Q_G>0.
- Headline: no-slip holdup λ_L (dimensionless 0–1); superficial velocities + mixture velocity in steps.
- Benchmark: Q_L=0.02, Q_G=0.08, D=0.2 → A=π·0.04/4=0.031416; λ=0.02/0.10=0.20; v_sL=0.6366, v_sG=2.546, v_m=3.183. Assert λ `toBeCloseTo(0.20, 3)`, v_m `toBeCloseTo(3.183, 2)`.

---

## Per-calc TDD
Write test → FAIL → implement → PASS → commit `feat(calcs): add <name> (subsea)`. Use a non-SI input unit in ≥3 tests (e.g. pressure in bar, diameter in inch, temperature in degF). Validated calcs (hydrateMargin, hammerschmidt, collapsePressure) carry `reference`.

## Final task
Export + register all 8 in src/index.ts (registry → 39). Full suite + typecheck + build. Commit `feat(core): export and register subsea calcs`.

## Self-review
8 roadmap subsea/FA calcs covered. Benchmarks hand-derived. Guards on all. Field/SI consistently used with convert(). No placeholders.
