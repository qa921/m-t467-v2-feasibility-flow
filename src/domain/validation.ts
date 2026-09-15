import type { ProjectInput, ValidationException } from '../engine/types.js';

export const COST_FIELDS = ['landCost', 'buildCost', 'softCost', 'financingCost'] as const;

/**
 * Source fixture contract: records explicitly flagged costCompleteness:
 * 'incomplete' MUST surface as validation exceptions and must never be
 * silently repaired. The explicit flag wins even when a value happens to be
 * present for a flagged field (dated discrepancies exist in the fixtures).
 */
export function validateProject(project: ProjectInput): ValidationException[] {
  const exceptions: ValidationException[] = [];
  if (project.costCompleteness === 'incomplete') {
    const flagged = project.missingFields ?? [];
    const actuallyNull = COST_FIELDS.filter(
      (f) => (project as unknown as Record<string, unknown>)[f] === null,
    );
    const fields = Array.from(new Set([...flagged, ...actuallyNull]));
    exceptions.push({
      code: 'INCOMPLETE_COST_INPUTS',
      fields,
      message: `Cost inputs incomplete (${fields.join(', ') || 'unspecified fields'}). Baseline, scenario and report outputs are blocked; no values are fabricated or repaired.`,
    });
  }
  return exceptions;
}
