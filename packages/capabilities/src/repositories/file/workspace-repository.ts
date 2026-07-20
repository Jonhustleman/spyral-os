/**
 * File-based implementation of WorkspaceRepository.
 *
 * Persists workspaces to a JSON file on disk.
 *
 * Phase C.3 — Persistence
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import type { TenantContext, Workspace, WorkspaceRepository, WorkspaceSummary, WorkspaceStatus } from "@spyral/kernel";

export class FileWorkspaceRepository implements WorkspaceRepository {
  private store: Map<string, Workspace>;
  private filePath: string;

  constructor(dataDir?: string) {
    this.filePath = join(dataDir ?? process.cwd(), "data", "workspaces.json");
    this.store = new Map();
    this.load();
  }

  async findById(ctx: TenantContext, id: string): Promise<Workspace | undefined> {
    return this.store.get(id);
  }

  async findAll(ctx: TenantContext): Promise<Workspace[]> {
    return Array.from(this.store.values());
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
    this.saveToDisk();
    return updated;
  }

  async delete(ctx: TenantContext, id: string): Promise<boolean> {
    const result = this.store.delete(id);
    if (result) this.saveToDisk();
    return result;
  }

  async findByName(ctx: TenantContext, name: string): Promise<Workspace | undefined> {
    return Array.from(this.store.values()).find((w) => w.name === name);
  }

  async getSummary(ctx: TenantContext, id: string): Promise<WorkspaceSummary | undefined> {
    const workspace = this.store.get(id);
    if (!workspace) return undefined;

    return {
      id: workspace.id,
      name: workspace.name,
      type: workspace.type,
      status: workspace.status as WorkspaceStatus,
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
    this.saveToDisk();
  }

  // ─── File I/O ──────────────────────────────────────────────────────────────

  private load(): void {
    try {
      if (existsSync(this.filePath)) {
        const raw = readFileSync(this.filePath, "utf-8");
        const data = JSON.parse(raw) as Workspace[];
        this.store = new Map(data.map((w) => [w.id, w]));
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
      console.error("[FileWorkspaceRepository] Failed to persist:", err);
    }
  }
}
