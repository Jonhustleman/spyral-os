/**
 * SPYRAL OS — Kernel Contract
 * LearningRecord — An immutable record of a single learning update.
 *
 * Per ADR-0037, each LearningRecord ties one or more Outcomes to one or more
 * Patterns, recording the moment the system learned something.
 *
 * Per ADR-0041 (Platform Memory), SPYRAL remembers relationships, not conversations.
 * LearningRecords are the durable evidence of those relationships.
 */

import type { Entity } from "./identity/Entity";

/**
 * A single immutable learning event.
 * Records which outcomes contributed to which patterns at a point in time.
 */
export interface LearningRecord extends Entity {
  /** The Outcome IDs that triggered this learning update. */
  outcomeIds: string[];

  /** The Pattern IDs that were affected (created, strengthened, or weakened). */
  patternIds: string[];

  /** The confidence delta applied to the affected patterns. */
  confidenceDelta: number;

  /** Optional description of what was learned. */
  description?: string;

  /** The confidence after this learning event. */
  confidence: number;
}
