/**
 * SPYRAL OS — Kernel Contract
 * RealityGap — the difference between current and desired reality.
 *
 * The gap answers: "What stands between the user and their goal?"
 *
 * This is where SPYRAL becomes different from ordinary dashboards:
 *   Current Reality → Desired Reality → Gap Analysis
 *
 * FROZEN — Core API.
 */

import type { Entity } from "./identity/Entity";

/**
 * The severity of a identified gap.
 */
export type GapSeverity = "critical" | "significant" | "moderate" | "minor";

/**
 * A gap represents a discrepancy between current metrics and target goals.
 * It drives the decision-making process by highlighting what needs attention.
 */
export interface RealityGap extends Entity {
  /** The workspace this gap belongs to. */
  workspaceId: string;

  /** The goal this gap is calculated against. */
  goalId: string;

  /** Short human-readable title. */
  title: string;

  /** Detailed description of the gap. */
  description: string;

  /** How severe this gap is. */
  severity: GapSeverity;

  /** The current value. */
  currentValue: number;

  /** The target value. */
  targetValue: number;

  /** The absolute difference (target - current). */
  absoluteGap: number;

  /** The percentage of completion (current / target * 100). */
  percentComplete: number;

  /** Unit of measurement. */
  unit?: string;

  /** Optional tags for categorization. */
  tags: string[];
}
