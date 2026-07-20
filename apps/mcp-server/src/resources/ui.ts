/**
 * UI Resource Definitions for SPYRAL MCP Server
 *
 * These define the widget resources that the Apps SDK uses to render
 * rich UI components inside ChatGPT. Each widget is rendered server-side
 * as HTML with inline CSS, pulling live data from the capability layer.
 *
 * Phase: B.4 — UI Layer
 *
 * Architecture:
 *   ChatGPT → MCP resources/read → Widget Registry → Capability → Repository
 *
 * Widget URIs:
 *   ui://widget/decision-card?id={decisionId}
 *   ui://widget/workspace-dashboard?id={workspaceId}
 *   ui://widget/execution-timeline?id={executionId}
 *   ui://widget/learning-summary?workspaceId={workspaceId}
 *   ui://widget/validation-report?executionId={executionId}
 *   ui://widget/status-badge
 */

import type { CapabilityContext } from "../services/capability-factory.js";
import type { TenantContext } from "@spyral/kernel";
import type { ResourceDefinition } from "../types.js";
import { widgetDefinitions, renderWidget } from "../widgets/registry.js";

/**
 * Available UI resources — computed from the widget registry.
 * Each widget is registered with its URI, name, and description.
 */
export const uiResources: ResourceDefinition[] = widgetDefinitions.map((w) => ({
  uri: w.uri,
  name: w.name,
  description: w.description,
  mimeType: "text/html" as const,
}));

/**
 * Returns the widget HTML for a given resource URI.
 * Fetches live data from the capability layer and renders it as HTML.
 *
 * @param uri - The resource URI (e.g., ui://widget/decision-card?id=dec_xxx)
 * @param caps - The capability context for data access
 * @returns HTML string or null if the URI doesn't match any widget
 */
export async function getWidgetHtml(uri: string, caps: CapabilityContext, tenantCtx: TenantContext): Promise<string | null> {
  return renderWidget(uri, caps, tenantCtx);
}
