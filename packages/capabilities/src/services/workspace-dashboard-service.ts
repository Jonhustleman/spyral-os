/**
 * WorkspaceDashboardService — Aggregates workspace data for UI widgets.
 *
 * Fetches workspace details, recent decisions, execution plans,
 * and learning records to build a comprehensive dashboard view.
 *
 * Phase C.0 — Application Service Layer
 */

import type {
  TenantContext,
  WorkspaceDashboardResponse,
} from "@spyral/kernel";
import { getApplicationContext } from "./application-context.js";

export class WorkspaceDashboardService {
  async execute(tenantCtx: TenantContext, workspaceId: string): Promise<WorkspaceDashboardResponse> {
    const ctx = getApplicationContext();

    // Fetch workspace
    const workspace = await ctx.workspace.getWorkspace(tenantCtx, workspaceId);
    if (!workspace) {
      throw new Error(`Workspace not found: ${workspaceId}`);
    }

    // Fetch summary
    const summary = await ctx.workspace.getSummary(tenantCtx, workspaceId);

    // Fetch recent decisions
    const recentDecisions = await ctx.decision.listByWorkspace(tenantCtx, workspaceId);

    // Fetch execution plans
    const recentExecutions = await ctx.execution.listByWorkspace(tenantCtx, workspaceId);

    // Fetch learning records
    const learningRecords = await ctx.learning.listByWorkspace(tenantCtx, workspaceId);

    return {
      workspace,
      summary,
      recentDecisions,
      recentExecutions,
      learningRecords,
    };
  }
}
