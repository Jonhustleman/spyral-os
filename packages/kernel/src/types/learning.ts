/**
 * @spyral/kernel — Learning Domain Types
 *
 * Per ADR-0037: LearningRecords are immutable.
 * They tie outcomes to patterns, recording when the system learned.
 * Per ADR-0041: SPYRAL remembers relationships, not conversations.
 */

import type { DomainEntity } from "./common.js";

export type LearningRecordType = "insight" | "pattern" | "lesson" | "recommendation";

export interface LearningRecord extends DomainEntity {
  workspaceId: string;
  decisionId?: string;
  outcomeIds: string[];
  patternIds: string[];
  type: LearningRecordType;
  content: string;
  confidence: number;
  confidenceDelta: number;
  description?: string;
}

export interface Pattern extends DomainEntity {
  workspaceId: string;
  name: string;
  description: string;
  type: LearningRecordType;
  frequency: number;
  observations: string[];
  recommendation?: string;
  confidence: number;
  relatedPatternIds: string[];
}
