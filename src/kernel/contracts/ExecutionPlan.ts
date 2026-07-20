/**
 * SPYRAL OS — Kernel Contract
 * ExecutionPlan — The bridge between strategy and operations.
 *
 * Per ADR-0024, Execution is independent from Decision.
 * The Execution Plan consumes Decisions and produces Results.
 *
 * Hierarchy:
 *   Reality → Goal → Decision → Execution Plan → Milestone → WorkItem → Task
 *
 * Per ADR-0027 (No Orphan Objects), every Execution Plan must trace
 * back to a Decision or Goal through its TraceReference.
 */

import type { Entity } from "./identity/Entity";
import type { ExecutionStatus } from "./ExecutionStatus";
import type { TraceReference } from "./TraceReference";

/**
 * An execution plan orchestrates milestones and work items
 * to achieve the outcome specified by a Decision or Goal.
 */
export interface ExecutionPlan extends Entity {
  /** Human-readable title. */
  title: string;

  /** Optional detailed description of what this plan aims to achieve. */
  description?: string;

  /** IDs of milestones that make up this plan. */
  milestoneIds: string[];

  /** Current status of the overall plan. */
  status: ExecutionStatus;

  /** Traceability anchor — which Decision or Goal does this plan serve? */
  readonly trace: TraceReference;
}
