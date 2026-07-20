/**
 * @spyral/kernel — Application Service DTOs
 *
 * Shared request/response types for the Application Service Layer (Phase C.0).
 * These DTOs decouple MCP transport from business workflows.
 *
 * Architecture:
 *   ChatGPT ↓ MCP Tool ↓ Application Service (DTOs) ↓ Capabilities ↓ Kernel
 */

import type { Decision, DecisionSummary } from "./decision.js";
import type { ExecutionPlan, ExecutionPlanSummary } from "./execution.js";
import type { Workspace, WorkspaceSummary } from "./workspace.js";
import type { LearningRecord, Pattern } from "./learning.js";

// ─── Decision Service DTOs ───────────────────────────────────────────────────

export interface CreateDecisionRequest {
  workspaceId: string;
  title: string;
  intent: string;
  context?: string;
  tags?: string[];
}

export interface CreateDecisionResponse {
  decision: Decision;
  summary: DecisionSummary;
}

export interface GetDecisionRequest {
  id: string;
}

export interface GetDecisionResponse {
  decision: Decision | null;
}

export interface ListDecisionsRequest {
  workspaceId: string;
}

export interface ListDecisionsResponse {
  decisions: DecisionSummary[];
}

// ─── Execution Plan Service DTOs ─────────────────────────────────────────────

export interface CreateExecutionPlanRequest {
  workspaceId: string;
  decisionId: string;
  title: string;
  description?: string;
}

export interface CreateExecutionPlanResponse {
  plan: ExecutionPlan;
}

export interface GetExecutionPlanRequest {
  id: string;
}

export interface GetExecutionPlanResponse {
  plan: ExecutionPlan | null;
}

export interface ListExecutionPlansRequest {
  workspaceId: string;
}

export interface ListExecutionPlansResponse {
  plans: ExecutionPlanSummary[];
}

// ─── Workspace Service DTOs ──────────────────────────────────────────────────

export interface CreateWorkspaceRequest {
  name: string;
  description: string;
  goal: string;
  type?: string;
  tags?: string[];
}

export interface CreateWorkspaceResponse {
  workspace: Workspace;
}

export interface GetWorkspaceRequest {
  id: string;
}

export interface GetWorkspaceResponse {
  workspace: Workspace | null;
}

export interface WorkspaceDashboardResponse {
  workspace: Workspace;
  summary: WorkspaceSummary | undefined;
  recentDecisions: DecisionSummary[];
  recentExecutions: ExecutionPlanSummary[];
  learningRecords: LearningRecord[];
}

// ─── Learning Service DTOs ───────────────────────────────────────────────────

export interface RecordLearningRequest {
  workspaceId: string;
  decisionId?: string;
  outcomeIds: string[];
  type: LearningRecord["type"];
  content: string;
  confidence: number;
  description?: string;
}

export interface RecordLearningResponse {
  record: LearningRecord;
}

export interface LearningSummaryResponse {
  records: LearningRecord[];
  patterns: Pattern[];
}

// ─── Validation Service DTOs (Phase C.1) ────────────────────────────────────

import type { ValidationResult } from "./validation.js";

export interface ValidateDecisionRequest {
  decisionId: string;
}

export interface ValidateDecisionResponse extends ValidationResult {
  // Full ValidationResult from the engine
}
