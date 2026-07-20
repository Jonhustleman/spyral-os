/**
 * LearningCapability — Learning loop management for SPYRAL.
 *
 * Manages learning records, patterns, and insights derived from
 * decision outcomes and execution results.
 *
 * Phase 2 — Milestone B.3 (Domain Capabilities)
 */

import type {
  TenantContext,
  LearningRecord,
  LearningRecordRepository,
  Pattern,
  PatternRepository,
} from "@spyral/kernel";

export interface RecordLearningInput {
  workspaceId: string;
  decisionId?: string;
  outcomeIds: string[];
  type: LearningRecord["type"];
  content: string;
  confidence: number;
  description?: string;
}

export class LearningCapability {
  constructor(
    private readonly learningRepo: LearningRecordRepository,
    private readonly patternRepo: PatternRepository,
  ) {}

  /** Record a learning event */
  async recordLearning(ctx: TenantContext, input: RecordLearningInput): Promise<LearningRecord> {
    const now = new Date().toISOString();
    const recordId = generateId("learn");

    const record: LearningRecord = {
      id: recordId,
      workspaceId: input.workspaceId,
      decisionId: input.decisionId,
      outcomeIds: input.outcomeIds,
      patternIds: [],
      type: input.type,
      content: input.content,
      confidence: input.confidence,
      confidenceDelta: 0,
      description: input.description,
      createdAt: now,
      updatedAt: now,
    };

    return this.learningRepo.save(ctx, record);
  }

  /** Get learning records for a decision */
  async getByDecision(ctx: TenantContext, decisionId: string): Promise<LearningRecord[]> {
    return this.learningRepo.findByDecisionId(ctx, decisionId);
  }

  /** Get patterns by minimum frequency */
  async getPatternsByFrequency(ctx: TenantContext, minFrequency: number): Promise<Pattern[]> {
    return this.patternRepo.findByFrequency(ctx, minFrequency);
  }

  /** List all learning records for a workspace */
  async listByWorkspace(ctx: TenantContext, workspaceId: string): Promise<LearningRecord[]> {
    const all = await this.learningRepo.findAll(ctx);
    return all.filter((r) => r.workspaceId === workspaceId);
  }
}

// ─── ID Generation ───────────────────────────────────────────────────────────

let counter = 0;

function generateId(prefix: string): string {
  counter++;
  const timestamp = Date.now().toString(36);
  return `${prefix}_${timestamp}_${counter.toString(36).padStart(4, "0")}`;
}
