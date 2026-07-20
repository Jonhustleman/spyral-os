/**
 * SPYRAL OS — Kernel Contract
 * ValidationRun — A single validation event.
 *
 * Represents the act of comparing a before-and-after reality snapshot
 * to determine whether an execution achieved its intended effect.
 *
 * Per ADR-0032, validation answers:
 *   "Did reality change as expected?"
 *
 * Per ADR-0035, validation produces Outcomes. Validation does not learn.
 * Learning consumes Outcomes.
 */

import type { Entity } from "./identity/Entity";
import type { ValidationMetric } from "./ValidationMetric";
import type { OutcomeResult } from "./Outcome";

/**
 * The status of a validation run.
 */
export type ValidationStatus = "pending" | "in_progress" | "completed" | "failed";

/**
 * A single evaluation event comparing a before/after reality snapshot.
 */
export interface ValidationRun extends Entity {
  /** The Execution Plan being validated. */
  readonly executionPlanId: string;

  /** Reality snapshot ID before execution began. */
  readonly realitySnapshotBefore: string;

  /** Reality snapshot ID after execution completed. */
  readonly realitySnapshotAfter: string;

  /** When this validation was performed. */
  readonly timestamp: string;

  /** Who or what performed the validation. */
  validator: string;

  /** Current status. */
  status: ValidationStatus;

  /** The metrics being validated. */
  metrics: ValidationMetric[];

  /** The overall result, if validation is complete. */
  result?: OutcomeResult;
}
