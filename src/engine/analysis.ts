import { applyScenarioDelta, evaluate } from './engine.js';
import { roundTo } from './metrics.js';
import { DISPLAY_CONVENTIONS } from '../domain/conventions.js';
import type {
  EvaluationMeta,
  ProjectInput,
  ScenarioDelta,
  ValidationException,
} from './types.js';

/**
 * Provisional exploratory analyses. Both are informational only and inherit
 * every provisional assumption of the engine (see assumptions.ts). Neither
 * treats marginTargetPct as an approved rule.
 */

export type SensitivityDriver = 'revenuePct' | 'buildCostPct' | 'discountRatePct';

/** PROVISIONAL (SENSITIVITY-ONE-WAY): fixed one-way grid. */
export const SENSITIVITY_GRID: Record<SensitivityDriver, number[]> = {
  revenuePct: [-10, -5, 5, 10],
  buildCostPct: [-10, -5, 5, 10],
  // discountRatePct steps are percentage POINTS, matching the scenario-delta convention.
  discountRatePct: [-1, -0.5, 0.5, 1],
};

export interface SensitivityRow {
  driver: SensitivityDriver;
  change: number;
  marginPct: number;
  npv: number;
}

export type SensitivityResult =
  | { status: 'ok'; rows: SensitivityRow[]; meta: EvaluationMeta }
  | { status: 'validation-exception'; exceptions: ValidationException[]; rows: null; meta: EvaluationMeta };

export function sensitivityAnalysis(
  project: ProjectInput,
  grid: Record<SensitivityDriver, number[]> = SENSITIVITY_GRID,
): SensitivityResult {
  const baseEval = evaluate(project);
  if (baseEval.status !== 'ok') {
    return {
      status: 'validation-exception',
      exceptions: baseEval.exceptions,
      rows: null,
      meta: baseEval.meta,
    };
  }
  const rows: SensitivityRow[] = [];
  for (const driver of Object.keys(grid) as SensitivityDriver[]) {
    for (const change of grid[driver]) {
      const delta: ScenarioDelta = {
        id: `sens-${driver}-${change}`,
        projectId: project.id,
        name: `Sensitivity ${driver} ${change > 0 ? '+' : ''}${change}`,
        changes: { [driver]: change },
      };
      const ev = evaluate(applyScenarioDelta(project, delta));
      if (ev.status === 'ok') {
        rows.push({ driver, change, marginPct: ev.results.marginPct, npv: ev.results.npv });
      }
    }
  }
  return { status: 'ok', rows, meta: baseEval.meta };
}

export type GoalSeekResult =
  | {
      status: 'ok';
      feasible: true;
      targetMarginPct: number;
      currentMarginPct: number;
      requiredRevenue: number;
      requiredRevenueChangePct: number;
      meta: EvaluationMeta;
    }
  | { status: 'ok'; feasible: false; reason: string; meta: EvaluationMeta }
  | { status: 'validation-exception'; exceptions: ValidationException[]; meta: EvaluationMeta };

/**
 * PROVISIONAL (GOAL-SEEK-INFO-ONLY): solves requiredRevenue such that
 * (requiredRevenue - totalCost) / requiredRevenue = marginTargetPct, holding
 * costs fixed. Purely informational — marginTargetPct is not an approved
 * threshold and this output is not a recommendation.
 */
export function goalSeekMargin(project: ProjectInput): GoalSeekResult {
  const baseEval = evaluate(project);
  if (baseEval.status !== 'ok') {
    return {
      status: 'validation-exception',
      exceptions: baseEval.exceptions,
      meta: baseEval.meta,
    };
  }
  const target = project.marginTargetPct;
  if (target >= 100 || target <= -100) {
    return {
      status: 'ok',
      feasible: false,
      reason: 'Target margin outside the solvable range (-100, 100).',
      meta: baseEval.meta,
    };
  }
  const { moneyDecimals, rateDecimals } = DISPLAY_CONVENTIONS.rounding;
  const totalCost = baseEval.results.totalCost;
  const requiredRevenue = totalCost / (1 - target / 100);
  return {
    status: 'ok',
    feasible: true,
    targetMarginPct: target,
    currentMarginPct: baseEval.results.marginPct,
    requiredRevenue: roundTo(requiredRevenue, moneyDecimals),
    requiredRevenueChangePct: roundTo((requiredRevenue / project.revenue - 1) * 100, rateDecimals),
    meta: baseEval.meta,
  };
}
