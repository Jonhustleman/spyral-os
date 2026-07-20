/**
 * @spyral/kernel — Workflow Engine Types
 *
 * Phase D.1 — Workflow Engine prototype.
 * Lightweight workflow engine for orchestrating multi-step processes.
 * Supports configurable workflows, retry, approval gates, and auditability.
 */

import type { DomainEntity } from "./common.js";

export type WorkflowStatus = "draft" | "active" | "paused" | "completed" | "failed";

export type WorkflowStepType = "task" | "approval" | "notification" | "subprocess" | "condition" | "parallel";

export interface WorkflowStepConfig {
  timeout?: number;
  retryCount?: number;
  retryDelay?: number;
  assigneeRole?: string;
  formSchema?: Record<string, unknown>;
}

export interface WorkflowStep {
  id: string;
  name: string;
  type: WorkflowStepType;
  description?: string;
  config: WorkflowStepConfig;
  next: string[];
}

export interface WorkflowTrigger {
  event: string;
  condition?: string;
}

export interface WorkflowDefinition extends DomainEntity {
  name: string;
  description?: string;
  version: string;
  steps: WorkflowStep[];
  triggers: WorkflowTrigger[];
  status: WorkflowStatus;
}

export interface WorkflowExecutionRecord {
  stepId: string;
  status: "running" | "completed" | "failed" | "skipped";
  startedAt: string;
  completedAt?: string;
  error?: string;
  output?: Record<string, unknown>;
}

export interface WorkflowInstance extends DomainEntity {
  definitionId: string;
  triggerEvent: string;
  status: WorkflowStatus;
  currentStepId?: string;
  context: Record<string, unknown>;
  history: WorkflowExecutionRecord[];

  // ─── Phase D.2 — Tenant Metadata ────────────────────────────────────────
  /** Organization that owns this workflow instance */
  organizationId: string;
  /** Optional workspace scope */
  workspaceId?: string;
  /** User who started the workflow */
  startedBy: string;
  /** Current assignee for approval steps */
  currentAssignee?: string;
  /** Audit log of state transitions */
  auditLog: WorkflowAuditEntry[];
}

/** Phase D.2 — Workflow audit entry for tracking state transitions */
export interface WorkflowAuditEntry {
  timestamp: string;
  fromStatus: WorkflowStatus;
  toStatus: WorkflowStatus;
  stepId?: string;
  actorId: string;
  reason?: string;
}

export interface WorkflowEngine {
  execute(definition: WorkflowDefinition, context: Record<string, unknown>): Promise<WorkflowInstance>;
  advance(instance: WorkflowInstance): Promise<WorkflowInstance>;
  pause(instanceId: string): Promise<WorkflowInstance>;
  resume(instanceId: string): Promise<WorkflowInstance>;
  retry(instanceId: string, stepId: string): Promise<WorkflowInstance>;
}
