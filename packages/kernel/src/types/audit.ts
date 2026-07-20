/**
 * @spyral/kernel — Audit Trail Types
 *
 * Phase D.2.5 — Audit Trail
 * Distinguishes operational logs from business audit events.
 * Audit events answer: who changed what, when, and why?
 */

import type { TenantContext } from "./auth.js";

// ─── Audit Event Severity ────────────────────────────────────────────────────

export type AuditSeverity = "info" | "warning" | "error" | "critical";

// ─── Audit Event Categories ──────────────────────────────────────────────────

export type AuditCategory =
  | "auth"
  | "decision"
  | "execution"
  | "workspace"
  | "learning"
  | "organization"
  | "workflow"
  | "policy"
  | "system";

// ─── Core Audit Event ────────────────────────────────────────────────────────

export interface AuditEvent {
  /** Unique event ID */
  id: string;
  /** ISO timestamp */
  timestamp: string;
  /** Event category */
  category: AuditCategory;
  /** Event action name (e.g. "DecisionCreated", "RoleChanged") */
  action: string;
  /** Who performed the action */
  actorId: string;
  /** Organization scope */
  organizationId: string;
  /** Optional workspace scope */
  workspaceId?: string;
  /** Optional session ID */
  sessionId?: string;
  /** Optional correlation ID for request tracing */
  requestId?: string;
  /** The ID of the resource affected */
  resourceId?: string;
  /** The type of resource affected */
  resourceType?: string;
  /** Severity level */
  severity: AuditSeverity;
  /** Human-readable summary */
  summary: string;
  /** Detailed metadata (changes, reasons, etc.) */
  details?: Record<string, unknown>;
  /** Previous state snapshot (for mutations) */
  previousState?: Record<string, unknown>;
  /** New state snapshot (for mutations) */
  newState?: Record<string, unknown>;
}

// ─── Audit Event Factory ─────────────────────────────────────────────────────

export function createAuditEvent(
  category: AuditCategory,
  action: string,
  ctx: TenantContext,
  overrides: Partial<AuditEvent> = {},
): AuditEvent {
  return {
    id: `aud_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    category,
    action,
    actorId: ctx.userId,
    organizationId: ctx.organizationId,
    workspaceId: ctx.workspaceId,
    sessionId: ctx.sessionId,
    requestId: ctx.requestId,
    severity: "info",
    summary: `${action} by ${ctx.userId}`,
    ...overrides,
  };
}

// ─── Predefined Audit Action Constants ───────────────────────────────────────

export const AUDIT_ACTIONS = {
  // Auth
  USER_REGISTERED: "UserRegistered",
  USER_LOGGED_IN: "UserLoggedIn",
  USER_LOGGED_OUT: "UserLoggedOut",
  SESSION_REVOKED: "SessionRevoked",
  ROLE_CHANGED: "RoleChanged",
  MEMBER_ADDED: "MemberAdded",
  MEMBER_REMOVED: "MemberRemoved",

  // Decision
  DECISION_CREATED: "DecisionCreated",
  DECISION_UPDATED: "DecisionUpdated",
  DECISION_APPROVED: "DecisionApproved",
  DECISION_ABANDONED: "DecisionAbandoned",

  // Execution
  EXECUTION_STARTED: "ExecutionStarted",
  EXECUTION_COMPLETED: "ExecutionCompleted",
  EXECUTION_PAUSED: "ExecutionPaused",
  EXECUTION_FAILED: "ExecutionFailed",
  STEP_COMPLETED: "StepCompleted",

  // Workspace
  WORKSPACE_CREATED: "WorkspaceCreated",
  WORKSPACE_UPDATED: "WorkspaceUpdated",
  WORKSPACE_ARCHIVED: "WorkspaceArchived",

  // Workflow
  WORKFLOW_STARTED: "WorkflowStarted",
  WORKFLOW_COMPLETED: "WorkflowCompleted",
  WORKFLOW_PAUSED: "WorkflowPaused",
  WORKFLOW_RETRIED: "WorkflowRetried",

  // Policy
  POLICY_VIOLATION: "PolicyViolation",
  PERMISSION_DENIED: "PermissionDenied",

  // Organization
  ORGANIZATION_CREATED: "OrganizationCreated",
  ORGANIZATION_UPDATED: "OrganizationUpdated",
} as const;
