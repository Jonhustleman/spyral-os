/**
 * SQLite-backed WorkspaceRepository implementation.
 *
 * Phase D.3 — Infrastructure Adapters
 */

import type { TenantContext, Workspace, WorkspaceSummary, WorkspaceRepository, WorkspaceDNA } from "@spyral/kernel";
import { BaseSqliteRepository } from "./base-repository.js";

interface WorkspaceRow {
  id: string;
  owner_id: string;
  org_id: string;
  name: string;
  type: string;
  description: string;
  goal: string;
  status: string;
  dna: string;
  tags: string;
  created_at: string;
  updated_at: string;
}

function rowToWorkspace(row: WorkspaceRow): Workspace {
  return {
    id: row.id,
    ownerId: row.owner_id,
    orgId: row.org_id,
    name: row.name,
    type: row.type,
    description: row.description,
    goal: row.goal,
    status: row.status as Workspace["status"],
    dna: JSON.parse(row.dna) as WorkspaceDNA,
    tags: JSON.parse(row.tags) as string[],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function workspaceToRow(workspace: Workspace): WorkspaceRow {
  return {
    id: workspace.id,
    owner_id: workspace.ownerId,
    org_id: workspace.orgId,
    name: workspace.name,
    type: workspace.type,
    description: workspace.description,
    goal: workspace.goal,
    status: workspace.status,
    dna: JSON.stringify(workspace.dna),
    tags: JSON.stringify(workspace.tags),
    created_at: workspace.createdAt,
    updated_at: workspace.updatedAt,
  };
}

export class SqliteWorkspaceRepository extends BaseSqliteRepository implements WorkspaceRepository {
  async findById(ctx: TenantContext, id: string): Promise<Workspace | undefined> {
    const row = this.db.prepare("SELECT * FROM workspaces WHERE id = ?").get(id) as WorkspaceRow | undefined;
    return row ? rowToWorkspace(row) : undefined;
  }

  async findAll(ctx: TenantContext): Promise<Workspace[]> {
    const rows = this.db.prepare("SELECT * FROM workspaces ORDER BY created_at DESC").all() as WorkspaceRow[];
    return rows.map(rowToWorkspace);
  }

  async findByName(ctx: TenantContext, name: string): Promise<Workspace | undefined> {
    const row = this.db.prepare("SELECT * FROM workspaces WHERE name = ?").get(name) as WorkspaceRow | undefined;
    return row ? rowToWorkspace(row) : undefined;
  }

  async getSummary(ctx: TenantContext, id: string): Promise<WorkspaceSummary | undefined> {
    const workspace = await this.findById(ctx, id);
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

  async save(ctx: TenantContext, workspace: Workspace): Promise<Workspace> {
    const row = workspaceToRow(workspace);

    this.db.prepare(`
      INSERT OR REPLACE INTO workspaces
        (id, owner_id, org_id, name, type, description, goal, status, dna, tags, created_at, updated_at)
      VALUES
        (@id, @owner_id, @org_id, @name, @type, @description, @goal, @status, @dna, @tags, @created_at, @updated_at)
    `).run(row);

    return workspace;
  }

  async delete(ctx: TenantContext, id: string): Promise<boolean> {
    const result = this.db.prepare("DELETE FROM workspaces WHERE id = ?").run(id);
    return result.changes > 0;
  }
}
