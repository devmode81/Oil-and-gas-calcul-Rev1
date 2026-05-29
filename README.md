# Oil & Gas Calc — Deterministic Core

An AI-native engineering **calculation + unit-conversion** tool for oil & gas engineers (reservoir, drilling, process/facilities, subsea, mechanical, electrical). You describe a problem in plain language; an LLM figures out *what* to calculate and gathers inputs, while **deterministic code does the actual math** and shows its work.

> **Why this split?** LLMs are bad at arithmetic and non-deterministic. The "brain" only interprets and routes; a tested calculation engine computes the numbers — exact, repeatable, auditable, and free to run.

## This repository

This is **Sub-project 1: the Deterministic Core** — a standalone, dependency-light TypeScript library with **no UI and no AI**. It is the trust foundation every other layer builds on.

### What's here (v1 foundation + vertical slice)
- **Units engine** — dimensional conversion (extends `mathjs`) with oilfield units: `bbl`, `MMscf`, `scf`, `darcy`, `cP`, `ppg`, `bopd`/`bwpd`.
- **Calculation framework** — a pure `Calc` contract returning a "show your work" `CalcResult` (formula, inputs, editable assumptions, derivation steps, method, standard citation, trust tier, sanity flags).
- **Trust tiers** — `exact` (conversions) · `computed` (standard formulas) · `validated` (standard-cited) · `ai-estimate` (flagged "verify").
- **Six proof-of-framework calcs** — cylinder volume, Reynolds number, Darcy-Weisbach pressure drop (with method choice), API↔SG, Barlow wall thickness (Tier-3, standard-cited), pipeline transit time (with a velocity sanity flag).
- **Helpers** — editable assumptions & standard conditions, significant-figure formatting, sanity-check guardrails.

These six are a **vertical slice proving the framework end-to-end**, not the final calc library. Discipline breadth (many more validated calcs) and the LLM guidance layer come in subsequent sub-projects.

## Develop

```bash
npm install
npm test        # vitest — 29 tests
npm run typecheck
npm run build   # tsup → dist/
```

## Roadmap

1. **Deterministic core** ← this repo
2. **Brain / router** — deterministic-first parse → LLM (Groq Gemma + Cloudflare failover)
3. **Worksheet & interaction** — chaining, goal-seek, what-if sliders, batch/table, Excel interop, history
4. **Shell, output & offline** — zero-chrome UI, calc-sheet export, offline PWA

See `docs/superpowers/specs/` and `docs/superpowers/plans/` for the full design and implementation plan.

## License

TBD (intended open-source core).
