/**
 * ExecutionTimeline Widget — Renders execution plan steps with progress.
 *
 * URI: ui://widget/execution-timeline?id={executionId}
 *
 * Following the advisor's mockup:
 *   Execution ■■■■□□□□□
 *   Step 1 ✓  Step 2 ✓  Step 3 →  Step 4
 *   Estimated completion: 8 days
 */

import type { CapabilityContext } from "../services/capability-factory.js";
import type { TenantContext } from "@spyral/kernel";
import { widgetShell, escapeHtml, formatDate, statusBadgeClass } from "./layout.js";

export interface ExecutionTimelineParams {
  id: string;
}

export async function renderExecutionTimeline(params: ExecutionTimelineParams, caps: CapabilityContext, tenantCtx: TenantContext): Promise<string | null> {
  const plan = await caps.execution.getPlan(tenantCtx, params.id);
  if (!plan) return null;

  const totalSteps = plan.steps.length;
  const completedSteps = plan.steps.filter(s => s.status === "completed").length;
  const activeStepIndex = plan.steps.findIndex(s => s.status === "in_progress" || s.status === "pending");
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Build steps HTML
  let stepsHtml = "";
  for (let i = 0; i < plan.steps.length; i++) {
    const step = plan.steps[i];
    const isCompleted = step.status === "completed";
    const isActive = step.status === "in_progress";
    const isPending = step.status === "pending";

    let indicatorClass = "pending";
    if (isCompleted) indicatorClass = "done";
    else if (isActive) indicatorClass = "active";

    const icon = isCompleted ? "✓" : isActive ? "→" : (i + 1).toString();

    const stepDesc = step.description ? `<div style="font-size:11px;color:var(--spyral-text-secondary);margin-left:28px;">${escapeHtml(step.description)}</div>` : "";

    stepsHtml += `
      <div class="spyral-step">
        <div class="spyral-step-indicator ${indicatorClass}">${icon}</div>
        <div style="flex:1;">
          <div style="font-size:13px;font-weight:${isActive ? "600" : "400"};">${escapeHtml(step.title)}</div>
          ${stepDesc}
        </div>
        <span class="spyral-badge ${statusBadgeClass(step.status)}">${step.status}</span>
      </div>
      ${i < plan.steps.length - 1 ? `<div class="spyral-step-line ${indicatorClass}"></div>` : ""}
    `;
  }

  // Estimate completion (rough: based on average step time if any completed)
  let estimateText = "Calculating...";
  if (completedSteps > 0 && totalSteps > 0) {
    // Rough estimate using timestamps if available, otherwise show remaining count
    const remaining = totalSteps - completedSteps;
    estimateText = `${remaining} step${remaining !== 1 ? "s" : ""} remaining`;
  }

  const content = `
    <div class="spyral-section">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        <span style="font-size:18px;">▶️</span>
        <h2 style="font-size:15px;font-weight:600;">${escapeHtml(plan.title)}</h2>
        <span class="spyral-badge ${statusBadgeClass(plan.status)}" style="margin-left:auto;">${plan.status}</span>
      </div>
      ${plan.description ? `<div style="font-size:12px;color:var(--spyral-text-secondary);margin-bottom:8px;">${escapeHtml(plan.description)}</div>` : ""}

      <div style="display:flex;gap:12px;font-size:12px;color:var(--spyral-text-secondary);margin-bottom:4px;">
        <span>✅ ${completedSteps}/${totalSteps} steps</span>
        <span>📅 ${estimateText}</span>
        <span style="margin-left:auto;">Created ${formatDate(plan.createdAt)}</span>
      </div>
      <div class="spyral-progress-bar" style="margin:4px 0 12px;">
        <div class="spyral-progress-fill" style="width:${progress}%;background:${progress >= 80 ? "var(--spyral-success)" : progress >= 40 ? "var(--spyral-warning)" : "var(--spyral-info)"};"></div>
      </div>
    </div>

    <div class="spyral-section">
      <div class="spyral-section-title">Execution Steps</div>
      ${stepsHtml}
    </div>

    <hr class="spyral-divider" />

    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <a class="spyral-button spyral-button-primary" href="ui://widget/decision-card?id=${escapeHtml(plan.decisionId)}">
        🧠 View Decision
      </a>
      <a class="spyral-button" href="ui://widget/workspace-dashboard?id=${escapeHtml(plan.workspaceId)}">
        📊 Workspace
      </a>
    </div>
  `;

  return widgetShell(content, {
    title: `Execution: ${plan.title}`,
    subtitle: `ID: ${plan.id} · ${totalSteps} steps`,
  });
}
