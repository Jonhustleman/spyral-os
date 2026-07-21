/**
 * @spyral/capabilities — Shared Business Logic
 *
 * Contains reusable business logic shared between the
 * Next.js UI (apps/web) and the MCP server (apps/mcp-server).
 *
 * Architecture:
 *   MCP Tool (thin) → Capability (logic) → Repository (persistence)
 *
 * Phase 2, Milestone B.3 — Domain Capabilities + Memory Repositories
 */

// ─── Capability Classes ──────────────────────────────────────────────────────

export { DecisionCapability } from "./decision-capability.js";
export type { CreateDecisionInput, DecisionAnalysisResult } from "./decision-capability.js";

export { ExecutionCapability } from "./execution-capability.js";
export type { CreateExecutionPlanInput } from "./execution-capability.js";

export { WorkspaceCapability } from "./workspace-capability.js";
export type { CreateWorkspaceInput } from "./workspace-capability.js";

export { LearningCapability } from "./learning-capability.js";
export type { RecordLearningInput } from "./learning-capability.js";

// ─── Memory Repository Implementations ───────────────────────────────────────

export { MemoryDecisionRepository } from "./repositories/memory/decision-repository.js";
export { MemoryExecutionPlanRepository } from "./repositories/memory/execution-repository.js";
export { MemoryWorkspaceRepository } from "./repositories/memory/workspace-repository.js";
export { MemoryLearningRecordRepository, MemoryPatternRepository } from "./repositories/memory/learning-repository.js";

// ─── Application Services (Phase C.0) ─────────────────────────────────────

export { setApplicationContext, getApplicationContext, resetApplicationContext } from "./services/application-context.js";
export type { ApplicationContext } from "./services/application-context.js";

export { CreateDecisionService } from "./services/create-decision-service.js";
export { CreateExecutionPlanService } from "./services/create-execution-plan-service.js";
export { RecordLearningService } from "./services/record-learning-service.js";
export { WorkspaceDashboardService } from "./services/workspace-dashboard-service.js";
export { ValidateDecisionService } from "./services/validate-decision-service.js";
export { RealityCycleService } from "./services/reality-cycle-service.js";
export { RealityCycleFeedbackService } from "./services/reality-cycle-feedback-service.js";

// ─── Phase C.1: Validation Engine ─────────────────────────────────────────

export { ValidationEngine } from "./services/validation-engine.js";

// ─── Phase C.1.5: Observability ───────────────────────────────────────────

export { ObservabilityContext } from "./services/observability.js";
export type { ObservabilityOptions, TraceStep, ObservabilityReport } from "./services/observability.js";

// ─── Phase C.2: Domain Events ─────────────────────────────────────────────

export { EventBus, getGlobalEventBus, resetGlobalEventBus } from "./services/event-bus.js";

// ─── Phase C.3: File-Based Persistence ────────────────────────────────────

export { FileDecisionRepository } from "./repositories/file/decision-repository.js";
export { FileExecutionPlanRepository } from "./repositories/file/execution-repository.js";
export { FileWorkspaceRepository } from "./repositories/file/workspace-repository.js";
export { FileLearningRecordRepository, FilePatternRepository } from "./repositories/file/learning-repository.js";

// ─── Phase D.1: Auth Services ─────────────────────────────────────────────

export { AuthService } from "./services/auth-service.js";

// ─── Phase D.1: Workflow Engine ───────────────────────────────────────────

export { WorkflowEngineService } from "./services/workflow-engine-service.js";

// ─── Phase D.1: Logger ────────────────────────────────────────────────────

export { Logger } from "./services/logger.js";
export type { LogLevel } from "./services/logger.js";

// ─── Phase D.2: Policy Engine ─────────────────────────────────────────────

export { PolicyFactory, DecisionPolicy, WorkspacePolicy, ExecutionPolicy, LearningPolicy } from "./services/policy-engine.js";
export type { PolicyAction, PolicyResult } from "./services/policy-engine.js";

// ─── Phase D.1: File-Based Auth Repositories ──────────────────────────────

export { FileUserRepository } from "./repositories/file/user-repository.js";
export { FileOrganizationRepository } from "./repositories/file/organization-repository.js";
export { FileMembershipRepository } from "./repositories/file/membership-repository.js";
export { FileSessionRepository } from "./repositories/file/session-repository.js";

// TODO: Extract shared business logic as Phase 2 progresses:
// - Decision analysis engine
// - Confidence scoring
// - Reality gap calculator
// - Pattern matcher
