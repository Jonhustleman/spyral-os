/**
 * SQLite-backed DecisionRepository implementation.
 *
 * Phase D.3 — Infrastructure Adapters
 */

import type { TenantContext, Decision, DecisionOption, DecisionRepository } from "@spyral/kernel";
import { BaseSqliteRepository } from "./base-repository.js";

interface DecisionRow {
  id: string;
  workspace_id: string;
  owner_id: string;
  org_id: string;
  title: string;
  description: string | null;
  intent: string;
  context: string;
  options: string;
  status: string;
  recommended_option_id: string | null;
  selected_option_id: string | null;
  confidence: number;
  tags: string;
  created_at: string;
  updated_at: string;
}

function rowToDecision(row: DecisionRow): Decision {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    ownerId: row.owner_id,
    orgId: row.org_id,
    title: row.title,
    description: row.description ?? undefined,
    intent: row.intent,
    context: row.context,
    options: JSON.parse(row.options) as DecisionOption[],
    status: row.status as Decision["status"],
    recommendedOptionId: row.recommended_option_id ?? undefined,
    selectedOptionId: row.selected_option_id ?? undefined,
    confidence: row.confidence,
    tags: JSON.parse(row.tags) as string[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function decisionToRow(decision: Decision): DecisionRow {
  return {
    id: decision.id,
    workspace_id: decision.workspaceId,
    owner_id: decision.ownerId,
    org_id: decision.orgId,
    title: decision.title,
    description: decision.description ?? null,
    intent: decision.intent,
    context: decision.context,
    options: JSON.stringify(decision.options),
    status: decision.status,
    recommended_option_id: decision.recommendedOptionId ?? null,
    selected_option_id: decision.selectedOptionId ?? null,
    confidence: decision.confidence,
    tags: JSON.stringify(decision.tags),
    created_at: decision.createdAt,
    updated_at: decision.updatedAt,
  };
}

export class SqliteDecisionRepository extends BaseSqliteRepository implements DecisionRepository {
  async findById(ctx: TenantContext, id: string): Promise<Decision | undefined> {
    const row = this.db.prepare("SELECT * FROM decisions WHERE id = ?").get(id) as DecisionRow | undefined;
    return row ? rowToDecision(row) : undefined;
  }

  async findAll(ctx: TenantContext): Promise<Decision[]> {
    const rows = this.db.prepare("SELECT * FROM decisions ORDER BY created_at DESC").all() as DecisionRow[];
    return rows.map(rowToDecision);
  }

  async findByWorkspaceId(ctx: TenantContext, workspaceId: string): Promise<Decision[]> {
    const rows = this.db.prepare("SELECT * FROM decisions WHERE workspace_id = ? ORDER BY created_at DESC").all(workspaceId) as DecisionRow[];
    return rows.map(rowToDecision);
  }

  async findByStatus(ctx: TenantContext, status: Decision["status"]): Promise<Decision[]> {
    const rows = this.db.prepare("SELECT * FROM decisions WHERE status = ? ORDER BY created_at DESC").all(status) as DecisionRow[];
    return rows.map(rowToDecision);
  }

  async save(ctx: TenantContext, decision: Decision): Promise<Decision> {
    const row = decisionToRow(decision);

    this.db.prepare(`
      INSERT OR REPLACE INTO decisions
        (id, workspace_id, owner_id, org_id, title, description, intent, context,
         options, status, recommended_option_id, selected_option_id, confidence,
         tags, created_at, updated_at)
      VALUES
        (@id, @workspace_id, @owner_id, @org_id, @title, @description, @intent, @context,
         @options, @status, @recommended_option_id, @selected_option_id, @confidence,
         @tags, @created_at, @updated_at)
    `).run(row);

    return decision;
  }

  async delete(ctx: TenantContext, id: string): Promise<boolean> {
    const result = this.db.prepare("DELETE FROM decisions WHERE id = ?").run(id);
    return result.changes > 0;
  }

  async addOption(ctx: TenantContext, decisionId: string, option: DecisionOption): Promise<Decision> {
    const decision = await this.findById(ctx, decisionId);
    if (!decision) throw new Error(`Decision not found: ${decisionId}`);

    const updated: Decision = {
      ...decision,
      options: [...decision.options, option],
      updatedAt: new Date().toISOString(),
    };

    return this.save(ctx, updated);
  }

  async selectOption(ctx: TenantContext, decisionId: string, optionId: string): Promise<Decision> {
    const decision = await this.findById(ctx, decisionId);
    if (!decision) throw new Error(`Decision not found: ${decisionId}`);

    const updated: Decision = {
      ...decision,
      selectedOptionId: optionId,
      status: "executing",
      updatedAt: new Date().toISOString(),
    };

    return this.save(ctx, updated);
  }
}
