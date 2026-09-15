import type { ProjectInput, ScenarioDelta } from '../engine/types.js';

/**
 * Tenant-scoped access layer. EVERY method requires a tenantId and must never
 * return data belonging to another tenant. Cross-tenant ids resolve to
 * null / empty, not to an error that reveals existence.
 */
export interface ProjectRepository {
  listTenants(): Promise<string[]>;
  listProjects(tenantId: string): Promise<ProjectInput[]>;
  getProject(tenantId: string, projectId: string): Promise<ProjectInput | null>;
  listScenarios(tenantId: string, projectId: string): Promise<ScenarioDelta[]>;
}
