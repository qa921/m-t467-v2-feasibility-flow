/**
 * PROVISIONAL assumption registry.
 *
 * These assumptions exist ONLY to unblock the flow. No approved specification
 * exists for M-T467-V2 (the stakeholder brief is unapproved working notes), so
 * none of these are approved rules. Each assumption is versioned via
 * ASSUMPTION_SET_VERSION, surfaced in the app banner and embedded in every
 * report, and is individually replaceable once an approved specification lands.
 */
export const ASSUMPTION_SET_VERSION = 'provisional-2026-09-15.v1';

export interface Assumption {
  id: string;
  status: 'PROVISIONAL';
  summary: string;
  replacementPath: string;
}

export const PROVISIONAL_ASSUMPTIONS: readonly Assumption[] = [
  {
    id: 'DIST-LINEAR-MONTHLY',
    status: 'PROVISIONAL',
    summary:
      'Revenue and each cost component are distributed linearly (equal monthly amounts) across horizonPeriods when the input does not specify a schedule.',
    replacementPath:
      'Replace buildMonthlyCashflow() in src/engine/cashflow.ts with a schedule-aware distribution once an approved phasing model exists.',
  },
  {
    id: 'RATE-ANNUAL-TO-MONTHLY',
    status: 'PROVISIONAL',
    summary:
      'discountRatePct is treated as an annual percentage and converted to an effective monthly rate, (1 + r)^(1/12) - 1, used only for NPV discounting.',
    replacementPath:
      'Replace annualPctToMonthlyRate() in src/engine/metrics.ts if an approved rate convention (nominal vs effective, day count) is specified.',
  },
  {
    id: 'IRR-MONTHLY-CASHFLOW',
    status: 'PROVISIONAL',
    summary:
      'IRR is solved on the monthly net cashflow series and annualised as (1 + irr_monthly)^12 - 1. Reported as null when the series has no sign change.',
    replacementPath:
      'Replace irrMonthly()/annualiseMonthlyRate() in src/engine/metrics.ts if an approved IRR convention differs.',
  },
  {
    id: 'MARGIN-INFO-ONLY',
    status: 'PROVISIONAL',
    summary:
      'marginTargetPct is displayed as an informational comparison next to the computed margin. It is NOT an approved pass/fail criterion and must not be treated as a regulatory or program threshold.',
    replacementPath:
      'If an approved program rule ever defines margin thresholds, encode them explicitly and version the change here.',
  },
  {
    id: 'AFFORDABILITY-PENDING',
    status: 'PROVISIONAL',
    summary:
      'No affordability formula exists in any available source, so affordability is reported as "pending specification" and is NOT computed.',
    replacementPath:
      'Implement affordability in src/engine/engine.ts only after an approved formula is supplied.',
  },
];

export function assumptionIds(): string[] {
  return PROVISIONAL_ASSUMPTIONS.map((a) => a.id);
}
