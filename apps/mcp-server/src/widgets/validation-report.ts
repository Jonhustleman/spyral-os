/**
 * ValidationReport Widget — Renders validation outcomes for an execution.
 *
 * URI: ui://widget/validation-report?executionId={executionId}
 *
 * Stub implementation — Validation engine is planned for Phase C.0.
 * Shows a placeholder indicating this feature is coming.
 */

import type { CapabilityContext } from "../services/capability-factory.js";
import type { TenantContext } from "@spyral/kernel";
import { widgetShell, escapeHtml } from "./layout.js";

export interface ValidationReportParams {
  executionId?: string;
  workspaceId?: string;
}

export async function renderValidationReport(params: ValidationReportParams, _caps: CapabilityContext, _tenantCtx: TenantContext): Promise<string> {
  const content = `
    <div class="spyral-section">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
        <span style="font-size:18px;">✅</span>
        <h2 style="font-size:15px;font-weight:600;">Validation Report</h2>
      </div>
      <div class="spyral-card" style="text-align:center;padding:32px;">
        <div style="font-size:32px;margin-bottom:12px;">🔜</div>
        <div style="font-size:14px;font-weight:500;margin-bottom:8px;">Validation Engine — Coming in Phase C.0</div>
        <div style="font-size:12px;color:var(--spyral-text-secondary);max-width:400px;margin:0 auto;">
          The Validation Engine will compare expected vs observed outcomes,
          calculate variance and confidence, and produce structured validation
          reports for every completed execution.
        </div>
        <div style="margin-top:16px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap;">
          <span class="spyral-tag" style="background:var(--spyral-info-light);">Expected vs Observed</span>
          <span class="spyral-tag" style="background:var(--spyral-info-light);">Variance Scoring</span>
          <span class="spyral-tag" style="background:var(--spyral-info-light);">Confidence Evolution</span>
          <span class="spyral-tag" style="background:var(--spyral-info-light);">Outcome Tracking</span>
        </div>
      </div>
    </div>

    ${params.executionId ? `
    <div class="spyral-section">
      <div class="spyral-section-title">Context</div>
      <div class="spyral-card" style="font-size:12px;color:var(--spyral-text-secondary);">
        Execution ID: ${escapeHtml(params.executionId)}
      </div>
    </div>
    ` : ""}
  `;

  return widgetShell(content, {
    title: "Validation Report",
    subtitle: params.executionId ? `Execution: ${params.executionId}` : "Phase C.0 feature",
  });
}
