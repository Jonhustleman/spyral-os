/**
 * DecisionOutcome — The result of executing a decision.
 *
 * Per ADR-0017, execution is mutable — outcomes can be updated
 * as work progresses through different states.
 */

export type DecisionOutcomeStatus =
  | "pending"
  | "in-progress"
  | "completed"
  | "failed"
  | "cancelled";

export interface DecisionOutcome {
  /** The ID of the decision this outcome corresponds to. */
  decisionId: string;

  /** Current status of execution. */
  status: DecisionOutcomeStatus;

  /** Actual results observed (free-form, structured later). */
  actualResults?: string;

  /** Lessons learned. */
  lessonsLearned?: string;

  /** When the outcome was last updated. */
  updatedAt: Date;
}
