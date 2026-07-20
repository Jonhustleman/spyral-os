/**
 * SQLite-backed PatternRepository implementation.
 *
 * Phase D.3 — Infrastructure Adapters
 */

import type { TenantContext, Pattern, PatternRepository } from "@spyral/kernel";
import { BaseSqliteRepository } from "./base-repository.js";

interface PatternRow {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  type: string;
  frequency: number;
  observations: string;
  recommendation: string | null;
  confidence: number;
  related_pattern_ids: string;
  created_at: string;
  updated_at: string;
}

function rowToPattern(row: PatternRow): Pattern {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    name: row.name,
    description: row.description,
    type: row.type as Pattern["type"],
    frequency: row.frequency,
    observations: JSON.parse(row.observations) as string[],
    recommendation: row.recommendation ?? undefined,
    confidence: row.confidence,
    relatedPatternIds: JSON.parse(row.related_pattern_ids) as string[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function patternToRow(pattern: Pattern): PatternRow {
  return {
    id: pattern.id,
    workspace_id: pattern.workspaceId,
    name: pattern.name,
    description: pattern.description,
    type: pattern.type,
    frequency: pattern.frequency,
    observations: JSON.stringify(pattern.observations),
    recommendation: pattern.recommendation ?? null,
    confidence: pattern.confidence,
    related_pattern_ids: JSON.stringify(pattern.relatedPatternIds),
    created_at: pattern.createdAt,
    updated_at: pattern.updatedAt,
  };
}

export class SqlitePatternRepository extends BaseSqliteRepository implements PatternRepository {
  async findById(ctx: TenantContext, id: string): Promise<Pattern | undefined> {
    const row = this.db.prepare("SELECT * FROM patterns WHERE id = ?").get(id) as PatternRow | undefined;
    return row ? rowToPattern(row) : undefined;
  }

  async findAll(ctx: TenantContext): Promise<Pattern[]> {
    const rows = this.db.prepare("SELECT * FROM patterns ORDER BY frequency DESC, created_at DESC").all() as PatternRow[];
    return rows.map(rowToPattern);
  }

  async findByFrequency(ctx: TenantContext, minFrequency: number): Promise<Pattern[]> {
    const rows = this.db.prepare(
      "SELECT * FROM patterns WHERE frequency >= ? ORDER BY frequency DESC",
    ).all(minFrequency) as PatternRow[];
    return rows.map(rowToPattern);
  }

  async findByName(ctx: TenantContext, name: string): Promise<Pattern | undefined> {
    const row = this.db.prepare("SELECT * FROM patterns WHERE name = ?").get(name) as PatternRow | undefined;
    return row ? rowToPattern(row) : undefined;
  }

  async save(ctx: TenantContext, pattern: Pattern): Promise<Pattern> {
    const row = patternToRow(pattern);

    this.db.prepare(`
      INSERT OR REPLACE INTO patterns
        (id, workspace_id, name, description, type, frequency, observations,
         recommendation, confidence, related_pattern_ids, created_at, updated_at)
      VALUES
        (@id, @workspace_id, @name, @description, @type, @frequency, @observations,
         @recommendation, @confidence, @related_pattern_ids, @created_at, @updated_at)
    `).run(row);

    return pattern;
  }

  async delete(ctx: TenantContext, id: string): Promise<boolean> {
    const result = this.db.prepare("DELETE FROM patterns WHERE id = ?").run(id);
    return result.changes > 0;
  }
}
