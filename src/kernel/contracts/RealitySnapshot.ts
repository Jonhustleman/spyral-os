/**
 * SPYRAL OS — Kernel Contract
 * RealitySnapshot — the canonical representation of a workspace's current state.
 *
 * The snapshot answers: "What is true right now?"
 *
 * It contains facts, not recommendations.
 * Everything else in the system depends on this.
 *
 * FROZEN — Core API.
 */

import type { Entity } from "./identity/Entity";
import type { RealityMetric } from "./RealityMetric";
import type { RealityGoal } from "./RealityGoal";
import type { RealityGap } from "./RealityGap";
import type { StatementType } from "./StatementType";

/**
 * A constraint that limits what actions are possible.
 */
export interface RealityConstraint {
  /** Description of the constraint. */
  description: string;

  /** Whether this constraint is active. */
  active: boolean;

  /** Classification per Rule #008 — uses shared StatementType enum. */
  statementType: StatementType;
}

/**
 * A piece of evidence supporting a reality statement.
 */
export interface RealityEvidence {
  /** Evidence identifier. */
  id: string;

  /** Short title. */
  title: string;

  /** The evidence content. */
  content: string;

  /** Source of the evidence. */
  source: string;

  /** When this evidence was collected. */
  collectedAt: Date;
}

/**
 * RealitySnapshot — the complete picture of a workspace's current reality.
 *
 * Contains all metrics, goals, gaps, evidence, and constraints
 * that define what is true for this workspace right now.
 */
export interface RealitySnapshot extends Entity {
  /** The workspace this snapshot represents. */
  workspaceId: string;

  /** Current metrics measuring reality. */
  metrics: RealityMetric[];

  /** Active goals the workspace is working toward. */
  goals: RealityGoal[];

  /** Calculated gaps between current and desired states. */
  gaps: RealityGap[];

  /** Assumptions that could affect reality. */
  assumptions: RealityConstraint[];

  /** Hard constraints that limit options. */
  constraints: RealityConstraint[];

  /** Evidence supporting the current reality picture. */
  evidence: RealityEvidence[];
}
