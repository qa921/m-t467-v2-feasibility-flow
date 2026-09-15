import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import type { ProjectInput, ScenarioDelta } from '../engine/types.js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

/** fixtures/projects.json is the latest captured project-input source (source-input-v1). */
export function loadProjectsFixture(): ProjectInput[] {
  const raw = JSON.parse(readFileSync(path.join(repoRoot, 'fixtures/projects.json'), 'utf-8'));
  return raw.projects as ProjectInput[];
}

/** fixtures/scenario-changes.json holds candidate input deltas, not results. */
export function loadScenariosFixture(): ScenarioDelta[] {
  const raw = JSON.parse(readFileSync(path.join(repoRoot, 'fixtures/scenario-changes.json'), 'utf-8'));
  return raw.scenarios as ScenarioDelta[];
}

/**
 * NOTE: fixtures/legacy-artifacts.json is intentionally NOT loaded anywhere.
 * It is a stale snapshot with known label/currency/period defects and is not
 * authoritative financial data.
 */
