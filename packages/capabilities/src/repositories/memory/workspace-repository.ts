/**
 * In-memory implementation of WorkspaceRepository.
 *
 * Phase 2 — Milestone B.3 (Persistence)
 */

import type { TenantContext, Workspace, WorkspaceSummary, WorkspaceRepository } from "@spyral/kernel";

export class MemoryWorkspaceRepository implements WorkspaceRepository {
  private store = new Map<string, Workspace>();

  async findById(ctx: TenantContext, id: string): Promise<Workspace | undefined> {
    return this.store.get(id);
  }

  async findAll(ctx: TenantContext): Promise<Workspace[]> {
    return Array.from(this.store.values());
  }

  async findByName(ctx: TenantContext, name: string): Promise<Workspace | undefined> {
    return Array.from(this.store.values()).find(
      (w) => w.name.toLowerCase() === name.toLowerCase(),
    );
  }

  async save(ctx: TenantContext, workspace: Workspace): Promise<Workspace> {
    const now = new Date().toISOString();
    const existing = this.store.get(workspace.id);

    const updated: Workspace = {
      ...workspace,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    this.store.set(workspace.id, updated);
    return updated;
  }

  async delete(ctx: TenantContext, id: string): Promise<boolean> {
    return this.store.delete(id);
  }

  async getSummary(ctx: TenantContext, id: string): Promise<WorkspaceSummary | undefined> {
    const workspace = this.store.get(id);
    if (!workspace) return undefined;

    return {
      id: workspace.id,
      name: workspace.name,
      type: workspace.type,
      status: workspace.status,
      goal: workspace.goal,
      decisionCount: 0,
      executionCount: 0,
      learningCount: 0,
      createdAt: workspace.createdAt,
    };
  }

  /** For testing: clear all data */
  clear(): void {
    this.store.clear();
  }
}
