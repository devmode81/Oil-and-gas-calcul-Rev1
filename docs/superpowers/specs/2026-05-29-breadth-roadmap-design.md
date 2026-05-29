# Discipline-Breadth Roadmap — Design

**Date:** 2026-05-29
**Status:** Approved (brainstorming) — drives a sequence of per-batch plans
**Depends on:** Deterministic Core + Process Batch 1 (13 calcs on `main`).

---

## 1. Purpose

Complete the discipline-breadth program: bring the engine from 13 calcs to comprehensive **core daily-driver coverage (~8–10 calcs per discipline)** across every oil & gas engineering domain. The true long tail is intentionally left to the future Tier-4 AI-construction layer; this roadmap covers the high-frequency 80/20 that engineers reach for daily.

This is a **roadmap spec**: it enumerates the calc set for each remaining batch. Each batch gets its own implementation plan (writing-plans) → subagent-driven build → merge into `main`, executed in order.

## 2. Locked conventions (reused from prior batches — not re-litigated)

- **Contract:** every calc is a pure `Calc` returning the existing `CalcResult` (result, formula, inputs, editable assumptions, derivation steps, method, trust tier, sanity flags), registered in `CALC_REGISTRY`.
- **Units:** all inputs normalized via `convert()`; oilfield units already in the registry; add new units (e.g. `kVA`, `ppm`) only as needed per batch.
- **Validation:** hand-computed + published benchmarks. Every calc asserts against a by-hand formula value; standard-cited calcs additionally assert a published worked-example value.
- **Trust tiers:** standard-cited → `validated` (carry `reference`); formula/correlation → `computed`.
- **Input-domain guards:** every calc throws a clear `Error` on non-physical inputs (never returns `Infinity`/`NaN`).
- **TDD + per-task commits;** build/typecheck/test green before each merge.

## 3. Build order & batches

Build order: **Drilling → Reservoir → Subsea/Flow-Assurance → Mechanical → Electrical → EHS/Process-Safety → Heavy Process.** Each batch below lists its calcs with formula basis, trust tier, and standard/source. Exact code + benchmark values are produced in each batch's implementation plan.

### Batch 2 — Drilling
| Calc | Basis | Tier | Source |
|------|-------|------|--------|
| Mud hydrostatic pressure | P = 0.052·MW·TVD (field) / ρgh (SI) | computed | — |
| MW ↔ pressure gradient | ppg ↔ psi/ft via ×0.052 | computed | — |
| Equivalent circulating density (ECD) | ECD = MW + ΔP_ann/(0.052·TVD) | validated | IADC/IWCF |
| Equivalent mud weight (EMW) | EMW = P/(0.052·TVD) | computed | — |
| Annular velocity | v = Q/A_annulus | computed | — |
| Bit hydraulics | jet velocity, bit ΔP, HSI | computed | — |
| Kill mud weight (KMW) | KMW = MW + SIDPP/(0.052·TVD) | validated | IWCF well control |
| Buoyancy factor | BF = 1 − MW/65.5 (ppg) | computed | — |
| Pump output | bbl/stroke from liner geometry; gpm | computed | — |

### Batch 3 — Reservoir
| Calc | Basis | Tier | Source |
|------|-------|------|--------|
| STOIIP (volumetric) | N = 7758·A·h·φ·(1−Sw)/Boi (field, STB) | validated | SPE volumetrics |
| OGIP (volumetric) | G = 43560·A·h·φ·(1−Sw)/Bgi (scf) | validated | SPE volumetrics |
| Gas FVF (Bg) | Bg = 0.02827·Z·T/P (ft³/scf) | computed | — |
| Oil FVF (Bo) | Standing correlation | computed | Standing |
| Solution GOR (Rs) | Standing correlation | computed | Standing |
| Darcy radial inflow | q = k·h·ΔP/(141.2·μ·B·ln(re/rw)) (field) | validated | Darcy |
| Vogel IPR | qo/qmax = 1 − 0.2(Pwf/Pr) − 0.8(Pwf/Pr)² | validated | Vogel |
| Productivity index | J = q/(Pr − Pwf) | computed | — |
| Arps decline | exponential & hyperbolic rate/cum | computed | Arps |

### Batch 4 — Subsea / Flow Assurance
| Calc | Basis | Tier | Source |
|------|-------|------|--------|
| Pipeline ΔP w/ elevation | Darcy friction + ρg·Δz | computed | — |
| Hydrate margin | sub-cooling vs hydrate curve estimate | validated | flow-assurance correlation |
| Hammerschmidt inhibitor dose | ΔT = K·W/(M·(100−W)) → MEG/MeOH wt% | validated | Hammerschmidt |
| Insulation U-value & heat loss | series resistances; q = U·A·ΔT | computed | — |
| Cooldown / no-touch time | lumped capacitance ΔT(t) | computed | — |
| Joule-Thomson cooling | ΔT = μ_JT·ΔP | computed | — |
| Collapse pressure | thin/thick-wall external collapse | validated | API RP 1111 / DNV |
| Liquid holdup / superficial velocities | vsl, vsg, no-slip holdup λ | computed | — |

### Batch 5 — Mechanical / Rotating
| Calc | Basis | Tier | Source |
|------|-------|------|--------|
| Compressor polytropic head & power | H_poly, P = ṁ·H/η | validated | GPSA/ASME PTC-10 basis |
| Pump affinity laws | Q∝N, H∝N², P∝N³ | computed | — |
| Exchanger duty | Q = ṁ·Cp·ΔT | computed | — |
| LMTD | (ΔT1−ΔT2)/ln(ΔT1/ΔT2) | computed | — |
| Exchanger area | A = Q/(U·LMTD·F) | computed | — |
| ASME VIII internal-pressure thickness | t = P·R/(S·E − 0.6P) | validated | ASME VIII Div 1 |
| Pipe hoop & longitudinal stress | σ_h = PD/2t, σ_l = PD/4t | computed | — |
| Fan/blower power | P = Q·Δp/η | computed | — |

### Batch 6 — Electrical
| Calc | Basis | Tier | Source |
|------|-------|------|--------|
| 3-phase motor power/current | P = √3·V·I·pf·η | computed | — |
| Cable voltage drop | Vd = √3·I·(R·cosφ + X·sinφ)·L | validated | IEC/IEEE |
| Transformer kVA sizing | S = √3·V·I | computed | — |
| Power-factor correction | Qc = P·(tanφ1 − tanφ2) | computed | — |
| Full-load current | I = P/(√3·V·pf) | computed | — |
| Cable ampacity derating | I_derated = I_base·k_temp·k_group | validated | IEC 60364 |
| Power triangle | S, P, Q, pf relationships | computed | — |
| Generator sizing | kVA from load + starting | computed | — |

### Batch 7 — EHS / Process Safety
| Calc | Basis | Tier | Source |
|------|-------|------|--------|
| Flare radiation distance | r = √(τ·F·Q/(4π·K)) | validated | API 521 |
| Gas dispersion to LEL | dilution distance estimate | validated | dispersion correlation |
| H₂S exposure vs limits | concentration vs TWA/STEL/IDLH, exposure time | computed | OSHA/NIOSH limits |
| Flare tip exit velocity / Mach | v = Q/A; Mach = v/c | computed | API 521 |
| Spill containment volume | bund/dike geometry vs spill | computed | — |
| Combustion CO₂ emissions | stoichiometric CO₂ from fuel-gas composition | computed | — |
| Noise attenuation | SPL2 = SPL1 − 20·log10(r2/r1) | computed | — |
| Vapor depressuring rate | blowdown dP/dt estimate | validated | API 521 |

### Batch 8 — Heavy Process (earlier deferrals)
| Calc | Basis | Tier | Source |
|------|-------|------|--------|
| PSV vapor sizing | A = W/(C·Kd·P1·Kb·Kc)·√(T·Z/M) | validated | API 520 Pt I |
| PSV liquid sizing | A = Q/(38·Kd·Kw·Kc·Kv)·√(G/ΔP) | validated | API 520 Pt I |
| Fire-case relief load | Q = 21000·F·A^0.82 (env factor) | validated | API 521 |
| Control valve Cv — liquid | Cv = Q·√(SG/ΔP) | validated | IEC 60534 |
| Control valve Cv — gas | gas sizing w/ expansion factor | validated | IEC 60534 |
| Orifice metering | ISO 5167 mass flow w/ discharge coeff | validated | ISO 5167 |

## 4. Per-batch deliverable

Each batch produces: new `Calc` modules + parallel test files, `src/index.ts` exports + `CALC_REGISTRY` registration, full green suite/typecheck/build, merged to `main`. New directories per discipline as needed (`drilling/`, `reservoir/`, `subsea/`, `electrical/`, `ehs/`; `mechanical/`, `process/`, `flow/`, `geometry/`, `properties/` already exist).

## 5. Out of scope

- The long-tail / uncommon calcs beyond the daily-driver set (future top-up batches + Tier-4 AI construction).
- The LLM brain, worksheet/interaction features, and UI (separate sub-projects).
- Multiphase rigorous models (e.g. full Beggs-Brill / OLGA-class) — only simplified correlations here.

## 6. Notes on accuracy & honesty

Correlation-based calcs (FVF, GOR, hydrate margin, dispersion) carry `computed`/`validated` tiers but are estimates within their correlation's validity range; where a calc has a known validity window, attach an `info` sanity flag when inputs fall outside it (as done for the DAK Z-factor). Standard-sizing calcs (PSV, Cv, orifice, collapse) cite their clause and are benchmarked against published worked examples.
