/**
 * Shared HTML layout and utilities for SPYRAL widgets.
 *
 * Provides a consistent visual shell for all widget types:
 * - SPYRAL OS brand header
 * - Responsive base styles
 * - Common CSS variables
 * - Helper to wrap widget content in the shell
 */

export interface WidgetShellOptions {
  title: string;
  subtitle?: string;
  theme?: "light" | "dark";
}

/**
 * Wraps widget content in a consistent SPYRAL OS branded HTML shell.
 */
export function widgetShell(content: string, options: WidgetShellOptions): string {
  const { title, subtitle } = options;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>SPYRAL OS — ${escapeHtml(title)}</title>
  <style>
    :root {
      --spyral-bg: #ffffff;
      --spyral-surface: #f8f9fa;
      --spyral-border: #e2e4e8;
      --spyral-text: #1a1d23;
      --spyral-text-secondary: #6b7280;
      --spyral-primary: #7c3aed;
      --spyral-primary-light: #ede9fe;
      --spyral-success: #10b981;
      --spyral-success-light: #d1fae5;
      --spyral-warning: #f59e0b;
      --spyral-warning-light: #fef3c7;
      --spyral-danger: #ef4444;
      --spyral-danger-light: #fee2e2;
      --spyral-info: #3b82f6;
      --spyral-info-light: #dbeafe;
      --spyral-radius: 8px;
      --spyral-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: var(--spyral-bg);
      color: var(--spyral-text);
      line-height: 1.5;
      padding: 0;
    }
    .spyral-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--spyral-border);
      background: var(--spyral-surface);
    }
    .spyral-header h1 {
      font-size: 14px;
      font-weight: 600;
      color: var(--spyral-primary);
      letter-spacing: 0.02em;
    }
    .spyral-header .subtitle {
      font-size: 12px;
      color: var(--spyral-text-secondary);
      margin-left: auto;
    }
    .spyral-body {
      padding: 16px;
    }
    .spyral-section {
      margin-bottom: 16px;
    }
    .spyral-section-title {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--spyral-text-secondary);
      margin-bottom: 8px;
    }
    .spyral-card {
      background: var(--spyral-surface);
      border: 1px solid var(--spyral-border);
      border-radius: var(--spyral-radius);
      padding: 12px;
      box-shadow: var(--spyral-shadow);
    }
    .spyral-card + .spyral-card {
      margin-top: 8px;
    }
    .spyral-badge {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 8px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 500;
    }
    .spyral-badge-success {
      background: var(--spyral-success-light);
      color: #065f46;
    }
    .spyral-badge-warning {
      background: var(--spyral-warning-light);
      color: #92400e;
    }
    .spyral-badge-danger {
      background: var(--spyral-danger-light);
      color: #991b1b;
    }
    .spyral-badge-info {
      background: var(--spyral-info-light);
      color: #1e40af;
    }
    .spyral-badge-primary {
      background: var(--spyral-primary-light);
      color: #5b21b6;
    }
    .spyral-progress-bar {
      height: 6px;
      background: var(--spyral-border);
      border-radius: 3px;
      overflow: hidden;
      margin: 8px 0;
    }
    .spyral-progress-fill {
      height: 100%;
      border-radius: 3px;
      transition: width 0.3s ease;
    }
    .spyral-button {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 500;
      border: 1px solid var(--spyral-border);
      background: var(--spyral-bg);
      color: var(--spyral-text);
      cursor: pointer;
      text-decoration: none;
    }
    .spyral-button:hover {
      background: var(--spyral-surface);
    }
    .spyral-button-primary {
      background: var(--spyral-primary);
      color: white;
      border-color: var(--spyral-primary);
    }
    .spyral-button-primary:hover {
      opacity: 0.9;
    }
    .spyral-grid {
      display: grid;
      gap: 8px;
    }
    .spyral-grid-2 {
      grid-template-columns: 1fr 1fr;
    }
    .spyral-grid-3 {
      grid-template-columns: 1fr 1fr 1fr;
    }
    .spyral-stat {
      text-align: center;
      padding: 12px;
    }
    .spyral-stat-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--spyral-primary);
    }
    .spyral-stat-label {
      font-size: 11px;
      color: var(--spyral-text-secondary);
      margin-top: 2px;
    }
    .spyral-tag {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 4px;
      font-size: 10px;
      background: var(--spyral-surface);
      border: 1px solid var(--spyral-border);
      margin: 1px;
    }
    .spyral-divider {
      border: none;
      border-top: 1px solid var(--spyral-border);
      margin: 12px 0;
    }
    .spyral-option {
      padding: 8px 12px;
      border-left: 3px solid var(--spyral-border);
      margin: 4px 0;
      background: var(--spyral-bg);
      border-radius: 0 var(--spyral-radius) var(--spyral-radius) 0;
    }
    .spyral-option.recommended {
      border-left-color: var(--spyral-primary);
      background: var(--spyral-primary-light);
    }
    .spyral-option-title {
      display: flex;
      align-items: center;
      gap: 6px;
      font-weight: 500;
      font-size: 13px;
    }
    .spyral-option-desc {
      font-size: 12px;
      color: var(--spyral-text-secondary);
      margin-top: 2px;
    }
    .spyral-confidence {
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .spyral-step {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 0;
    }
    .spyral-step-indicator {
      width: 20px;
      height: 20px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 10px;
      font-weight: 600;
      flex-shrink: 0;
    }
    .spyral-step-indicator.done {
      background: var(--spyral-success);
      color: white;
    }
    .spyral-step-indicator.active {
      background: var(--spyral-info);
      color: white;
    }
    .spyral-step-indicator.pending {
      background: var(--spyral-border);
      color: var(--spyral-text-secondary);
    }
    .spyral-step-line {
      width: 2px;
      height: 16px;
      background: var(--spyral-border);
      margin-left: 9px;
    }
    .spyral-step-line.done {
      background: var(--spyral-success);
    }
    .spyral-empty {
      text-align: center;
      padding: 24px;
      color: var(--spyral-text-secondary);
      font-size: 13px;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --spyral-bg: #1a1d23;
        --spyral-surface: #23272f;
        --spyral-border: #343941;
        --spyral-text: #e5e7eb;
        --spyral-text-secondary: #9ca3af;
        --spyral-primary-light: #2e1065;
        --spyral-success-light: #064e3b;
        --spyral-warning-light: #451a03;
        --spyral-danger-light: #7f1d1d;
        --spyral-info-light: #1e3a5f;
      }
      .spyral-option {
        background: var(--spyral-surface);
      }
      .spyral-option.recommended {
        background: #2e1065;
      }
    }
  </style>
</head>
<body>
  <div class="spyral-header">
    <span style="font-size:16px;">✦</span>
    <h1>SPYRAL OS</h1>
    <span class="subtitle">${escapeHtml(subtitle ?? "")}</span>
  </div>
  <div class="spyral-body">
    ${content}
  </div>
</body>
</html>`;
}

/** Escape HTML special characters */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** Parse a URI like ui://widget/decision-card?id=dec_xxx into widget name and params */
export function parseWidgetUri(uri: string): { widget: string; params: Record<string, string> } | null {
  const match = uri.match(/^ui:\/\/widget\/([a-z-]+)\??(.*)$/);
  if (!match) return null;

  const widget = match[1];
  const queryString = match[2];
  const params: Record<string, string> = {};

  if (queryString) {
    for (const part of queryString.split("&")) {
      const [key, value] = part.split("=");
      if (key) params[decodeURIComponent(key)] = decodeURIComponent(value ?? "");
    }
  }

  return { widget, params };
}

/** Format a date string to a concise relative or absolute time */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/** Get a confidence color class */
export function confidenceClass(score: number): string {
  if (score >= 80) return "spyral-badge-success";
  if (score >= 60) return "spyral-badge-warning";
  return "spyral-badge-danger";
}

/** Get a status badge class */
export function statusBadgeClass(status: string): string {
  switch (status) {
    case "active":
    case "completed":
    case "approved":
    case "analyzed":
      return "spyral-badge-success";
    case "draft":
    case "pending":
      return "spyral-badge-warning";
    case "archived":
    case "cancelled":
      return "spyral-badge-danger";
    default:
      return "spyral-badge-info";
  }
}
