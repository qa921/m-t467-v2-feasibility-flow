import { describe, expect, it } from 'vitest';
import { evaluate, applyScenarioDelta } from './engine.js';
import { annualPctToMonthlyRate, irrMonthly, npv } from './metrics.js';
import { buildMonthlyCashflow } from './cashflow.js';
import { validateProject } from '../domain/validation.js';
import { DemoProjectRepository } from '../data/demo/demoRepository.js';
import type { ProjectInput } from './types.js';

const base: ProjectInput = {
  id: 't-1',
  tenantId: 'northwind-dev',
  demo: true,
  name: 'Test Project',
  currency: 'EUR',
  periodUnit: 'month',
  unit: 'EUR',
  horizonPeriods: 24,
  discountRatePct: 6,
  marginTargetPct: 15,
  revenue: 2400000,
  landCost: 400000,
  buildCost: 1000000,
  softCost: 200000,
  financingCost: 100000,
  costCompleteness: 'complete',
  sourceAsOf: '2026-09-10',
};

describe('cashflow (provisional linear distribution)', () => {
  it('distributes revenue and cost linearly and sums to totals', () => {
    const cf = buildMonthlyCashflow(base);
    expect(cf).toHaveLength(24);
    expect(cf.reduce((a, p) => a + p.revenue, 0)).toBeCloseTo(2400000);
    expect(cf.reduce((a, p) => a + p.cost, 0)).toBeCloseTo(1700000);
    expect(cf[0].net).toBeCloseTo(cf[0].revenue - cf[0].cost);
  });
});

describe('metrics', () => {
  it('converts annual pct to effective monthly rate', () => {
    expect(annualPctToMonthlyRate(12)).toBeCloseTo(Math.pow(1.12, 1 / 12) - 1);
  });
  it('computes NPV of a known series', () => {
    expect(npv([100, 100], 0.1)).toBeCloseTo(100 / 1.1 + 100 / 1.21);
  });
  it('returns null IRR when the series has no sign change', () => {
    expect(irrMonthly([1, 1, 1])).toBeNull();
  });
  it('finds the monthly IRR of a sign-changing series', () => {
    const irr = irrMonthly([-1000, 600, 600]);
    expect(irr).not.toBeNull();
    expect(npv([-1000, 600, 600], irr!)).toBeCloseTo(0, 4);
  });
});

describe('evaluation', () => {
  it('computes a baseline for a complete project', () => {
    const r = evaluate(base);
    expect(r.status).toBe('ok');
    if (r.status === 'ok') {
      expect(r.results.totalCost).toBe(1700000);
      expect(r.results.netCashflow).toBe(700000);
      expect(r.results.marginTargetPctInfo).toBe(15);
      expect(r.meta.assumptionsVersion).toContain('provisional');
      expect(r.meta.currency).toBe('EUR');
      expect(r.meta.periodUnit).toBe('month');
      expect(r.meta.demo).toBe(true);
    }
  });

  it('blocks incomplete projects without fabricating results', () => {
    const incomplete: ProjectInput = {
      ...base,
      id: 't-2',
      buildCost: null,
      costCompleteness: 'incomplete',
      missingFields: ['buildCost'],
    };
    const r = evaluate(incomplete);
    expect(r.status).toBe('validation-exception');
    expect(r.results).toBeNull();
    if (r.status === 'validation-exception') {
      expect(r.exceptions[0].fields).toContain('buildCost');
    }
  });

  it('honours the explicit incomplete flag even when the flagged value is present', () => {
    const flagged: ProjectInput = {
      ...base,
      costCompleteness: 'incomplete',
      missingFields: ['financingCost'],
    };
    const r = evaluate(flagged);
    expect(r.status).toBe('validation-exception');
    if (r.status === 'validation-exception') {
      expect(r.exceptions[0].fields).toContain('financingCost');
    }
  });

  it('applies scenario deltas as input changes', () => {
    const s = applyScenarioDelta(base, {
      id: 's-1',
      projectId: 't-1',
      name: 'upside',
      changes: { revenuePct: 10, buildCostPct: 5, horizonMonths: -2, discountRatePct: 0.5 },
    });
    expect(s.revenue).toBeCloseTo(2640000);
    expect(s.buildCost).toBeCloseTo(1050000);
    expect(s.horizonPeriods).toBe(22);
    expect(s.discountRatePct).toBe(6.5);
  });

  it('keeps scenarios on incomplete projects as validation exceptions', () => {
    const incomplete: ProjectInput = {
      ...base,
      buildCost: null,
      costCompleteness: 'incomplete',
      missingFields: ['buildCost'],
    };
    const r = evaluate(
      applyScenarioDelta(incomplete, {
        id: 's-2',
        projectId: 't-1',
        name: 'stress',
        changes: { buildCostPct: 15 },
      }),
    );
    expect(r.status).toBe('validation-exception');
    expect(r.results).toBeNull();
  });
});

describe('validation', () => {
  it('returns no exceptions for complete projects', () => {
    expect(validateProject(base)).toHaveLength(0);
  });
});

describe('tenant isolation (demo repository)', () => {
  it('returns only the requested tenant\'s projects', async () => {
    const repo = new DemoProjectRepository();
    const nw = await repo.listProjects('northwind-dev');
    const co = await repo.listProjects('contoso-sandbox');
    expect(nw).toHaveLength(10);
    expect(co).toHaveLength(10);
    expect(nw.every((p) => p.tenantId === 'northwind-dev')).toBe(true);
    expect(co.every((p) => p.tenantId === 'contoso-sandbox')).toBe(true);
  });

  it('does not leak a project across tenants', async () => {
    const repo = new DemoProjectRepository();
    expect(await repo.getProject('contoso-sandbox', 'src-p01')).toBeNull();
    expect(await repo.getProject('northwind-dev', 'src-p01')).not.toBeNull();
  });

  it('scopes scenarios to the tenant', async () => {
    const repo = new DemoProjectRepository();
    expect(await repo.listScenarios('northwind-dev', 'src-p11')).toEqual([]);
    expect(await repo.listScenarios('northwind-dev', 'src-p01')).toHaveLength(2);
  });

  it('lists exactly the two fixture tenants', async () => {
    const repo = new DemoProjectRepository();
    expect(await repo.listTenants()).toEqual(['contoso-sandbox', 'northwind-dev']);
  });
});
