import type { MonthlyCashflowPoint, ProjectInput } from './types.js';

/**
 * Builds the monthly cashflow series for a project.
 *
 * PROVISIONAL (assumption DIST-LINEAR-MONTHLY): revenue and total cost are
 * spread as equal monthly amounts over horizonPeriods. Callers must run
 * validation first (src/domain/validation.ts); null cost fields are only
 * tolerated here as a defensive fallback and indicate an upstream bug.
 */
export function buildMonthlyCashflow(project: ProjectInput): MonthlyCashflowPoint[] {
  const n = project.horizonPeriods;
  const totalCost =
    (project.landCost ?? 0) +
    (project.buildCost ?? 0) +
    (project.softCost ?? 0) +
    (project.financingCost ?? 0);
  const monthlyRevenue = project.revenue / n;
  const monthlyCost = totalCost / n;

  const points: MonthlyCashflowPoint[] = [];
  for (let period = 1; period <= n; period++) {
    points.push({
      period,
      revenue: monthlyRevenue,
      cost: monthlyCost,
      net: monthlyRevenue - monthlyCost,
    });
  }
  return points;
}
