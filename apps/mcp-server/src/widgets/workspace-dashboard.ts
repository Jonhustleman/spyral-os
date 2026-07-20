/**
 * WorkspaceDashboard Widget — Renders workspace summary with
 * decision, execution, and learning record counts.
 *
 * URI: ui://widget/workspace-dashboard?id={workspaceId}
 *
 * Following the advisor's mockup:
 *   Workspace {name}
 *   Decisions: 12  Executions: 4  Learning Records: 19
 *   Recent Decisions ──────────────
 *   ✔ Pricing Strategy  ✔ Marketing Launch  ✔ Expansion Plan
 *   [Open]
 */

import type { CapabilityContext } from "../services/capability-factory.js";
import type { TenantContext } from "@spyral/kernel";
import { widgetShell, escapeHtml, formatDate, statusBadgeClass, confidenceClass } from "./layout.js";

export interface WorkspaceDashboardParams {
  id: string;
}

export async function renderWorkspaceDashboard(params: WorkspaceDashboardParams, caps: CapabilityContext, tenantCtx: TenantContext): Promise<string | null> {
  const workspace = await caps.workspace.getWorkspace(tenantCtx, params.id);
  if (!workspace) return null;

  const summary = await caps.workspace.getSummary(tenantCtx, params.id);

  // Get recent decisions
  const decisions = await caps.decision.listByWorkspace(tenantCtx, params.id);
  const recentDecisions = decisions.slice(0, 5);

  // Get recent executions
  const executions = await caps.execution.listByWorkspace(tenantCtx, params.id);
  const recentExecutions = executions.slice(0, 5);

  // Get learning records count
  const learnings = await caps.learning.listByWorkspace(tenantCtx, params.id);

  const decisionCount = summary?.decisionCount ?? decisions.length;
  const executionCount = summary?.executionCount ?? executions.length;
  const learningCount = summary?.learningCount ?? learnings.length;

  // Decisions list
  const decisionsHtml = recentDecisions.length > 0
    ? recentDecisions.map(d =>
        `<a href="ui://widget/decision-card?id=${escapeHtml(d.id)}" style="text-decoration:none;">
          <div class="spyral-card" style="cursor:pointer;display:flex;align-items:center;gap:8px;">
            <span style="color:var(--spyral-success);font-size:14px;">✔</span>
            <span style="flex:1;font-size:13px;">${escapeHtml(d.title)}</span>
            <span class="spyral-badge ${confidenceClass(d.confidence ?? 0)}">${d.confidence ?? "?"}%</span>
            <span class="spyral-badge ${statusBadgeClass(d.status)}">${d.status}</span>
            <span style="font-size:11px;color:var(--spyral-text-secondary);">${formatDate(d.createdAt)}</span>
          </div>
        </a>`
      ).join("\n")
    : `<div class="spyral-empty">No decisions yet. Create one with spyral_create_decision.</div>`;

  // Executions list
  const executionsHtml = recentExecutions.length > 0
    ? recentExecutions.map(e => {
        const progress = e.stepCount > 0
          ? Math.round((e.completedSteps / e.stepCount) * 100)
          : 0;
        return `<div class="spyral-card" style="display:flex;align-items:center;gap:8px;">
          <span style="font-size:14px;">📋</span>
          <span style="flex:1;font-size:13px;">${escapeHtml(e.title)}</span>
          <div style="width:80px;">
            <div class="spyral-progress-bar">
              <div class="spyral-progress-fill" style="width:${progress}%;background:${progress >= 80 ? "var(--spyral-success)" : progress >= 40 ? "var(--spyral-warning)" : "var(--spyral-info)"};"></div>
            </div>
          </div>
          <span class="spyral-badge ${statusBadgeClass(e.status)}">${e.status}</span>
        </div>`;
      }).join("\n")
    : `<div class="spyral-empty">No executions yet.</div>`;

  const content = `
    <div class="spyral-section">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <span style="font-size:18px;">📊</span>
        <h2 style="font-size:15px;font-weight:600;">${escapeHtml(workspace.name)}</h2>
        <span class="spyral-badge ${statusBadgeClass(workspace.status)}" style="margin-left:auto;">${workspace.status}</span>
      </div>
      ${workspace.goal ? `<div style="font-size:12px;color:var(--spyral-text-secondary);margin-bottom:8px;">🎯 ${escapeHtml(workspace.goal)}</div>` : ""}
    </div>

    <div class="spyral-section">
      <div class="spyral-grid spyral-grid-3" style="margin-bottom:8px;">
        <div class="spyral-card spyral-stat">
          <div class="spyral-stat-value" style="color:var(--spyral-info);">${decisionCount}</div>
          <div class="spyral-stat-label">Decisions</div>
        </div>
        <div class="spyral-card spyral-stat">
          <div class="spyral-stat-value" style="color:var(--spyral-success);">${executionCount}</div>
          <div class="spyral-stat-label">Executions</div>
        </div>
        <div class="spyral-card spyral-stat">
          <div class="spyral-stat-value" style="color:var(--spyral-warning);">${learningCount}</div>
          <div class="spyral-stat-label">Learnings</div>
        </div>
      </div>
    </div>

    <div class="spyral-section">
      <div class="spyral-section-title">Recent Decisions</div>
      ${decisionsHtml}
    </div>

    <div class="spyral-section">
      <div class="spyral-section-title">Recent Executions</div>
      ${executionsHtml}
    </div>
  `;

  return widgetShell(content, {
    title: `Workspace: ${workspace.name}`,
    subtitle: `ID: ${workspace.id} · ${workspace.type}`,
  });
}
