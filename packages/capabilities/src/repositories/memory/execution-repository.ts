/**
 * In-memory implementation of ExecutionPlanRepository.
 *
 * Phase 2 — Milestone B.3 (Persistence)
 */

import type { TenantContext, ExecutionPlan, ExecutionStep, ExecutionPlanRepository } from "@spyral/kernel";

export class MemoryExecutionPlanRepository implements ExecutionPlanRepository {
  private store = new Map<string, ExecutionPlan>();

  async findById(ctx: TenantContext, id: string): Promise<ExecutionPlan | undefined> {
    return this.store.get(id);
  }

  async findAll(ctx: TenantContext): Promise<ExecutionPlan[]> {
    return Array.from(this.store.values());
  }

  async findByDecisionId(ctx: TenantContext, decisionId: string): Promise<ExecutionPlan | undefined> {
    return Array.from(this.store.values()).find(
      (p) => p.decisionId === decisionId,
    );
  }

  async findByWorkspaceId(ctx: TenantContext, workspaceId: string): Promise<ExecutionPlan[]> {
    return Array.from(this.store.values()).filter(
      (p) => p.workspaceId === workspaceId,
    );
  }

  async findByStatus(ctx: TenantContext, status: ExecutionPlan["status"]): Promise<ExecutionPlan[]> {
    return Array.from(this.store.values()).filter((p) => p.status === status);
  }

  async save(ctx: TenantContext, plan: ExecutionPlan): Promise<ExecutionPlan> {
    const now = new Date().toISOString();
    const existing = this.store.get(plan.id);

    const updated: ExecutionPlan = {
      ...plan,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    this.store.set(plan.id, updated);
    return updated;
  }

  async delete(ctx: TenantContext, id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  async updateStep(ctx: TenantContext, planId: string, step: ExecutionStep): Promise<ExecutionPlan> {
    const plan = this.store.get(planId);
    if (!plan) throw new Error(`ExecutionPlan not found: ${planId}`);

    const updatedSteps = plan.steps.map((s) =>
      s.id === step.id ? { ...s, ...step, updatedAt: new Date().toISOString() } : s,
    );

    const updated: ExecutionPlan = {
      ...plan,
      steps: updatedSteps,
      updatedAt: new Date().toISOString(),
    };

    this.store.set(planId, updated);
    return updated;
  }

  /** For testing: clear all data */
  clear(): void {
    this.store.clear();
  }
}
