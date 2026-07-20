/**
 * WorkspaceCapability — Workspace management for SPYRAL.
 *
 * Workspace is the aggregate root in SPYRAL OS.
 * Every decision, execution, and learning belongs to a workspace.
 *
 * Phase 2 — Milestone B.3 (Domain Capabilities)
 */

import type {
  TenantContext,
  Workspace,
  WorkspaceRepository,
  WorkspaceSummary,
  WorkspaceDNA,
} from "@spyral/kernel";

export interface CreateWorkspaceInput {
  ownerId?: string;
  orgId?: string;
  name: string;
  type?: string;
  description: string;
  goal: string;
  dna?: Partial<WorkspaceDNA>;
  tags?: string[];
}

export class WorkspaceCapability {
  constructor(private readonly workspaceRepo: WorkspaceRepository) {}

  /** Create a new workspace */
  async createWorkspace(ctx: TenantContext, input: CreateWorkspaceInput): Promise<Workspace> {
    const now = new Date().toISOString();
    const workspaceId = generateId("ws");

    const dna: WorkspaceDNA = {
      industry: input.dna?.industry ?? "general",
      mission: input.dna?.mission ?? input.goal,
      planningHorizon: input.dna?.planningHorizon ?? "medium",
      riskAppetite: input.dna?.riskAppetite ?? "moderate",
      growthStyle: input.dna?.growthStyle ?? "balanced",
      successMetric: input.dna?.successMetric ?? "revenue_growth",
    };

    const workspace: Workspace = {
      id: workspaceId,
      ownerId: input.ownerId ?? "",
      orgId: input.orgId ?? "",
      name: input.name,
      type: input.type ?? "business",
      description: input.description,
      goal: input.goal,
      status: "active",
      dna,
      tags: input.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };

    return this.workspaceRepo.save(ctx, workspace);
  }

  /** Get a workspace by ID */
  async getWorkspace(ctx: TenantContext, id: string): Promise<Workspace | undefined> {
    return this.workspaceRepo.findById(ctx, id);
  }

  /** Get workspace summary with aggregated counts */
  async getSummary(ctx: TenantContext, id: string): Promise<WorkspaceSummary | undefined> {
    return this.workspaceRepo.getSummary(ctx, id);
  }

  /** List all workspaces */
  async listWorkspaces(ctx: TenantContext): Promise<Workspace[]> {
    return this.workspaceRepo.findAll(ctx);
  }

  /** Update workspace goal */
  async updateGoal(ctx: TenantContext, id: string, goal: string): Promise<Workspace> {
    const workspace = await this.workspaceRepo.findById(ctx, id);
    if (!workspace) throw new Error(`Workspace not found: ${id}`);

    const updated: Workspace = {
      ...workspace,
      goal,
      updatedAt: new Date().toISOString(),
    };

    return this.workspaceRepo.save(ctx, updated);
  }

  /** Archive a workspace */
  async archiveWorkspace(ctx: TenantContext, id: string): Promise<Workspace> {
    const workspace = await this.workspaceRepo.findById(ctx, id);
    if (!workspace) throw new Error(`Workspace not found: ${id}`);

    const updated: Workspace = {
      ...workspace,
      status: "archived",
      updatedAt: new Date().toISOString(),
    };

    return this.workspaceRepo.save(ctx, updated);
  }
}

// ─── ID Generation ───────────────────────────────────────────────────────────

let counter = 0;

function generateId(prefix: string): string {
  counter++;
  const timestamp = Date.now().toString(36);
  return `${prefix}_${timestamp}_${counter.toString(36).padStart(4, "0")}`;
}
