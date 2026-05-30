# Mechanical / Rotating Calc Batch (Batch 5) — Implementation Plan

> REQUIRED SUB-SKILL: subagent-driven-development / executing-plans. TDD per calc.

**Goal:** Add 8 mechanical/rotating calcs as pure `Calc`s in `src/calcs/mechanical/` (dir already exists), registered in `CALC_REGISTRY`.

**Conventions:** Same as prior batches. Study `src/calcs/mechanical/pumpPower.ts` and `src/calcs/mechanical/npsh.ts` before writing. Run tests: `npm_config_cache=/tmp/npm-cache-albert npx vitest run tests/calcs/<file>.test.ts`.

---

## Calcs

### 1. `compressorPolytropicPower` — validated (GPSA/ASME PTC-10 basis)
- Formula: polytropic head `H_p = Z·R·T1/(MW·(n/(n−1)))·[(P2/P1)^((n−1)/n)−1]` (J/kg); power `P = ṁ·H_p/η_p`.
- Use n (polytropic index) = k (approx for ideal gas). Assumption: `polytropicEfficiency` η_p default 0.78.
- Inputs: `massFlowrate`(kg/s), `inletTemp`(K), `inletPressure`(Pa), `outletPressure`(Pa), `zFactor`(–), `molarMass`(g/mol), `polytropicIndex` n(–). Guard P2>P1>0, T>0, ṁ≥0, η>0.
- Constants: R=8314.46 J/(kmol·K); MW in kg/kmol = g/mol numerically.
- Headline: shaft power W. Reference "GPSA polytropic compression".
- Benchmark: ṁ=10 kg/s, T1=300 K, P1=1e6 Pa, P2=3e6 Pa, Z=0.95, MW=20 g/mol, n=1.3, η_p=0.78 → H_p=0.95·8314.46·300/(20·(1.3/0.3))·[(3)^(0.3/1.3)−1] = 0.95·8314.46·300/(20·4.333)·[3^0.23077−1] = 2375208.6/86.667·[1.29287−1] = 27406.6·0.29287 = 8026 J/kg; P=10·8026/0.78 = 102,900 W. Assert `P/1000` `toBeCloseTo(102.9, 0)`.

### 2. `pumpAffinityLaws` — computed
- Laws: Q2=Q1·(N2/N1); H2=H1·(N2/N1)²; P2=P1·(N2/N1)³.
- Inputs: `speed1`(rpm), `speed2`(rpm), `flow1`(m³/s), `head1`(m), `power1`(W). Guard speeds>0.
- Headline: power2 (W); flow2, head2 in steps.
- Benchmark: N1=1500, N2=1800, Q1=0.05, H1=50, P1=24517 → ratio=1.2; Q2=0.06, H2=72, P2=24517·1.728=42365 W. Assert P2 `toBeCloseTo(42365, 0)`.

### 3. `heatExchangerDuty` — computed
- `Q = ṁ·Cp·ΔT`
- Inputs: `massFlowrate`(kg/s), `heatCapacity`(J/kg·K), `tempIn`(°C or K), `tempOut`(°C or K). Guard ṁ≥0, Cp>0.
- ΔT = |T_out − T_in| in K (absolute values; use convert to K then subtract).
- Headline: duty Q (W).
- Benchmark: ṁ=10, Cp=4182, T_in=20°C, T_out=80°C → Q=10·4182·60=2,509,200 W. Assert `Q/1e6` `toBeCloseTo(2.509, 2)`.

### 4. `lmtd` — computed
- Counterflow LMTD: `LMTD = (ΔT1−ΔT2)/ln(ΔT1/ΔT2)`.
- Inputs: `hotIn`(°C), `hotOut`(°C), `coldIn`(°C), `coldOut`(°C). Guard ΔT1≠ΔT2; if equal return ΔT1.
- ΔT1 = hot_in − cold_out (counterflow); ΔT2 = hot_out − cold_in.
- Headline: LMTD (°C or K, same magnitude).
- Benchmark: hotIn=120, hotOut=60, coldIn=20, coldOut=80 → ΔT1=40, ΔT2=40 → equal, return 40. Second case: hotIn=120, hotOut=80, coldIn=20, coldOut=60 → ΔT1=60, ΔT2=60 → equal, return 60. Use a non-equal case: hotIn=130, hotOut=70, coldIn=20, coldOut=80 → ΔT1=50, ΔT2=50 → equal. Try: hotIn=130, hotOut=60, coldIn=20, coldOut=70 → ΔT1=60, ΔT2=40 → LMTD=(60−40)/ln(60/40)=20/ln(1.5)=20/0.4055=49.33. Assert `toBeCloseTo(49.33, 1)`.

### 5. `heatExchangerArea` — computed
- `A = Q / (U·LMTD·F)`; F correction factor default 1.0 (pure counterflow).
- Inputs: `duty`(W), `overallHeatTransferCoeff` U(W/m²·K), `lmtd`(K), `correctionFactor` F default 1.0. Guard U>0, LMTD>0, F>0.
- Headline: area (m²).
- Benchmark: Q=2.509e6, U=500, LMTD=49.33, F=1.0 → A=2.509e6/(500·49.33)=2.509e6/24665=101.8 m². Assert `toBeCloseTo(101.8, 1)`.

### 6. `asmeViiThickness` — validated (ASME VIII Div 1)
- `t = P·R/(S·E − 0.6·P)` (circumferential stress); add corrosion allowance as assumption.
- Inputs: `pressure`(Pa), `innerRadius`(m), `allowableStress`(Pa), `jointEfficiency` E default 1.0 (assumption), `corrosionAllowance`(m) default 0 (assumption). Guard P>0, R>0, S>0.
- Headline: minimum thickness (m). Reference "ASME VIII Div 1 §UG-27".
- Benchmark: P=2e6 Pa, R=0.5 m, S=138e6 Pa, E=1.0, CA=0 → t=2e6·0.5/(138e6−1.2e6)=1e6/136.8e6=0.00731 m. Assert `toBeCloseTo(0.00731, 5)`.

### 7. `pipeStress` — computed
- Hoop: `σ_h = P·D/(2·t)`; longitudinal (closed ends): `σ_l = P·D/(4·t)`.
- Inputs: `pressure`(Pa), `outerDiameter`(m), `wallThickness`(m). Guard D>2t>0.
- Headline: hoop stress (Pa); longitudinal in steps.
- Benchmark: P=5e6, D=0.3, t=0.01 → σ_h=5e6·0.3/(2·0.01)=75e6 Pa; σ_l=37.5e6 Pa. Assert hoop `toBeCloseTo(75e6, -3)` (i.e. /1e6 `toBeCloseTo(75, 2)`).

### 8. `fanBlowerPower` — computed
- `P = Q·ΔP/η`; Q = volumetric flow m³/s, ΔP = pressure rise Pa.
- Inputs: `flowrate`(m³/s), `pressureRise`(Pa), `efficiency` default 0.70 (assumption). Guard Q≥0, ΔP≥0, η>0.
- Headline: shaft power (W).
- Benchmark: Q=5, ΔP=2000, η=0.70 → P=5·2000/0.70=14286 W. Assert `toBeCloseTo(14286, 0)`.

---

## Per-calc TDD
Write test → FAIL → implement → PASS → commit `feat(calcs): add <name> (mechanical)`. Convert ALL dimensional inputs via convert(). For temperature absolute values use convert() to K; for differences use arithmetic on K values (avoid degC/degF offset issue). Use a non-SI input unit in ≥3 tests. Validated calcs (compressor, asmeVii) carry reference. All guards throw on non-physical input.

## Final task
Export + register all 8 in src/index.ts (registry → 47). Full suite + typecheck + build. Commit `feat(core): export and register mechanical calcs`.
