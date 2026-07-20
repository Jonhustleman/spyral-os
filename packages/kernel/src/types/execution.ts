/**
 * @spyral/kernel — Execution Domain Types
 *
 * Per ADR-0024: Execution is independent from Decision.
 * The Execution Plan consumes Decisions and produces Results.
 */

import type { DomainEntity } from "./common.js";

export type ExecutionStepStatus = "pending" | "in_progress" | "completed" | "blocked" | "skipped";
export type ExecutionPlanStatus = "draft" | "active" | "completed" | "paused" | "failed";

export interface ExecutionStep {
  id: string;
  title: string;
  description: string;
  status: ExecutionStepStatus;
  assignee?: string;
  dueDate?: string;
  dependencies: string[];
}

export interface ExecutionPlan extends DomainEntity {
  workspaceId: string;
  decisionId: string;
  ownerId: string;
  orgId: string;
  title: string;
  description?: string;
  steps: ExecutionStep[];
  status: ExecutionPlanStatus;
  startedAt?: string;
  completedAt?: string;
}

export interface ExecutionPlanSummary {
  id: string;
  title: string;
  status: ExecutionPlanStatus;
  stepCount: number;
  completedSteps: number;
  decisionId: string;
}
