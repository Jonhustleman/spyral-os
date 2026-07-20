/**
 * SPYRAL OS — Kernel Contract
 * RealityGoal — a desired future state.
 *
 * The goal answers: "Where does the user want to be?"
 *
 * FROZEN — Core API.
 */

import type { Entity } from "./identity/Entity";

/**
 * A goal represents a desired outcome the user is working toward.
 * It defines the target state that the gap analysis compares against.
 */
export interface RealityGoal extends Entity {
  /** The workspace this goal belongs to. */
  workspaceId: string;

  /** Short human-readable title. */
  title: string;

  /** Detailed description of the desired outcome. */
  description: string;

  /** The target metric values that define success. */
  targetMetrics: RealityTargetMetric[];

  /** Optional target date for achieving this goal. */
  targetDate?: Date;

  /** Whether this is the primary active goal. */
  isPrimary: boolean;
}

/**
 * A specific target metric within a goal.
 */
export interface RealityTargetMetric {
  /** Metric name (must match a RealityMetric name for comparison). */
  name: string;

  /** Target value to reach. */
  targetValue: number;

  /** Unit of measurement. */
  unit?: string;
}
