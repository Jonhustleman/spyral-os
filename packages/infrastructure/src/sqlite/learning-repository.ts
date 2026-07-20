/**
 * SQLite-backed LearningRecordRepository implementation.
 *
 * Phase D.3 — Infrastructure Adapters
 */

import type { TenantContext, LearningRecord, LearningRecordRepository } from "@spyral/kernel";
import { BaseSqliteRepository } from "./base-repository.js";

interface LearningRecordRow {
  id: string;
  workspace_id: string;
  decision_id: string | null;
  outcome_ids: string;
  pattern_ids: string;
  type: string;
  content: string;
  confidence: number;
  confidence_delta: number;
  description: string | null;
  created_at: string;
  updated_at: string;
}

function rowToLearningRecord(row: LearningRecordRow): LearningRecord {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    decisionId: row.decision_id ?? undefined,
    outcomeIds: JSON.parse(row.outcome_ids) as string[],
    patternIds: JSON.parse(row.pattern_ids) as string[],
    type: row.type as LearningRecord["type"],
    content: row.content,
    confidence: row.confidence,
    confidenceDelta: row.confidence_delta,
    description: row.description ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function learningRecordToRow(record: LearningRecord): LearningRecordRow {
  return {
    id: record.id,
    workspace_id: record.workspaceId,
    decision_id: record.decisionId ?? null,
    outcome_ids: JSON.stringify(record.outcomeIds),
    pattern_ids: JSON.stringify(record.patternIds),
    type: record.type,
    content: record.content,
    confidence: record.confidence,
    confidence_delta: record.confidenceDelta,
    description: record.description ?? null,
    created_at: record.createdAt,
    updated_at: record.updatedAt,
  };
}

export class SqliteLearningRecordRepository extends BaseSqliteRepository implements LearningRecordRepository {
  async findById(ctx: TenantContext, id: string): Promise<LearningRecord | undefined> {
    const row = this.db.prepare("SELECT * FROM learning_records WHERE id = ?").get(id) as LearningRecordRow | undefined;
    return row ? rowToLearningRecord(row) : undefined;
  }

  async findAll(ctx: TenantContext): Promise<LearningRecord[]> {
    const rows = this.db.prepare("SELECT * FROM learning_records ORDER BY created_at DESC").all() as LearningRecordRow[];
    return rows.map(rowToLearningRecord);
  }

  async findByDecisionId(ctx: TenantContext, decisionId: string): Promise<LearningRecord[]> {
    const rows = this.db.prepare("SELECT * FROM learning_records WHERE decision_id = ? ORDER BY created_at DESC").all(decisionId) as LearningRecordRow[];
    return rows.map(rowToLearningRecord);
  }

  async findByPatternId(ctx: TenantContext, patternId: string): Promise<LearningRecord[]> {
    // Search via JSON array containment
    const rows = this.db.prepare(
      "SELECT * FROM learning_records WHERE pattern_ids LIKE ? ORDER BY created_at DESC",
    ).all(`%"${patternId}"%`) as LearningRecordRow[];
    return rows.map(rowToLearningRecord);
  }

  async findByType(ctx: TenantContext, type: LearningRecord["type"]): Promise<LearningRecord[]> {
    const rows = this.db.prepare("SELECT * FROM learning_records WHERE type = ? ORDER BY created_at DESC").all(type) as LearningRecordRow[];
    return rows.map(rowToLearningRecord);
  }

  async save(ctx: TenantContext, record: LearningRecord): Promise<LearningRecord> {
    const row = learningRecordToRow(record);

    this.db.prepare(`
      INSERT OR REPLACE INTO learning_records
        (id, workspace_id, decision_id, outcome_ids, pattern_ids, type, content,
         confidence, confidence_delta, description, created_at, updated_at)
      VALUES
        (@id, @workspace_id, @decision_id, @outcome_ids, @pattern_ids, @type, @content,
         @confidence, @confidence_delta, @description, @created_at, @updated_at)
    `).run(row);

    return record;
  }

  async delete(ctx: TenantContext, id: string): Promise<boolean> {
    const result = this.db.prepare("DELETE FROM learning_records WHERE id = ?").run(id);
    return result.changes > 0;
  }
}
