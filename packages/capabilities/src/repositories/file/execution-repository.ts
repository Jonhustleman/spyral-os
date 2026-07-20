/**
 * File-based implementation of ExecutionPlanRepository.
 *
 * Persists execution plans to a JSON file on disk.
 *
 * Phase C.3 — Persistence
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import type { TenantContext, ExecutionPlan, ExecutionPlanRepository, ExecutionStep, ExecutionPlanSummary } from "@spyral/kernel";

export class FileExecutionPlanRepository implements ExecutionPlanRepository {
  private store: Map<string, ExecutionPlan>;
  private filePath: string;

  constructor(dataDir?: string) {
    this.filePath = join(dataDir ?? process.cwd(), "data", "executions.json");
    this.store = new Map();
    this.load();
  }

  async findById(ctx: TenantContext, id: string): Promise<ExecutionPlan | undefined> {
    return this.store.get(id);
  }

  async findAll(ctx: TenantContext): Promise<ExecutionPlan[]> {
    return Array.from(this.store.values());
  }

  async findByWorkspaceId(ctx: TenantContext, workspaceId: string): Promise<ExecutionPlan[]> {
    return Array.from(this.store.values()).filter(
      (p) => p.workspaceId === workspaceId,
    );
  }

  async findByStatus(ctx: TenantContext, status: ExecutionPlan["status"]): Promise<ExecutionPlan[]> {
    return Array.from(this.store.values()).filter((p) => p.status === status);
  }

  async updateStep(ctx: TenantContext, planId: string, step: ExecutionStep): Promise<ExecutionPlan> {
    const plan = this.store.get(planId);
    if (!plan) throw new Error(`ExecutionPlan not found: ${planId}`);

    const updated: ExecutionPlan = {
      ...plan,
      steps: plan.steps.map((s) => (s.id === step.id ? { ...s, ...step } : s)),
      updatedAt: new Date().toISOString(),
    };

    this.store.set(planId, updated);
    this.saveToDisk();
    return updated;
  }

  async findByDecisionId(ctx: TenantContext, decisionId: string): Promise<ExecutionPlan | undefined> {
    return Array.from(this.store.values()).find(
      (p) => p.decisionId === decisionId,
    );
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
    this.saveToDisk();
    return updated;
  }

  async delete(ctx: TenantContext, id: string): Promise<boolean> {
    const result = this.store.delete(id);
    if (result) this.saveToDisk();
    return result;
  }

  /** For testing: clear all data */
  clear(): void {
    this.store.clear();
    this.saveToDisk();
  }

  private toSummary(plan: ExecutionPlan): ExecutionPlanSummary {
    return {
      id: plan.id,
      title: plan.title,
      status: plan.status,
      stepCount: plan.steps.length,
      completedSteps: plan.steps.filter((s) => s.status === "completed").length,
      decisionId: plan.decisionId,
    };
  }

  // ─── File I/O ──────────────────────────────────────────────────────────────

  private load(): void {
    try {
      if (existsSync(this.filePath)) {
        const raw = readFileSync(this.filePath, "utf-8");
        const data = JSON.parse(raw) as ExecutionPlan[];
        this.store = new Map(data.map((p) => [p.id, p]));
      } else {
        this.store = new Map();
      }
    } catch {
      this.store = new Map();
    }
  }

  private saveToDisk(): void {
    try {
      const dir = dirname(this.filePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      const data = Array.from(this.store.values());
      writeFileSync(this.filePath, JSON.stringify(data, null, 2), "utf-8");
    } catch (err) {
      console.error("[FileExecutionPlanRepository] Failed to persist:", err);
    }
  }
}
