/**
 * LearningSummary Widget — Renders learning records for a workspace.
 *
 * URI: ui://widget/learning-summary?workspaceId={workspaceId}
 *
 * Shows patterns discovered, confidence evolution, and decision outcomes.
 */

import type { CapabilityContext } from "../services/capability-factory.js";
import type { TenantContext } from "@spyral/kernel";
import { widgetShell, escapeHtml, formatDate, confidenceClass } from "./layout.js";

export interface LearningSummaryParams {
  workspaceId: string;
}

export async function renderLearningSummary(params: LearningSummaryParams, caps: CapabilityContext, tenantCtx: TenantContext): Promise<string | null> {
  const records = await caps.learning.listByWorkspace(tenantCtx, params.workspaceId);

  if (records.length === 0) {
    const content = `
      <div class="spyral-section">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
          <span style="font-size:18px;">🧠</span>
          <h2 style="font-size:15px;font-weight:600;">Learning Summary</h2>
        </div>
        <div class="spyral-empty">
          <div style="font-size:24px;margin-bottom:8px;">🧠</div>
          <div>No learning records yet.</div>
          <div style="font-size:11px;margin-top:4px;">Learning records are created when decisions are executed and outcomes are validated.</div>
        </div>
      </div>
    `;
    return widgetShell(content, {
      title: "Learning Summary",
      subtitle: "No records yet",
    });
  }

  // Get patterns
  const patterns = await caps.learning.getPatternsByFrequency(tenantCtx, 1);
  const patternCount = patterns.length;

  // Group records by type
  const byType: Record<string, typeof records> = {};
  for (const r of records) {
    byType[r.type] = byType[r.type] ?? [];
    byType[r.type].push(r);
  }

  // Build records HTML
  const recordsHtml = records.slice(0, 10).map(r => `
    <div class="spyral-card" style="font-size:13px;">
      <div style="display:flex;align-items:center;gap:8px;">
        <span style="font-size:14px;">📝</span>
        <span style="flex:1;font-weight:500;">${escapeHtml(r.content.substring(0, 80))}${r.content.length > 80 ? "..." : ""}</span>
        <span class="spyral-badge ${confidenceClass(r.confidence)}">${r.confidence}%</span>
      </div>
      <div style="display:flex;gap:8px;margin-top:4px;font-size:11px;color:var(--spyral-text-secondary);">
        <span>Type: ${r.type}</span>
        <span>${formatDate(r.createdAt)}</span>
        ${r.decisionId ? `<span>Decision: ${r.decisionId}</span>` : ""}
      </div>
    </div>
  `).join("\n");

  const content = `
    <div class="spyral-section">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-size:18px;">🧠</span>
        <h2 style="font-size:15px;font-weight:600;">Learning Summary</h2>
        <span style="font-size:12px;color:var(--spyral-text-secondary);margin-left:auto;">${records.length} records</span>
      </div>
    </div>

    <div class="spyral-section">
      <div class="spyral-grid spyral-grid-3">
        <div class="spyral-card spyral-stat">
          <div class="spyral-stat-value" style="color:var(--spyral-info);">${records.length}</div>
          <div class="spyral-stat-label">Total Records</div>
        </div>
        <div class="spyral-card spyral-stat">
          <div class="spyral-stat-value" style="color:var(--spyral-success);">${patternCount}</div>
          <div class="spyral-stat-label">Patterns Found</div>
        </div>
        <div class="spyral-card spyral-stat">
          <div class="spyral-stat-value" style="color:var(--spyral-warning);">${Object.keys(byType).length}</div>
          <div class="spyral-stat-label">Record Types</div>
        </div>
      </div>
    </div>

    ${patterns.length > 0 ? `
    <div class="spyral-section">
      <div class="spyral-section-title">Discovered Patterns</div>
      ${patterns.slice(0, 5).map(p => `
        <div class="spyral-card" style="font-size:12px;display:flex;align-items:center;gap:8px;">
          <span>🔄</span>
          <span style="flex:1;">${escapeHtml(p.name)}</span>
          <span class="spyral-badge ${confidenceClass(p.confidence ?? 0)}">${p.confidence ?? "?"}%</span>
          <span style="font-size:11px;color:var(--spyral-text-secondary);">×${p.frequency ?? 1}</span>
        </div>
      `).join("\n")}
    </div>
    ` : ""}

    <div class="spyral-section">
      <div class="spyral-section-title">Recent Records</div>
      ${recordsHtml}
    </div>
  `;

  return widgetShell(content, {
    title: "Learning Summary",
    subtitle: `${records.length} records · ${patternCount} patterns`,
  });
}
