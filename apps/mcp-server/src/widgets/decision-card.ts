/**
 * DecisionCard Widget — Renders a structured decision with options,
 * confidence scores, and recommendation.
 *
 * URI: ui://widget/decision-card?id={decisionId}
 *
 * Following the advisor's mockup:
 *   🧠 Decision: {title}
 *   Confidence: {score}%
 *   Options ──────────────
 *   ① {Conservative} ② {Balanced} ⭐ ③ {Aggressive}
 *   Risks • {risk1} • {risk2}
 *   [View Workspace] [Start Execution]
 */

import type { CapabilityContext } from "../services/capability-factory.js";
import type { TenantContext } from "@spyral/kernel";
import { widgetShell, escapeHtml, formatDate, statusBadgeClass, confidenceClass } from "./layout.js";

export interface DecisionCardParams {
  id: string;
}

export async function renderDecisionCard(params: DecisionCardParams, caps: CapabilityContext, tenantCtx: TenantContext): Promise<string | null> {
  const fullDecision = await caps.decision.getDecision(tenantCtx, params.id);
  if (!fullDecision) return null;

  const confidence = fullDecision.confidence ?? 0;
  const confidenceLevel = confidence >= 80 ? "High" : confidence >= 60 ? "Medium" : "Low";

  // Build options HTML
  const optionsHtml = fullDecision.options.map((opt: { title: string; description: string; confidence: number; expectedCost?: string; expectedRisk?: string; requiredEffort?: string }, i: number) => {
    const isRecommended = i === fullDecision.options.length - 1; // last option is recommended
    const icons = ["①", "②", "③", "④", "⑤"];
    const icon = icons[i] ?? `(${i + 1})`;
    const star = isRecommended ? " ⭐" : "";

    return `<div class="spyral-option${isRecommended ? " recommended" : ""}">
      <div class="spyral-option-title">
        <span>${icon}${star} ${escapeHtml(opt.title)}</span>
        <span class="spyral-badge ${confidenceClass(opt.confidence ?? 0)}">${opt.confidence ?? "?"}%</span>
      </div>
      <div class="spyral-option-desc">${escapeHtml(opt.description)}</div>
      <div style="display:flex;gap:12px;margin-top:4px;font-size:11px;color:var(--spyral-text-secondary);">
        <span>💰 ${escapeHtml(opt.expectedCost ?? "TBD")}</span>
        <span>⚠️ ${escapeHtml(opt.expectedRisk ?? "TBD")}</span>
        <span>📋 ${escapeHtml(opt.requiredEffort ?? "TBD")}</span>
      </div>
    </div>`;
  }).join("\n");

  // Collect risks
  const risks = fullDecision.options
    .map((o: { expectedRisk?: string }) => o.expectedRisk)
    .filter((r: string | undefined): r is string => !!r)
    .slice(0, 3);

  const content = `
    <div class="spyral-section">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-size:18px;">🧠</span>
        <h2 style="font-size:15px;font-weight:600;">${escapeHtml(fullDecision.title)}</h2>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
        <span class="spyral-badge ${statusBadgeClass(fullDecision.status)}">${fullDecision.status}</span>
        <span class="spyral-badge ${confidenceClass(confidence)}">${confidence}% ${confidenceLevel}</span>
        <span style="font-size:11px;color:var(--spyral-text-secondary);margin-left:auto;">
          ${formatDate(fullDecision.createdAt)}
        </span>
      </div>
    </div>

    <div class="spyral-section">
      <div class="spyral-section-title">Intent</div>
      <div class="spyral-card" style="font-size:13px;color:var(--spyral-text-secondary);">
        ${escapeHtml(fullDecision.intent)}
      </div>
    </div>

    <div class="spyral-section">
      <div class="spyral-section-title">Options — ${fullDecision.options.length} evaluated</div>
      ${optionsHtml}
    </div>

    ${risks.length > 0 ? `
    <div class="spyral-section">
      <div class="spyral-section-title">Key Risks</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;">
        ${risks.map((r: string) => `<span class="spyral-tag" style="color:var(--spyral-danger);border-color:var(--spyral-danger);">⚠️ ${escapeHtml(r)}</span>`).join("")}
      </div>
    </div>
    ` : ""}

    <hr class="spyral-divider" />

    <div style="display:flex;gap:8px;flex-wrap:wrap;">
      <a class="spyral-button spyral-button-primary" href="ui://widget/workspace-dashboard?id=${escapeHtml(fullDecision.workspaceId)}">
        📊 View Workspace
      </a>
      <button class="spyral-button" onclick="alert('Execution creation coming soon')">
        ▶️ Start Execution
      </button>
    </div>
  `;

  return widgetShell(content, {
    title: `Decision: ${fullDecision.title}`,
    subtitle: `ID: ${fullDecision.id} · Workspace: ${fullDecision.workspaceId}`,
  });
}
