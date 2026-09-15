import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { ProjectRepository } from '../data/repository.js';
import { DemoProjectRepository } from '../data/demo/demoRepository.js';
import { NeonProjectRepository } from '../data/neon/neonRepository.js';
import {
  evaluate,
  evaluateScenario,
  PROVISIONAL_ASSUMPTIONS,
  ASSUMPTION_SET_VERSION,
} from '../engine/engine.js';
import { DISPLAY_CONVENTIONS } from '../domain/conventions.js';

/** Selects the persistence implementation. Default: demo fixtures. */
export function createRepository(): ProjectRepository {
  if (process.env.PERSISTENCE === 'neon') {
    return new NeonProjectRepository(process.env.NEON_DATABASE_URL);
  }
  return new DemoProjectRepository();
}

export function createApp(repo: ProjectRepository = createRepository()) {
  const app = express();
  app.use(express.json());

  // Demo tenancy model: the tenant is carried by the x-tenant-id header and
  // every repository call is scoped by it. There is no auth in this demo.
  app.use('/api', (req, res, next) => {
    const open = ['/tenants', '/assumptions', '/conventions'];
    const tenantId = req.header('x-tenant-id');
    if (!tenantId && !open.includes(req.path)) {
      res.status(400).json({ error: 'Missing x-tenant-id header' });
      return;
    }
    res.locals.tenantId = tenantId;
    next();
  });

  app.get('/api/tenants', async (_req, res) => {
    res.json(await repo.listTenants());
  });

  app.get('/api/assumptions', (_req, res) => {
    res.json({
      version: ASSUMPTION_SET_VERSION,
      status: 'PROVISIONAL — not approved rules',
      assumptions: PROVISIONAL_ASSUMPTIONS,
    });
  });

  app.get('/api/conventions', (_req, res) => {
    res.json(DISPLAY_CONVENTIONS);
  });

  app.get('/api/projects', async (_req, res) => {
    res.json(await repo.listProjects(res.locals.tenantId));
  });

  app.get('/api/projects/:id', async (req, res) => {
    const project = await repo.getProject(res.locals.tenantId, req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found for this tenant' });
      return;
    }
    res.json(project);
  });

  app.get('/api/projects/:id/scenarios', async (req, res) => {
    res.json(await repo.listScenarios(res.locals.tenantId, req.params.id));
  });

  app.get('/api/projects/:id/baseline', async (req, res) => {
    const project = await repo.getProject(res.locals.tenantId, req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found for this tenant' });
      return;
    }
    res.json(evaluate(project));
  });

  app.get('/api/projects/:id/scenarios/:scenarioId/evaluation', async (req, res) => {
    const project = await repo.getProject(res.locals.tenantId, req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found for this tenant' });
      return;
    }
    const scenarios = await repo.listScenarios(res.locals.tenantId, project.id);
    const delta = scenarios.find((s) => s.id === req.params.scenarioId);
    if (!delta) {
      res.status(404).json({ error: 'Scenario not found for this project' });
      return;
    }
    res.json(evaluateScenario(project, delta));
  });

  app.get('/api/projects/:id/report', async (req, res) => {
    const project = await repo.getProject(res.locals.tenantId, req.params.id);
    if (!project) {
      res.status(404).json({ error: 'Project not found for this tenant' });
      return;
    }
    const scenarios = await repo.listScenarios(res.locals.tenantId, project.id);
    res.json({
      reportKind: 'feasibility-report',
      generatedAt: new Date().toISOString(),
      demo: project.demo === true,
      project: { id: project.id, name: project.name, tenantId: project.tenantId },
      baseline: evaluate(project),
      scenarios: scenarios.map((s) => ({ scenario: s, evaluation: evaluateScenario(project, s) })),
      affordability: {
        status: 'pending-specification',
        note: 'No approved affordability formula exists; affordability is not computed (assumption AFFORDABILITY-PENDING).',
      },
      assumptions: {
        version: ASSUMPTION_SET_VERSION,
        status: 'PROVISIONAL — not approved rules',
        items: PROVISIONAL_ASSUMPTIONS,
      },
      conventions: DISPLAY_CONVENTIONS,
      currency: project.currency,
      periodUnit: DISPLAY_CONVENTIONS.periodUnit,
      unit: project.unit,
      sourceAsOf: project.sourceAsOf,
    });
  });

  const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../public');
  app.use(express.static(publicDir));

  return app;
}
