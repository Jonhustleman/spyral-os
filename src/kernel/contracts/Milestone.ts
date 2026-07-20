/**
 * SPYRAL OS — Kernel Contract
 * Milestone — A meaningful checkpoint within an Execution Plan.
 *
 * Milestones aggregate work items and provide health visibility:
 *   - completion percentage
 *   - predicted completion date
 *   - blockers
 *   - health status (on_track / at_risk / critical)
 */

import type { Entity } from "./identity/Entity";
import type { ExecutionStatus } from "./ExecutionStatus";
import type { TraceReference } from "./TraceReference";

export type MilestoneHealth = "on_track" | "at_risk" | "critical";

/**
 * A checkpoint within an Execution Plan that aggregates work items.
 */
export interface Milestone extends Entity {
  /** Human-readable title. */
  title: string;

  /** Optional detailed description. */
  description?: string;

  /** The Execution Plan this milestone belongs to. */
  readonly executionPlanId: string;

  /** IDs of work items under this milestone. */
  workItemIds: string[];

  /** Current status in the execution lifecycle. */
  status: ExecutionStatus;

  /** Completion percentage (0–100). */
  completionPercent: number;

  /** Predicted completion date, if calculable. */
  predictedCompletion?: string;

  /** Current blockers — free-form descriptions of impediments. */
  blockers: string[];

  /** Overall health indicator. */
  health: MilestoneHealth;

  /** Traceability anchor — why does this exist? */
  readonly trace: TraceReference;
}
