/**
 * SPYRAL OS — Kernel Contract
 * Outcome — The conclusion of a validation cycle for a Decision.
 *
 * Every Decision should eventually accumulate Outcomes.
 * Dependency chain (ADR-0035):
 *   Decision → Execution → Validation → Outcome → Learning
 *
 * An Outcome represents the accumulated wisdom from executing a decision
 * and validating its effects. It is the raw material the Learning Engine consumes.
 */

import type { Entity } from "./identity/Entity";
import type { Variance } from "./Variance";
import type { ConfidenceScore } from "./ConfidenceScore";

/**
 * The overall result of a validation cycle.
 */
export type OutcomeResult = "expected_met" | "partial" | "missed" | "inconclusive";

/**
 * The accumulated result of validating an execution against reality.
 */
export interface Outcome extends Entity {
  /** The Decision this outcome is for. */
  readonly decisionId: string;

  /** The ValidationRun that produced this outcome. */
  readonly validationRunId: string;

  /** The overall result classification. */
  result: OutcomeResult;

  /** Variances for each metric that was validated. */
  variances: Variance[];

  /** Overall confidence in this outcome. */
  confidence: ConfidenceScore;

  /** Summary of what was learned from this validation cycle. */
  summary?: string;

  /** Key insights extracted from the validation. */
  insights: string[];
}
