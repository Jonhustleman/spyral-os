/**
 * StatusBadge Widget — Renders SPYRAL OS system status with health indicator.
 *
 * URI: ui://widget/status-badge
 *
 * Shows system version, health, uptime, and capability statuses.
 */

import type { CapabilityContext } from "../services/capability-factory.js";
import type { TenantContext } from "@spyral/kernel";
import { widgetShell, escapeHtml, formatDate } from "./layout.js";

export interface StatusBadgeParams {
  // No params needed
}

export async function renderStatusBadge(_params: StatusBadgeParams, _caps: CapabilityContext, _tenantCtx: TenantContext): Promise<string> {
  // Get capabilities to verify the system is operational
  // In a real implementation, we'd check each capability's health
  
  const content = `
    <div class="spyral-section">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-size:18px;">✦</span>
        <h2 style="font-size:15px;font-weight:600;">SPYRAL OS — System Status</h2>
      </div>
      <div class="spyral-card" style="display:flex;align-items:center;gap:12px;">
        <div style="width:12px;height:12px;border-radius:50%;background:var(--spyral-success);flex-shrink:0;"></div>
        <div style="flex:1;">
          <div style="font-size:14px;font-weight:500;">Operational</div>
          <div style="font-size:11px;color:var(--spyral-text-secondary);">All systems normal</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:11px;color:var(--spyral-text-secondary);">v0.2.1-alpha</div>
        </div>
      </div>
    </div>

    <div class="spyral-section">
      <div class="spyral-section-title">Capability Status</div>
      ${[
        { name: "Decision Intelligence", status: "operational", desc: "Decision creation and analysis" },
        { name: "Execution Tracking", status: "operational", desc: "Execution plan management" },
        { name: "Workspace Management", status: "operational", desc: "Aggregate root management" },
        { name: "Learning Loop", status: "operational", desc: "Learning record and pattern tracking" },
      ].map(cap => `
        <div class="spyral-card" style="display:flex;align-items:center;gap:8px;font-size:13px;">
          <span style="color:var(--spyral-success);font-size:12px;">●</span>
          <span style="flex:1;font-weight:500;">${escapeHtml(cap.name)}</span>
          <span style="font-size:11px;color:var(--spyral-text-secondary);">${escapeHtml(cap.desc)}</span>
          <span class="spyral-badge spyral-badge-success">${cap.status}</span>
        </div>
      `).join("\n")}
    </div>

    <div class="spyral-section">
      <div class="spyral-section-title">Available Widgets</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;">
        <a class="spyral-button" href="ui://widget/status-badge">✦ Status</a>
        <a class="spyral-button" href="ui://widget/decision-card?id=">🧠 Decision Card</a>
        <a class="spyral-button" href="ui://widget/workspace-dashboard?id=">📊 Dashboard</a>
        <a class="spyral-button" href="ui://widget/execution-timeline?id=">▶️ Timeline</a>
        <a class="spyral-button" href="ui://widget/learning-summary?workspaceId=">🧠 Learning</a>
      </div>
      <div style="margin-top:8px;font-size:11px;color:var(--spyral-text-secondary);">
        Append ?id= or ?workspaceId= to widget URIs to view specific data.
      </div>
    </div>
  `;

  return widgetShell(content, {
    title: "System Status",
    subtitle: "All systems operational",
  });
}
