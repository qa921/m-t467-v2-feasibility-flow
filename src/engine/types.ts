export type CostCompleteness = 'complete' | 'incomplete';

/** Project financial inputs, as captured in fixtures/projects.json (source-input-v1). */
export interface ProjectInput {
  id: string;
  tenantId: string;
  demo: boolean;
  name: string;
  currency: string;
  periodUnit: 'month';
  unit: string;
  horizonPeriods: number;
  discountRatePct: number;
  /** Informational comparison only (assumption MARGIN-INFO-ONLY). NOT an approved threshold. */
  marginTargetPct: number;
  revenue: number;
  landCost: number | null;
  buildCost: number | null;
  softCost: number | null;
  financingCost: number | null;
  costCompleteness: CostCompleteness;
  missingFields?: string[];
  sourceAsOf: string;
}

export interface ScenarioDeltaChanges {
  revenuePct?: number;
  landCostPct?: number;
  buildCostPct?: number;
  softCostPct?: number;
  financingCostPct?: number;
  discountRatePct?: number;
  horizonMonths?: number;
}

/** Candidate scenario INPUT delta. Never a precomputed result. */
export interface ScenarioDelta {
  id: string;
  projectId: string;
  name: string;
  changes: ScenarioDeltaChanges;
}

export interface MonthlyCashflowPoint {
  period: number; // 1-based month index
  revenue: number;
  cost: number;
  net: number;
}

export interface ValidationException {
  code: 'INCOMPLETE_COST_INPUTS';
  fields: string[];
  message: string;
}

export interface FinanceResults {
  totalRevenue: number;
  totalCost: number;
  netCashflow: number;
  marginPct: number;
  /** Echoed for side-by-side display. Informational only, never a pass/fail verdict. */
  marginTargetPctInfo: number;
  npv: number;
  /** Annualised IRR in percent; null when the monthly series has no sign change. */
  irrAnnualPct: number | null;
  monthlyCashflow: MonthlyCashflowPoint[];
}

/** Metadata attached to every evaluation so screens and reports stay consistent. */
export interface EvaluationMeta {
  assumptionsVersion: string;
  assumptionIds: string[];
  currency: string;
  periodUnit: string;
  unit: string;
  sourceAsOf: string;
  rounding: { moneyDecimals: number; rateDecimals: number };
  demo: boolean;
}

export type Evaluation =
  | { status: 'ok'; results: FinanceResults; meta: EvaluationMeta }
  | { status: 'validation-exception'; exceptions: ValidationException[]; results: null; meta: EvaluationMeta };
