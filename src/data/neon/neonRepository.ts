import type { ProjectInput, ScenarioDelta } from '../../engine/types.js';
import type { ProjectRepository } from '../repository.js';

/**
 * Neon persistence adapter — NOT YET CONFIGURED.
 *
 * There is no dedicated Neon project for M-T467-V2, and the (unapproved)
 * brief leaves the persistence schema and tenancy enforcement as open
 * decisions. Do NOT point this adapter at a database owned by another effort.
 *
 * To enable later:
 *   1. Provision a dedicated Neon project for M-T467-V2.
 *   2. Get the DRAFT schema in src/data/neon/schema.sql approved, then apply it.
 *   3. Set NEON_DATABASE_URL and PERSISTENCE=neon.
 *   4. Implement the methods below; every query must filter by tenant_id
 *      (see the RLS notes in schema.sql).
 */
export class NeonProjectRepository implements ProjectRepository {
  constructor(private readonly connectionString: string | undefined) {}

  private unconfigured(): never {
    throw new Error(
      'NeonProjectRepository is not configured: no dedicated M-T467-V2 Neon project exists. Use PERSISTENCE=demo.',
    );
  }

  async listTenants(): Promise<string[]> {
    return this.unconfigured();
  }
  async listProjects(_tenantId: string): Promise<ProjectInput[]> {
    return this.unconfigured();
  }
  async getProject(_tenantId: string, _projectId: string): Promise<ProjectInput | null> {
    return this.unconfigured();
  }
  async listScenarios(_tenantId: string, _projectId: string): Promise<ScenarioDelta[]> {
    return this.unconfigured();
  }
}
