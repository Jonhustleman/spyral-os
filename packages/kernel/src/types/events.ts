/**
 * @spyral/kernel — Domain Event Types
 *
 * Lightweight domain events for SPYRAL OS (Phase C.2).
 * Events are emitted by capabilities/services and dispatched
 * synchronously via an in-memory EventBus.
 *
 * Architecture:
 *   Capability/Service → emit(event) → EventBus → dispatch(handler)
 *
 * Initially synchronous. Can be made async with message queue later.
 */

// ─── Event Names ─────────────────────────────────────────────────────────────

export type DomainEventName =
  | "DecisionCreated"
  | "DecisionValidated"
  | "DecisionOptionSelected"
  | "ExecutionPlanCreated"
  | "ExecutionPlanStarted"
  | "ExecutionStepCompleted"
  | "ExecutionCompleted"
  | "LearningRecorded"
  | "WorkspaceCreated"
  | "WorkspaceUpdated"
  | "WorkspaceArchived"
  | "RealityCycleCompleted"
  | "RealityCycleFeedbackSubmitted";

// ─── Base Event ──────────────────────────────────────────────────────────────

export interface DomainEvent {
  eventName: DomainEventName;
  eventId: string;
  aggregateId: string;
  aggregateType: "decision" | "execution" | "workspace" | "learning" | "reality-cycle";
  timestamp: string;
  payload: Record<string, unknown>;
}

// ─── Specific Event Payloads ─────────────────────────────────────────────────

export interface DecisionCreatedPayload {
  decisionId: string;
  workspaceId: string;
  title: string;
  confidence: number;
  optionCount: number;
}

export interface DecisionValidatedPayload {
  decisionId: string;
  valid: boolean;
  overallScore: number;
  risk: string;
  issues: string[];
}

export interface DecisionOptionSelectedPayload {
  decisionId: string;
  optionId: string;
  optionTitle: string;
}

export interface ExecutionPlanCreatedPayload {
  planId: string;
  decisionId: string;
  workspaceId: string;
  title: string;
  stepCount: number;
}

export interface ExecutionPlanStartedPayload {
  planId: string;
  startedAt: string;
}

export interface ExecutionStepCompletedPayload {
  planId: string;
  stepId: string;
  stepIndex: number;
  status: string;
}

export interface ExecutionCompletedPayload {
  planId: string;
  completedSteps: number;
  totalSteps: number;
  duration: number;
}

export interface LearningRecordedPayload {
  recordId: string;
  workspaceId: string;
  decisionId?: string;
  type: string;
  confidence: number;
}

export interface WorkspaceCreatedPayload {
  workspaceId: string;
  name: string;
  goal: string;
}

export interface WorkspaceUpdatedPayload {
  workspaceId: string;
  changes: string[];
}

export interface RealityCycleCompletedPayload {
  workspaceId: string;
  decisionId: string;
  goal: string;
  confidence: number;
  stages: string[];
}

// ─── Event Handler Type ─────────────────────────────────────────────────────

export type DomainEventHandler = (event: DomainEvent) => void | Promise<void>;
