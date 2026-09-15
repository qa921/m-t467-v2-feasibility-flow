import type { ProjectInput, ScenarioDelta } from '../../engine/types.js';
import type { ProjectRepository } from '../repository.js';
import { loadProjectsFixture, loadScenariosFixture } from '../fixtureLoader.js';

/**
 * DEMO persistence implementation (clearly separated from the adapter
 * interface): read-only over the source fixtures, serving the 20 demo
 * projects and 40 scenario deltas. Every query is filtered by tenantId.
 * Project creation is intentionally not supported here — persistence is an
 * open decision pending a dedicated Neon project.
 */
export class DemoProjectRepository implements ProjectRepository {
  private readonly projects: ProjectInput[];
  private readonly scenarios: ScenarioDelta[];

  constructor() {
    this.projects = loadProjectsFixture().filter((p) => p.demo === true);
    this.scenarios = loadScenariosFixture();
  }

  async listTenants(): Promise<string[]> {
    return Array.from(new Set(this.projects.map((p) => p.tenantId))).sort();
  }

  async listProjects(tenantId: string): Promise<ProjectInput[]> {
    return this.projects.filter((p) => p.tenantId === tenantId);
  }

  async getProject(tenantId: string, projectId: string): Promise<ProjectInput | null> {
    return this.projects.find((p) => p.tenantId === tenantId && p.id === projectId) ?? null;
  }

  async listScenarios(tenantId: string, projectId: string): Promise<ScenarioDelta[]> {
    const project = await this.getProject(tenantId, projectId);
    if (!project) return [];
    return this.scenarios.filter((s) => s.projectId === project.id);
  }
}
