# Oil & Gas Calc App — v1 Design

**Date:** 2026-05-29
**Status:** Approved (brainstorming) — ready for implementation planning
**Scope of this doc:** Overall v1 architecture + the full feature set. Each of the four sub-projects gets its own focused spec; Sub-project 1 (Deterministic Core) is specced first.

---

## 1. What we're building

An **AI-native, discipline-spanning engineering calculation + unit-conversion tool** for *every* kind of oil & gas engineer — reservoir, drilling, process/facilities, subsea/pipeline, mechanical, electrical. The user types a problem in plain language or shorthand; deterministic code does the math; **every answer shows its work and declares how much it can be trusted.**

### Positioning (the wedge — not negotiable)
This is **not** "another units converter + calc pack." Incumbents (Uconeer/Katmar, DWSIM, PIPESIM) win on breadth/depth. Our differentiator is the **guidance layer**: the engineer describes a problem ("size a relief valve for a vessel with fire exposure", or "chemical injected at 2 LPH into a stream of 1500 bopd / 120 bwpd / 5 MMscf/d gas — transit time to 300 m?"), and the app picks the method, asks for missing inputs, runs it, explains it, and sanity-checks it. **Unit conversion is the daily-use acquisition hook; guided, auditable calcs are retention + (later) monetization.**

### Example inputs the app must handle
- `1550 psi to bar` — pure conversion, no LLM needed.
- `volume of a cylinder with radius 3 m and length 100 m, convert answer to m3` — geometry + conversion, no LLM needed.
- `I am injecting a chemical at 2 LPH into a multiphase flow stream of oil, water and gas at 1500 bopd, 120 bwpd and 5 MMscf/d. How long to travel 300 m?` — natural language → LLM routes to a transit-time calc, asks for pipe ID if missing, computes deterministically.

---

## 2. Core principle: the LLM does NOT do the math

| Job | Who does it | Why |
|-----|-------------|-----|
| **Understand & route** — read the request, classify intent, extract inputs, pick the method/standard | LLM ("the brain") | Language understanding is what LLMs are good at |
| **Calculate** — convert units, run the calc, show every step | Deterministic code ("the core") | Exact, repeatable, auditable, testable against standards, free to run |

This split is foundational. It makes the calculations **exact and free forever**, and it makes the "show your work / citable in a calc memo" trust promise possible. For the highest-frequency requests (`1550 psi to bar`, cylinder volume), a deterministic parser handles them **without calling the LLM at all** — instant, free, offline.

---

## 3. AI architecture (beta)

**Cloudflare (host + Worker proxy + failover Gemma) + Groq `gemma2-9b-it` as primary brain.**

- **Cloudflare Pages** — hosts the static web app. Free.
- **Cloudflare Worker** — thin proxy so model credentials never sit in the browser. Free.
- **Groq `gemma2-9b-it`** — primary brain (fast, best parsing of the three options). Server-side key in the Worker.
- **Cloudflare Workers AI (Gemma)** — automatic failover when Groq rate-limits.
- **Degradation chain:** Groq → Cloudflare Gemma → manual calculator ("brain's busy — type the values directly"). The deterministic core always works regardless.

### Cost & risk posture
- **No billing attached to any provider.** Free tiers can only ever return "busy" (HTTP 429) — they can **never** bill the owner. This is the hard safety valve.
- **Shared free quota** is acceptable for beta because the deterministic parser carries the bulk of requests, so the LLM is rarely called. Two free sources (Groq + Cloudflare) roughly double effective quota and give graceful failover.
- **Owner's only resource is a personal Claude Pro account** — used to *build* this, **not** to power runtime. (A personal subscription cannot legally/technically serve end-user API traffic.)
- **Confidential data (beta decision):** a clear disclaimer — *"Beta: don't paste confidential data."* Free-tier provider data may be used for training; we disclose and move fast. Revisit for the paid/robust version.

### Why Gemma / why this pair
Gemma is open-source (fits the open-source ethos). Groq's 9B variant is the best parser of the candidates and is extremely fast; Cloudflare consolidates host + proxy + failover model into one free account. (Google Gemini *Flash* would parse marginally better and is a drop-in upgrade later, but we honor the Gemma choice for beta.)

---

## 4. Coverage model: tier the *trust*, not the *coverage*

Cover almost everything an O&G engineer asks; be honest about where each answer comes from. **No user ever hits a "not supported" wall**, but no one mistakes an AI guess for an API-validated result.

| Tier | Covers | Computed by | Trust label |
|------|--------|-------------|-------------|
| **1 — Conversions** | Every unit O&G uses, incl. oilfield (bbl, MMscf/d, API gravity, ppg, psi/ft, darcy, cP…) | Dimensional engine, exact | *Exact* |
| **2 — Standard formulas** | Universal eqns: Reynolds, Darcy-Weisbach ΔP, hydrostatic head, ideal/real gas, continuity/velocity, Bernoulli, geometry/volumes… | Deterministic, formula shown | *Computed — formula shown* |
| **3 — Curated standard calcs** | High-stakes, standard-cited: PSV (API 520), separator sizing, control-valve Cv (ISA), NPSH, orifice (ISO 5167)… | Validated module + clause ref | *Validated against [standard]* |
| **4 — AI-constructed estimate** | The genuine long tail across any discipline | LLM derives from first principles; **code computes** | ⚠️ *AI-derived estimate — verify before use* |

### Minimal data footprint
- **Units:** a dimensional-analysis engine stores base dimensions + a compact factor table and *derives* thousands of conversions — kilobytes, not a giant table.
- **Formulas:** a compact code library of standard equations.
- **Fluid properties:** correlations (Standing, Lee et al., etc.), not a bulky database.
- The **LLM brain** supplies the intelligence to map messy queries onto formulas, so we avoid hard-coding hundreds of calculators.

### Coverage sketch by discipline (full enumeration in Sub-project 1 spec)
- **Reservoir:** material balance, OOIP/OGIP volumetrics, FVF/Bo, gas Z-factor, IPR/Vogel, Darcy radial flow, decline curves
- **Drilling:** mud weight/hydrostatic, ECD, ppg↔psi/ft, hydraulics/jet velocity, kick tolerance, buoyancy
- **Process/Facilities:** PSV, separator, line sizing, ΔP, Cv, two-phase, orifice, pump head/NPSH, gas props, tank volume
- **Subsea/Pipeline:** ΔP & holdup, hydrate margins, transit/residence time, wall thickness (Barlow), insulation U-value
- **Mechanical:** pipe stress/Barlow, pump/compressor power, heat-exchanger duty, vessel wall thickness
- **Electrical:** motor power/current, cable voltage drop, power factor, transformer sizing
- **Universal:** all conversions, geometry, fluid properties

---

## 5. Request routing

```
User types something
        │
        ▼
[1] Deterministic parser tries first (free, instant, offline)
        ├─ Pure unit conversion?  "1550 psi to bar"        → convert, done. No LLM.
        ├─ Recognized math/geometry? "volume of cylinder…" → compute, done. No LLM.
        ▼ (couldn't confidently parse)
[2] LLM brain (Groq Gemma → Cloudflare failover) classifies intent + extracts inputs
        ├─ Matches a curated calc (Tier 3)? → route to that engine, ask for missing inputs, run
        ├─ Expressible as standard formula (Tier 2)? → build, show formula, compute deterministically
        └─ Long tail (Tier 4)? → LLM derives method, code computes, label "verify"
        ▼ (ambiguous)
    Ask a clarifying question (chips), or present multiple interpretations
```

**Principle:** the LLM picks the method and fills inputs; **code always does the arithmetic and shows the work.**

---

## 6. The "show your work" result card (the product's soul)

Every answer renders as a card containing:
- **The result** — sig-fig-aware, units attached
- **The formula used** — properly typeset
- **Inputs & editable assumptions** — all defaults visible and overridable
- **Method + standard/clause cited** — e.g. *API 520 Eq. 3.2*
- **Trust-tier badge** — Exact / Computed / Validated / ⚠️ AI-estimate
- **Sanity-check flags** — e.g. ⚠️ *velocity 18 m/s exceeds erosional velocity per API RP 14E*
- **Actions** — export (PDF/markdown), add-to-worksheet, adjust inputs

---

## 7. Full v1 feature set

### Beta-essential (all in scope)
1. **Calc chaining + variable memory** — reuse results, name values (`let D = 6 in`), build sequences.
2. **Sanity-check / guardrail layer** — range warnings, unit-mismatch detection, correlation-validity flags. (Also the liability shield.)
3. **Built-in fluid/material properties** — via correlations (gas Z, viscosity, water/steam density, API↔SG, gas SG↔MW). Tiny footprint.
4. **Explicit, editable assumptions + standard conditions** — g, atmospheric P, discharge coefficient, and the **SCF basis** (60 °F/14.696 psia vs 15 °C/1.01325 bar) made explicit, defaulted, overridable.
5. **Significant figures / sensible rounding** — settable.
6. **Method/correlation choice** — show which method was used; let the user switch (e.g. Darcy-Weisbach vs Hazen-Williams).
7. **Local history + save/recall** — browser-local, no login.
8. **True offline for Tiers 1–2** — conversions and standard formulas work with zero signal (rig/offshore). The brain is the only online part.

### Power features (also in v1 scope)
9. **Goal-seek / back-solve** — "what ID keeps velocity < 3 m/s?" A generic numerical solver that inverts *any* core calc.
10. **What-if sliders** — live re-compute as an input is dragged.
11. **Excel interop** — paste a column, run a calc down it, copy back.
12. **Batch/table input** — run one calc over a range of cases.

> **Feasibility note:** #9, #10, #11, #12 are thin wrappers over the same machinery. If the core exposes calcs as pure, unit-aware functions `f(inputs) → result`, then slider = re-call `f`; goal-seek = generic solver inverting `f`; batch = map `f` over rows; Excel = paste → batch → copy. Getting the core function interface right unlocks all four cheaply.

---

## 8. Architecture & build order — 4 sub-projects

Each sub-project gets its own spec → plan → build cycle. Built in dependency order.

| # | Sub-project | Contains | Rationale |
|---|-------------|----------|-----------|
| **1** | **Deterministic core** | Units engine (Tier 1), formula library (Tier 2), curated standard calcs (Tier 3), fluid-property correlations (#3), sanity checks (#2), editable assumptions + std conditions (#4), sig-figs (#5), method choice (#6) | The trust foundation. Pure, fully testable against textbooks. **No AI, no UI.** Everything sits on it. |
| **2** | **Brain / router** | Deterministic-first parse → LLM (Groq + Cloudflare failover) via Worker proxy, intent classification, clarification UX, 4-tier trust labeling | Adds "type anything" on top of a core that already works. |
| **3** | **Worksheet & interaction** | Variable memory + chaining (#1), goal-seek (#9), what-if sliders (#10), batch/table (#12), Excel interop (#11), local history + save/recall (#7) | All call into core #1, built once its interface is proven. |
| **4** | **Shell, output & offline** | Zero-chrome keyboard-first UI, "show your work" cards, assumptions panel, sanity flags, PDF/markdown export, true offline + PWA (#8) | The face of it; wraps everything above. |

**After Sub-project 1 alone, we have a trustworthy, offline, textbook-validated calc engine** — the hardest and most credibility-critical part — before any AI or UI exists. Lowest-risk path to something real.

---

## 9. Technology foundation

- **Language: TypeScript across the whole stack.** The *same* deterministic core runs in the browser (so Tiers 1–2 work fully offline) *and* inside the Cloudflare Worker. Write the math once, run it everywhere.
- **Deterministic core ships as a standalone, heavily unit-tested library** with zero UI/AI dependencies.
- **Units engine: extend an existing dimensional-analysis library** (e.g. mathjs/unitmath) and add the oilfield units it lacks (bbl, MMscf/d, API gravity, ppg, psi/ft, darcy). Validation effort focuses on the *additions*, not basic unit math.
- **Hosting/runtime:** Cloudflare Pages + Workers + Workers AI; Groq API for the primary brain.
- **No backend database; no login.** Persistence is browser-local (localStorage/IndexedDB).

---

## 10. Constraints & risks

- **Correctness liability is existential.** A wrong PSV size could hurt someone. Mitigations: validation against published standards (Tier 3), visible/editable assumptions, sanity-check flags, honest trust-tier labeling, and "estimate — verify against [standard]" framing on Tier 4.
- **Everyday-individual-engineer scope.** No enterprise integrations, no IT/security gatekeeping, no SCADA/live-system access. Inputs are files/text the engineer already legally holds.
- **Open-source core** = distribution + credibility. Paid pro tier comes later (advanced modules, batch at scale, branded reports, fluid DBs, team calc libraries). Acquire individuals, monetize teams.
- **Beta is free-only.** Reassess providers, privacy, and rate limits based on reception before building the robust/paid version.

---

## 11. Out of scope for v1 (deferred)

- User accounts / cloud sync / teams
- Paid tier, branded reports, batch-at-scale
- Formal calc-memo metadata (project/tag, rev, prepared-by/checked-by, auto reference list) — beta ships a simpler shareable sheet
- Verified-examples public library (trust showcase)
- Unit-system & standards-family presets (SI vs field; API/ISO/NORSOK defaults)
- Enterprise integrations, SCADA, live data
