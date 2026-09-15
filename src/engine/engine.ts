import {
  ASSUMPTION_SET_VERSION,
  PROVISIONAL_ASSUMPTIONS,
  assumptionIds,
} from './assumptions.js';
import { buildMonthlyCashflow } from './cashflow.js';
import {
  annualPctToMonthlyRate,
  annualiseMonthlyRate,
  irrMonthly,
  npv,
  roundTo,
} from './metrics.js';
import { DISPLAY_CONVENTIONS } from '../domain/conventions.js';
import { validateProject } from '../domain/validation.js';
import type {
  Evaluation,
  EvaluationMeta,
  ProjectInput,
  ScenarioDelta,
} from './types.js';

function metaFor(project: ProjectInput): EvaluationMeta {
  return {
    assumptionsVersion: ASSUMPTION_SET_VERSION,
    assumptionIds: assumptionIds(),
    currency: project.currency,
    periodUnit: DISPLAY_CONVENTIONS.periodUnit,
    unit: project.unit,
    sourceAsOf: project.sourceAsOf,
    rounding: { ...DISPLAY_CONVENTIONS.rounding },
    demo: project.demo === true,
  };
}

/**
 * Computes the baseline (or a scenario, after applyScenarioDelta) for a
 * project. Incomplete inputs produce a validation-exception evaluation with
 * results: null — nothing is fabricated or repaired.
 */
export function evaluate(project: ProjectInput): Evaluation {
  const meta = metaFor(project);
  const exceptions = validateProject(project);
  if (exceptions.length > 0) {
    return { status: 'validation-exception', exceptions, results: null, meta };
  }

  const cashflow = buildMonthlyCashflow(project);
  const nets = cashflow.map((p) => p.net);
  const monthlyRate = annualPctToMonthlyRate(project.discountRatePct);
  const totalCost =
    (project.landCost ?? 0) +
    (project.buildCost ?? 0) +
    (project.softCost ?? 0) +
    (project.financingCost ?? 0);
  const irrM = irrMonthly(nets);
  const { moneyDecimals, rateDecimals } = DISPLAY_CONVENTIONS.rounding;

  return {
    status: 'ok',
    results: {
      totalRevenue: roundTo(project.revenue, moneyDecimals),
      totalCost: roundTo(totalCost, moneyDecimals),
      netCashflow: roundTo(project.revenue - totalCost, moneyDecimals),
      marginPct: roundTo(((project.revenue - totalCost) / project.revenue) * 100, rateDecimals),
      marginTargetPctInfo: project.marginTargetPct, // informational only (MARGIN-INFO-ONLY)
      npv: roundTo(npv(nets, monthlyRate), moneyDecimals),
      irrAnnualPct: irrM === null ? null : roundTo(annualiseMonthlyRate(irrM) * 100, rateDecimals),
      monthlyCashflow: cashflow,
    },
    meta,
  };
}

/**
 * Applies a candidate scenario delta to a project's INPUTS. Deltas are inputs,
 * never precomputed results; the evaluation happens afterwards via evaluate().
 */
export function applyScenarioDelta(project: ProjectInput, delta: ScenarioDelta): ProjectInput {
  const c = delta.changes;
  const pct = (v: number | null, p?: number) => (v === null ? null : v * (1 + (p ?? 0) / 100));
  return {
    ...project,
    revenue: project.revenue * (1 + (c.revenuePct ?? 0) / 100),
    landCost: pct(project.landCost, c.landCostPct),
    buildCost: pct(project.buildCost, c.buildCostPct),
    softCost: pct(project.softCost, c.softCostPct),
    financingCost: pct(project.financingCost, c.financingCostPct),
    discountRatePct: project.discountRatePct + (c.discountRatePct ?? 0),
    horizonPeriods: project.horizonPeriods + (c.horizonMonths ?? 0),
  };
}

export function evaluateScenario(project: ProjectInput, delta: ScenarioDelta): Evaluation {
  return evaluate(applyScenarioDelta(project, delta));
}

export { PROVISIONAL_ASSUMPTIONS, ASSUMPTION_SET_VERSION };
