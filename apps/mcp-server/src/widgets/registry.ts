/**
 * Widget Registry — Maps widget URIs to renderer functions.
 *
 * Central registry for all SPYRAL MCP UI widgets.
 * Each widget is registered with a URI pattern and renderer function.
 */

import type { CapabilityContext } from "../services/capability-factory.js";
import type { TenantContext } from "@spyral/kernel";
import { parseWidgetUri } from "./layout.js";

import { renderDecisionCard } from "./decision-card.js";
import { renderWorkspaceDashboard } from "./workspace-dashboard.js";
import { renderExecutionTimeline } from "./execution-timeline.js";
import { renderLearningSummary } from "./learning-summary.js";
import { renderValidationReport } from "./validation-report.js";
import { renderStatusBadge } from "./status-badge.js";

export interface WidgetDefinition {
  uri: string;
  name: string;
  description: string;
}

/**
 * All registered widget definitions for the MCP resource listing.
 */
export const widgetDefinitions: WidgetDefinition[] = [
  {
    uri: "ui://widget/decision-card",
    name: "Decision Card",
    description: "Renders a structured decision with options, confidence scores, and recommendation",
  },
  {
    uri: "ui://widget/workspace-dashboard",
    name: "Workspace Dashboard",
    description: "Shows workspace summary with decisions, executions, and learning records",
  },
  {
    uri: "ui://widget/execution-timeline",
    name: "Execution Timeline",
    description: "Displays execution plan steps with progress indicators and status",
  },
  {
    uri: "ui://widget/learning-summary",
    name: "Learning Summary",
    description: "Shows learning records, patterns, and confidence evolution for a workspace",
  },
  {
    uri: "ui://widget/validation-report",
    name: "Validation Report",
    description: "Shows validation outcomes comparing expected vs observed results (Phase C.0)",
  },
  {
    uri: "ui://widget/status-badge",
    name: "Status Badge",
    description: "Shows SPYRAL OS system status with health indicator and capability statuses",
  },
];

/**
 * Map widget names to their renderer functions.
 */
const widgetRenderers: Record<string, (params: any, caps: CapabilityContext, tenantCtx: TenantContext) => Promise<string | null>> = {
  "decision-card": renderDecisionCard,
  "workspace-dashboard": renderWorkspaceDashboard,
  "execution-timeline": renderExecutionTimeline,
  "learning-summary": renderLearningSummary,
  "validation-report": renderValidationReport,
  "status-badge": renderStatusBadge,
};

/**
 * Render a widget by its URI.
 * Returns HTML string, or null if the URI doesn't match any widget.
 */
export async function renderWidget(uri: string, caps: CapabilityContext, tenantCtx: TenantContext): Promise<string | null> {
  const parsed = parseWidgetUri(uri);
  if (!parsed) return null;

  const renderer = widgetRenderers[parsed.widget];
  if (!renderer) return null;

  return renderer(parsed.params, caps, tenantCtx);
}
