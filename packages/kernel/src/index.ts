/**
 * @spyral/kernel — Shared Domain Contracts
 *
 * Core DDD types shared across all SPYRAL OS packages.
 * These contracts define the domain language used by both
 * the Next.js UI (apps/web) and the MCP server (apps/mcp-server).
 *
 * Phase 2, Milestone B.3 — Domain Capabilities + Repository Abstraction
 * Status: Expanded with repository ports and typed domain modules
 */

// ─── Common Base Types ───────────────────────────────────────────────────────

export type { EntityId, Timestamp, DomainEntity, HealthStatus, CapabilityStatus, SystemStatus } from "./types/common.js";

// ─── Decision Domain ─────────────────────────────────────────────────────────

export type {
  DecisionOption,
  DecisionStatus,
  Decision,
  DecisionSummary,
} from "./types/decision.js";

// ─── Execution Domain ────────────────────────────────────────────────────────

export type {
  ExecutionStepStatus,
  ExecutionPlanStatus,
  ExecutionStep,
  ExecutionPlan,
  ExecutionPlanSummary,
} from "./types/execution.js";

// ─── Workspace Domain ────────────────────────────────────────────────────────

export type {
  WorkspaceStatus,
  WorkspaceDNA,
  Workspace,
  WorkspaceSummary,
  WorkspaceAggregate,
} from "./types/workspace.js";

// ─── Learning Domain ─────────────────────────────────────────────────────────

export type {
  LearningRecordType,
  LearningRecord,
  Pattern,
} from "./types/learning.js";

// ─── Auth Domain Types (Phase D.1) ────────────────────────────────────────

export type {
  Role,
  ResourceType,
  PermissionAction,
  Permission,
  UserStatus,
  User,
  OrganizationSettings,
  Organization,
  Membership,
  Session,
  AuthContext,
  TenantContext,
  RegisterRequest,
  RegisterResponse,
  LoginRequest,
  LoginResponse,
  VerifySessionRequest,
  VerifySessionResponse,
  UserRepository,
  OrganizationRepository,
  MembershipRepository,
  SessionRepository,
} from "./types/auth.js";
export { ROLE_PERMISSIONS } from "./types/auth.js";

// ─── Auth DTOs (Phase D.1) ────────────────────────────────────────────────

export type {
  RegisterUserRequest,
  RegisterUserResponse,
  LoginUserRequest,
  LoginUserResponse,
  GetProfileRequest,
  GetProfileResponse,
  ListOrganizationMembersRequest,
  ListOrganizationMembersResponse,
  UpdateMembershipRequest,
  UpdateMembershipResponse,
} from "./types/auth-dto.js";

// ─── Workflow Engine Types (Phase D.1) ─────────────────────────────────────

export type {
  WorkflowStatus,
  WorkflowStepType,
  WorkflowStepConfig,
  WorkflowStep,
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowExecutionRecord,
  WorkflowTrigger,
  WorkflowEngine,
  WorkflowAuditEntry,
} from "./types/workflow.js";

// ─── Audit Trail Types (Phase D.2) ─────────────────────────────────────────

export type {
  AuditSeverity,
  AuditCategory,
  AuditEvent,
} from "./types/audit.js";
export { createAuditEvent, AUDIT_ACTIONS } from "./types/audit.js";

// ─── Application Service DTOs (Phase C.0) ──────────────────────────────────

export type {
  CreateDecisionRequest,
  CreateDecisionResponse,
  GetDecisionRequest,
  GetDecisionResponse,
  ListDecisionsRequest,
  ListDecisionsResponse,
  CreateExecutionPlanRequest,
  CreateExecutionPlanResponse,
  GetExecutionPlanRequest,
  GetExecutionPlanResponse,
  ListExecutionPlansRequest,
  ListExecutionPlansResponse,
  CreateWorkspaceRequest,
  CreateWorkspaceResponse,
  GetWorkspaceRequest,
  GetWorkspaceResponse,
  WorkspaceDashboardResponse,
  RecordLearningRequest,
  RecordLearningResponse,
  LearningSummaryResponse,
  ValidateDecisionRequest,
  ValidateDecisionResponse,
} from "./types/dto.js";

// ─── Validation Engine Types (Phase C.1) ────────────────────────────────────

export type {
  ValidationStage,
  RiskLevel,
  ValidationCheck,
  RiskAssessment,
  ValidationRecommendation,
  ValidationResult,
  ValidationEngineConfig,
} from "./types/validation.js";
export { DEFAULT_VALIDATION_CONFIG } from "./types/validation.js";

// ─── Domain Event Types (Phase C.2) ─────────────────────────────────────────

export type {
  DomainEventName,
  DomainEvent,
  DecisionCreatedPayload,
  DecisionValidatedPayload,
  DecisionOptionSelectedPayload,
  ExecutionPlanCreatedPayload,
  ExecutionPlanStartedPayload,
  ExecutionStepCompletedPayload,
  ExecutionCompletedPayload,
  LearningRecordedPayload,
  WorkspaceCreatedPayload,
  WorkspaceUpdatedPayload,
  RealityCycleCompletedPayload,
  DomainEventHandler,
} from "./types/events.js";

// ─── Reality Cycle Types (Phase E.0 — ChatGPT App Pilot) ─────────────────

export type {
  BeginRealityCycleRequest,
  BeginRealityCycleResponse,
  RealityCycleResponse,
  RealityStage,
  StageResult,
  SOPResult,
  CurrentRealityAssessment,
  LDEResult,
  STEResult,
  Trajectory,
  StrategyOption,
  Strategy,
  Milestone,
  SVEResult,
  Risk,
  SAEResult,
  LearningPathway,
  MeasurementPlan,
  UserRating,
  RealityCycleFeedback,
  SubmitFeedbackRequest,
  Prediction,
  CreatePredictionRequest,
  ResolvePredictionRequest,
  PilotModeState,
  CycleIdentity,
  RealityGapAnalysis,
  CycleQuality,
  PilotProfile,
  SubmitFeedbackResponse,
} from "./types/reality-cycle.js";

// ─── Repository Ports (Hexagonal Architecture) ───────────────────────────────

export type {
  Repository,
  DecisionRepository,
  ExecutionPlanRepository,
  WorkspaceRepository,
  LearningRecordRepository,
  PatternRepository,
  UnitOfWork,
  InfrastructureProvider,
  MigrationRecord,
} from "./repositories/ports.js";

// ─── Config Types (Phase D.1) ─────────────────────────────────────────────

export type {
  SecretsConfig,
  LoggingConfig,
  ServerConfig,
  DatabaseConfig,
  MigrationConfig,
  SpyralConfig,
} from "./types/config.js";
export { DEFAULT_CONFIG } from "./types/config.js";
