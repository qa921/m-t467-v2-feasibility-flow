# m-t467-v2-feasibility-flow

Feasibility app for M-T467-V2 built on the synthetic source-state fixture:
20 tenant-scoped **demo** projects, 40 candidate scenario deltas, and a single
continuous flow:

**Project → Inputs → Baseline → Scenarios & sensitivity → Report**

## Status and ground rules

- `docs/stakeholder-brief.md` is **unapproved working notes**, not a spec.
  No approved program rules or thresholds exist in any connected source.
- All calculation assumptions are **PROVISIONAL**, versioned in
  `src/engine/assumptions.ts` (`ASSUMPTION_SET_VERSION`), shown in the app
  banner and embedded in every report. They are replaceable, not approved.
- `marginTargetPct` is **informational only** — never rendered as a pass/fail
  or regulatory threshold (assumption `MARGIN-INFO-ONLY`). The margin
  goal-seek (`GOAL-SEEK-INFO-ONLY`) is an informational algebra exercise, not
  a recommendation.
- Affordability is **not computed**: no approved formula exists
  (`AFFORDABILITY-PENDING`).

## Stack

TypeScript + Express + vanilla JS frontend, vitest for tests.
The financial engine (`src/engine/`) is dependency-free and framework-free,
so it stays testable in isolation and its assumptions swappable.

## Layout

- `src/engine/` — types, provisional assumption registry, cashflow, metrics
  (NPV / IRR), evaluation, scenario deltas, provisional sensitivity &
  goal-seek, tests.
- `src/domain/` — the single shared display convention (labels, monthly
  period, rounding: money 0 decimals / rates 2 decimals) and validation
  (incomplete cost inputs stay validation exceptions; never repaired).
- `src/data/` — `ProjectRepository` tenant-scoped interface;
  `demo/demoRepository.ts` (read-only over fixtures, tenant-filtered);
  `neon/neonRepository.ts` (**unconfigured stub**) + `neon/schema.sql` (DRAFT).
- `src/server/` — Express API. Tenancy is **simulated** via the `x-tenant-id`
  header — there is no login and it is not authentication.
- `public/` — wizard UI for the five-step flow with DEMO badges and a shared
  metadata bar (currency, unit, monthly period, source date, rounding,
  assumption version) on every step.

## Data & validation behaviour

- `fixtures/projects.json` (source-input-v1) — 20 `demo:true` projects across
  tenants `northwind-dev` and `contoso-sandbox`.
- `fixtures/scenario-changes.json` — 2 candidate input deltas per project;
  deltas are inputs, never precomputed results.
- `fixtures/legacy-artifacts.json` — stale snapshot, intentionally defective;
  **not used anywhere** and not authoritative.
- Incomplete records (`src-p03`, `src-p17`, `src-p20`) can be opened and their
  Inputs reviewed, but Baseline / scenarios / sensitivity / goal-seek / report
  return the validation exception and compute nothing.

## Persistence

`ProjectRepository` is the adapter boundary. Default: `DemoProjectRepository`
(read-only fixtures; project creation is pending). `NeonProjectRepository` is
an unconfigured stub — there is **no dedicated Neon project yet**; do not
point it at another effort's database. Once a dedicated project exists and
`schema.sql` is approved: set `NEON_DATABASE_URL` and `PERSISTENCE=neon`.

## Run

```bash
npm install
npm run dev    # http://localhost:3000
npm test       # engine, validation, analysis, tenant-isolation tests
npm run build  # type-check + compile to dist/
```
