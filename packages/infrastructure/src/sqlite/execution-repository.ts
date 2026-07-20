/**
 * SQLite-backed ExecutionPlanRepository implementation.
 *
 * Phase D.3 — Infrastructure Adapters
 */

import type { TenantContext, ExecutionPlan, ExecutionStep, ExecutionPlanRepository } from "@spyral/kernel";
import { BaseSqliteRepository } from "./base-repository.js";

interface ExecutionPlanRow {
  id: string;
  workspace_id: string;
  decision_id: string;
  owner_id: string;
  org_id: string;
  title: string;
  description: string | null;
  steps: string;
  status: string;
  created_at: string;
  updated_at: string;
}

function rowToExecutionPlan(row: ExecutionPlanRow): ExecutionPlan {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    decisionId: row.decision_id,
    ownerId: row.owner_id,
    orgId: row.org_id,
    title: row.title,
    description: row.description ?? undefined,
    steps: JSON.parse(row.steps) as ExecutionStep[],
    status: row.status as ExecutionPlan["status"],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function executionPlanToRow(plan: ExecutionPlan): ExecutionPlanRow {
  return {
    id: plan.id,
    workspace_id: plan.workspaceId,
    decision_id: plan.decisionId,
    owner_id: plan.ownerId,
    org_id: plan.orgId,
    title: plan.title,
    description: plan.description ?? null,
    steps: JSON.stringify(plan.steps),
    status: plan.status,
    created_at: plan.createdAt,
    updated_at: plan.updatedAt,
  };
}

export class SqliteExecutionPlanRepository extends BaseSqliteRepository implements ExecutionPlanRepository {
  async findById(ctx: TenantContext, id: string): Promise<ExecutionPlan | undefined> {
    const row = this.db.prepare("SELECT * FROM execution_plans WHERE id = ?").get(id) as ExecutionPlanRow | undefined;
    return row ? rowToExecutionPlan(row) : undefined;
  }

  async findAll(ctx: TenantContext): Promise<ExecutionPlan[]> {
    const rows = this.db.prepare("SELECT * FROM execution_plans ORDER BY created_at DESC").all() as ExecutionPlanRow[];
    return rows.map(rowToExecutionPlan);
  }

  async findByDecisionId(ctx: TenantContext, decisionId: string): Promise<ExecutionPlan | undefined> {
    const row = this.db.prepare("SELECT * FROM execution_plans WHERE decision_id = ? ORDER BY created_at DESC LIMIT 1").get(decisionId) as ExecutionPlanRow | undefined;
    return row ? rowToExecutionPlan(row) : undefined;
  }

  async findByWorkspaceId(ctx: TenantContext, workspaceId: string): Promise<ExecutionPlan[]> {
    const rows = this.db.prepare("SELECT * FROM execution_plans WHERE workspace_id = ? ORDER BY created_at DESC").all(workspaceId) as ExecutionPlanRow[];
    return rows.map(rowToExecutionPlan);
  }

  async findByStatus(ctx: TenantContext, status: ExecutionPlan["status"]): Promise<ExecutionPlan[]> {
    const rows = this.db.prepare("SELECT * FROM execution_plans WHERE status = ? ORDER BY created_at DESC").all(status) as ExecutionPlanRow[];
    return rows.map(rowToExecutionPlan);
  }

  async save(ctx: TenantContext, plan: ExecutionPlan): Promise<ExecutionPlan> {
    const row = executionPlanToRow(plan);

    this.db.prepare(`
      INSERT OR REPLACE INTO execution_plans
        (id, workspace_id, decision_id, owner_id, org_id, title, description,
         steps, status, created_at, updated_at)
      VALUES
        (@id, @workspace_id, @decision_id, @owner_id, @org_id, @title, @description,
         @steps, @status, @created_at, @updated_at)
    `).run(row);

    return plan;
  }

  async delete(ctx: TenantContext, id: string): Promise<boolean> {
    const result = this.db.prepare("DELETE FROM execution_plans WHERE id = ?").run(id);
    return result.changes > 0;
  }

  async updateStep(ctx: TenantContext, planId: string, step: ExecutionStep): Promise<ExecutionPlan> {
    const plan = await this.findById(ctx, planId);
    if (!plan) throw new Error(`ExecutionPlan not found: ${planId}`);

    const updated: ExecutionPlan = {
      ...plan,
      steps: plan.steps.map((s) => (s.id === step.id ? step : s)),
      updatedAt: new Date().toISOString(),
    };

    return this.save(ctx, updated);
  }
}
