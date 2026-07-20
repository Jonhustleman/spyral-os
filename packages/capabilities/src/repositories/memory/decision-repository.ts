/**
 * In-memory implementation of DecisionRepository.
 *
 * Stores decisions in a Map for fast O(1) lookups.
 * Used for development/testing. Swap for PostgreSQL/SQLite in production.
 *
 * Phase 2 — Milestone B.3 (Persistence)
 */

import type { TenantContext, Decision, DecisionOption, DecisionRepository } from "@spyral/kernel";

export class MemoryDecisionRepository implements DecisionRepository {
  private store = new Map<string, Decision>();

  async findById(ctx: TenantContext, id: string): Promise<Decision | undefined> {
    return this.store.get(id);
  }

  async findAll(ctx: TenantContext): Promise<Decision[]> {
    return Array.from(this.store.values());
  }

  async findByWorkspaceId(ctx: TenantContext, workspaceId: string): Promise<Decision[]> {
    return Array.from(this.store.values()).filter(
      (d) => d.workspaceId === workspaceId,
    );
  }

  async findByStatus(ctx: TenantContext, status: Decision["status"]): Promise<Decision[]> {
    return Array.from(this.store.values()).filter((d) => d.status === status);
  }

  async save(ctx: TenantContext, decision: Decision): Promise<Decision> {
    const now = new Date().toISOString();
    const existing = this.store.get(decision.id);

    const updated: Decision = {
      ...decision,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    this.store.set(decision.id, updated);
    return updated;
  }

  async delete(ctx: TenantContext, id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  async addOption(ctx: TenantContext, decisionId: string, option: DecisionOption): Promise<Decision> {
    const decision = this.store.get(decisionId);
    if (!decision) throw new Error(`Decision not found: ${decisionId}`);

    const updated: Decision = {
      ...decision,
      options: [...decision.options, option],
      updatedAt: new Date().toISOString(),
    };

    this.store.set(decisionId, updated);
    return updated;
  }

  async selectOption(ctx: TenantContext, decisionId: string, optionId: string): Promise<Decision> {
    const decision = this.store.get(decisionId);
    if (!decision) throw new Error(`Decision not found: ${decisionId}`);

    const option = decision.options.find((o) => o.id === optionId);
    if (!option) throw new Error(`Option not found: ${optionId}`);

    const updated: Decision = {
      ...decision,
      selectedOptionId: optionId,
      status: "executing",
      updatedAt: new Date().toISOString(),
    };

    this.store.set(decisionId, updated);
    return updated;
  }

  /** For testing: clear all data */
  clear(): void {
    this.store.clear();
  }
}
