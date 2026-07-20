/**
 * SPYRAL OS — Kernel Contract
 * NavigationStage — The stages of a navigation journey.
 *
 * Per ADR-0047, a NavigationSession progresses through defined stages.
 * Each interaction should advance the user toward clarity and action.
 */

/**
 * The stage of a navigation journey.
 * Progresses through the operating cycle.
 */
export enum NavigationStage {
  /** User has expressed an intent. Needs clarification. */
  INTENT = "INTENT",

  /** Navigation is asking clarifying questions to fill gaps. */
  CLARIFICATION = "CLARIFICATION",

  /** Reality Studio is needed to assess current state. */
  REALITY = "REALITY",

  /** Gap analysis between current reality and desired goal. */
  GAP = "GAP",

  /** Decision Studio is needed to compare options. */
  DECISION = "DECISION",

  /** Execution Studio is needed to plan and track work. */
  EXECUTION = "EXECUTION",

  /** Journey has reached its destination. */
  COMPLETE = "COMPLETE",
}
