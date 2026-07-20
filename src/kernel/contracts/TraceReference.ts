/**
 * SPYRAL OS — Kernel Contract
 * TraceReference — Universal traceability anchor for every execution object.
 *
 * Per ADR-0028, every traceable object in the system must carry a structured
 * TraceReference instead of a flat traceId. This enables self-describing
 * provenance chains that can be resolved without external lookups.
 *
 * The dependency chain (ADR-0027):
 *   Workspace → Reality → Goal → Decision → Execution → Validation → Learning
 */

/**
 * Source types for the traceability chain.
 * Every execution object must trace back to one of these sources.
 */
export enum TraceSourceType {
  REALITY = "reality",
  GOAL = "goal",
  DECISION = "decision",
  EXECUTION = "execution",
  VALIDATION = "validation",
  LEARNING = "learning",
}

/**
 * A structured trace reference that answers "Why does this exist?"
 *
 * Every execution object (ExecutionPlan, Milestone, Task, etc.) contains
 * a TraceReference linking it to its origin in the dependency chain.
 */
export interface TraceReference {
  /** The ID of the source entity this object traces to. */
  readonly sourceId: string;

  /** The type of source entity. */
  readonly sourceType: TraceSourceType;
}
