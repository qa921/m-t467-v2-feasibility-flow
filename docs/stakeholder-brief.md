# M-T467-V2 — raw stakeholder brief (source state)

Status: **unapproved working notes**, captured 2026-09-10. This is not an implementation specification or acceptance sign-off.

The intended experience is a continuous tenant-scoped flow: Project → Inputs → Baseline → Scenario comparison / sensitivity → Report. Revenue, costs, cashflow, NPV, IRR, and affordability must be computed by a calculation engine that is independent of narrative/report rendering. Financial labels, currency, period and unit must come from one shared convention and display source timestamp plus rounding rule.

Source fixture contract:
- `fixtures/projects.json` is the latest captured project-input source. It has 20 `demo:true` projects across two tenants. Records explicitly marked `costCompleteness: incomplete` must remain validation exceptions rather than be silently repaired.
- `fixtures/scenario-changes.json` gives two proposed scenarios per project. These are input deltas, not computed results.
- `fixtures/legacy-artifacts.json` is a dated, stale destination snapshot from a prior UI/report prototype. It intentionally has wrong labels, missing cross-links, old currency / period information, or no report reference. Do not treat it as authoritative financial data.

Open decisions intentionally left for delivery: persistence schema and tenancy enforcement; validation behavior; calculation formulas/assumptions; narrative/report output; regression and boundary tests; deployment revision; database and domain verification.
