/**
 * SPYRAL OS — Kernel Contract
 * ExecutionReport — A snapshot of execution health at a point in time.
 *
 * Provides a dashboard view of:
 *   - Velocity (completed tasks over time)
 *   - Blockers (impediments to progress)
 *   - Completion percentage
 *   - Risk level
 *   - Forecast (predicted completion based on current velocity)
 */

import type { Entity } from "./identity/Entity";

export type RiskLevel = "low" | "medium" | "high";

/**
 * A point-in-time summary of execution health.
 */
export interface ExecutionReport extends Entity {
  /** The Execution Plan this report summarizes. */
  readonly executionPlanId: string;

  /** Number of completed tasks. */
  completedTasks: number;

  /** Total number of tasks in the plan. */
  totalTasks: number;

  /** Current velocity (tasks completed per unit time, if measurable). */
  velocity?: number;

  /** Active blockers across all milestones. */
  blockers: string[];

  /** Overall completion percentage (0–100). */
  completionPercent: number;

  /** Current risk assessment. */
  risk: RiskLevel;

  /** Predicted completion estimate based on current velocity. */
  forecast?: string;

  /** When this report was generated. */
  readonly generatedAt: string;
}
