# Electrical Calc Batch (Batch 6) — Implementation Plan

> REQUIRED SUB-SKILL: subagent-driven-development / executing-plans. TDD per calc.

**Goal:** Add 8 electrical calcs as pure `Calc`s in `src/calcs/electrical/` (new dir), registered in `CALC_REGISTRY`.

**Conventions:** same as prior batches. Study `src/calcs/mechanical/pumpPower.ts`. Run tests: `npm_config_cache=/tmp/npm-cache-albert npx vitest run tests/calcs/<file>.test.ts`.

All electrical inputs are SI (V, A, W, Ω, H). Phase angle in radians internally; accept degrees via convert if needed. Guard all inputs physically (V>0, I>0 where required, 0<pf≤1 etc.).

---

## Calcs

### 1. `motorPowerCurrent` — computed
- 3-phase: `P = √3·V·I·pf·η` (W); rearranged `I = P/(√3·V·pf·η)`.
- Inputs: `voltage`(V, line-line), `current`(A). Assumptions: `powerFactor`(0.85), `efficiency`(0.92). Both directions: given V+I → compute P; given P+V → compute I. Use `method`: "power" (default, compute P) or "current" (compute I, needs `activePower` input instead of `current`).
- Guard V>0, I>0 (power mode), pf∈(0,1], η∈(0,1].
- Headline: P (W) in power mode; I (A) in current mode.
- Benchmark power mode: V=415, I=100, pf=0.85, η=0.92 → P=√3·415·100·0.85·0.92=56,125 W. Assert `P/1000` `toBeCloseTo(56.1, 1)`.
- Benchmark current mode: P=56125 W (as above), V=415, pf=0.85, η=0.92 → I=56125/(√3·415·0.85·0.92)=100 A. Assert `toBeCloseTo(100, 1)`.

### 2. `cableVoltageDrop` — validated (IEC/IEEE)
- `Vd = √3·I·(R·cosφ + X·sinφ)·L` (V, line-line); %Vd = 100·Vd/V_supply.
- Inputs: `current`(A), `resistance`(Ω/km), `reactance`(Ω/km), `length`(km), `voltage`(V, supply line-line), `powerFactor`(default 0.85 assumption). Guard I>0, R≥0, X≥0, L≥0.
- sinφ = √(1−pf²).
- Headline: Vd (V); %Vd in steps. Reference "IEC 60364 / IEEE voltage drop".
- Benchmark: I=100, R=0.5, X=0.1, L=1, V=415, pf=0.85 → cosφ=0.85, sinφ=0.5268; Vd=√3·100·(0.5·0.85+0.1·0.5268)·1=√3·100·(0.425+0.05268)=√3·100·0.47768=82.75 V; %Vd=82.75/415·100=19.94%. Assert Vd `toBeCloseTo(82.75, 1)`.

### 3. `transformerKva` — computed
- `S = √3·V·I` (VA = kVA×1000).
- Inputs: `voltage`(V, line-line), `current`(A). Guard V>0, I>0.
- Headline: S (VA); also kVA in steps.
- Benchmark: V=415, I=200 → S=√3·415·200=143,758 VA=143.8 kVA. Assert `S/1000` `toBeCloseTo(143.8, 1)`.

### 4. `powerFactorCorrection` — computed
- Required kVAR: `Q_c = P·(tanφ1 − tanφ2)`.
- Inputs: `activePower`(W), `currentPowerFactor`, `targetPowerFactor`. Guard P≥0, 0<pf1<pf2≤1 (correcting from lower to higher pf).
- tanφ = √(1−pf²)/pf.
- Headline: Q_c (VAR).
- Benchmark: P=100e3, pf1=0.7, pf2=0.95 → tanφ1=1.0202, tanφ2=0.3287; Q_c=100e3·(1.0202−0.3287)=69,150 VAR. Assert `Q_c/1000` `toBeCloseTo(69.15, 1)`.

### 5. `fullLoadCurrent` — computed
- `I_fl = P/(√3·V·pf)` (motor full-load current).
- Inputs: `ratedPower`(W), `voltage`(V, line-line), `powerFactor`(default 0.85 assumption). Guard P>0, V>0, pf>0.
- Headline: I (A).
- Benchmark: P=75000, V=415, pf=0.85 → I=75000/(√3·415·0.85)=75000/610.5=122.8 A. Assert `toBeCloseTo(122.8, 1)`.

### 6. `cableAmpacityDerating` — validated (IEC 60364)
- `I_derated = I_base·k_temp·k_group`.
- Inputs: `baseAmpacity`(A), `tempDeratingFactor`(–), `groupDeratingFactor`(–). Assumptions: both factors default 1.0. Guard I_base>0, factors>0.
- Headline: derated ampacity (A). Reference "IEC 60364-5-52 cable ampacity derating".
- Benchmark: I_base=100, k_temp=0.87, k_group=0.70 → I_derated=100·0.87·0.70=60.9 A. Assert `toBeCloseTo(60.9, 1)`.

### 7. `powerTriangle` — computed
- From P, Q, S triangle: `S=√(P²+Q²)`, `pf=P/S`, `Q=P·tanφ`.
- `method`: "from_PQ" (P and Q given → S and pf), "from_PS" (P and S given → Q and pf), "from_Ppf" (P and pf given → Q and S). Default "from_PQ".
- Inputs vary by method. Headline: S (VA) for from_PQ; Q (VAR) for from_Ppf; pf(–) for from_PS.
- Benchmark from_PQ: P=100e3, Q=75e3 → S=√(1e10+5.625e9)=125e3 VA, pf=0.8. Assert S `toBeCloseTo(125000, 0)`, pf `toBeCloseTo(0.8, 4)`.
- Benchmark from_Ppf: P=100e3, pf=0.8 → tanφ=0.75, Q=75e3 VAR. Assert `toBeCloseTo(75000, 0)`.

### 8. `generatorSizing` — computed
- `S_kVA = (P_load/pf)·(1+startingFactor)·diversityFactor`.
- Inputs: `connectedLoad`(W), `powerFactor`(0.8 assumption), `startingFactor`(0.25 assumption — 25% excess for motor starting), `diversityFactor`(1.0 assumption). Guard load>0, pf>0.
- Headline: S (VA).
- Benchmark: P=200e3, pf=0.8, startingFactor=0.25, diversity=1.0 → S=(200e3/0.8)·1.25=312,500 VA. Assert `toBeCloseTo(312500, 0)`.

---

## Per-calc TDD
Write test → FAIL → implement → PASS → commit `feat(calcs): add <name> (electrical)`. Use non-SI input unit in ≥2 tests (e.g. kW, kV, km). Validated calcs (cableVoltageDrop, cableAmpacityDerating) carry reference. All guards throw.

## Final task
Export + register all 8 in src/index.ts (registry → 55). Full suite + typecheck + build. Commit `feat(core): export and register electrical calcs`.
