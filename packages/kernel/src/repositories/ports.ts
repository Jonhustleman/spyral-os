/**
 * @spyral/kernel — Repository Interfaces (Ports)
 *
 * Following DDD hexagonal architecture:
 *   - Ports (interfaces) live in the kernel/domain layer
 *   - Adapters (implementations) live in the capabilities package
 *
 * This allows the domain to be completely independent of infrastructure.
 * The MCP server and web app both depend on the kernel interfaces,
 * while capabilities provide the concrete implementations.
 *
 * Phase 2, Milestone B.3 — Domain Capabilities
 * Status: Repository abstraction layer
 */

import type { TenantContext } from "../types/auth.js";
import type { Decision, DecisionOption } from "../types/decision.js";
import type { ExecutionPlan, ExecutionStep } from "../types/execution.js";
import type { Workspace, WorkspaceSummary } from "../types/workspace.js";
import type { LearningRecord, Pattern } from "../types/learning.js";

// ─── Auth Repository Ports (Phase D.1) ──────────────────────────────────────

export type {
  UserRepository,
  OrganizationRepository,
  MembershipRepository,
  SessionRepository,
} from "../types/auth.js";

// ─── Imports TenantContext from auth ─────────────────────────────────────────
export type { TenantContext } from "../types/auth.js";

// ─── Generic CRUD Operations (Phase D.2 — context-scoped) ──────────────────

export interface Repository<T> {
  findById(ctx: TenantContext, id: string): Promise<T | undefined>;
  findAll(ctx: TenantContext): Promise<T[]>;
  save(ctx: TenantContext, entity: T): Promise<T>;
  delete(ctx: TenantContext, id: string): Promise<boolean>;
}

// ─── Decision Repository ─────────────────────────────────────────────────────

export interface DecisionRepository extends Repository<Decision> {
  findByWorkspaceId(ctx: TenantContext, workspaceId: string): Promise<Decision[]>;
  findByStatus(ctx: TenantContext, status: Decision["status"]): Promise<Decision[]>;
  addOption(ctx: TenantContext, decisionId: string, option: DecisionOption): Promise<Decision>;
  selectOption(ctx: TenantContext, decisionId: string, optionId: string): Promise<Decision>;
}

// ─── Execution Plan Repository ───────────────────────────────────────────────

export interface ExecutionPlanRepository extends Repository<ExecutionPlan> {
  findByDecisionId(ctx: TenantContext, decisionId: string): Promise<ExecutionPlan | undefined>;
  findByWorkspaceId(ctx: TenantContext, workspaceId: string): Promise<ExecutionPlan[]>;
  findByStatus(ctx: TenantContext, status: ExecutionPlan["status"]): Promise<ExecutionPlan[]>;
  updateStep(ctx: TenantContext, planId: string, step: ExecutionStep): Promise<ExecutionPlan>;
}

// ─── Workspace Repository ────────────────────────────────────────────────────

export interface WorkspaceRepository extends Repository<Workspace> {
  findByName(ctx: TenantContext, name: string): Promise<Workspace | undefined>;
  getSummary(ctx: TenantContext, id: string): Promise<WorkspaceSummary | undefined>;
}

// ─── Learning Repository ─────────────────────────────────────────────────────

export interface LearningRecordRepository extends Repository<LearningRecord> {
  findByDecisionId(ctx: TenantContext, decisionId: string): Promise<LearningRecord[]>;
  findByPatternId(ctx: TenantContext, patternId: string): Promise<LearningRecord[]>;
  findByType(ctx: TenantContext, type: LearningRecord["type"]): Promise<LearningRecord[]>;
}

export interface PatternRepository extends Repository<Pattern> {
  findByFrequency(ctx: TenantContext, minFrequency: number): Promise<Pattern[]>;
  findByName(ctx: TenantContext, name: string): Promise<Pattern | undefined>;
}

// ─── Unit of Work (Phase D.3) ───────────────────────────────────────────────

export interface UnitOfWork {
  /** Begin a new transaction. Throws if one is already active. */
  begin(): Promise<void>;

  /** Commit the current transaction. */
  commit(): Promise<void>;

  /** Roll back the current transaction. */
  rollback(): Promise<void>;

  /** Whether a transaction is currently active. */
  isActive(): boolean;

  /** Execute work within a transaction. Auto-commits on success, rolls back on error. */
  executeInTransaction<T>(work: () => Promise<T>): Promise<T>;
}

// ─── Infrastructure Provider (Phase D.3) ────────────────────────────────────

/**
 * Central factory for creating infrastructure adapters.
 * Implementations select the correct backend (file, SQLite, PostgreSQL, etc.)
 * based on configuration.
 */
export interface InfrastructureProvider {
  /** Create a DecisionRepository instance. */
  createDecisionRepository(): DecisionRepository;

  /** Create an ExecutionPlanRepository instance. */
  createExecutionPlanRepository(): ExecutionPlanRepository;

  /** Create a WorkspaceRepository instance. */
  createWorkspaceRepository(): WorkspaceRepository;

  /** Create a LearningRecordRepository instance. */
  createLearningRecordRepository(): LearningRecordRepository;

  /** Create a PatternRepository instance. */
  createPatternRepository(): PatternRepository;

  /** Create a UnitOfWork instance bound to this provider's backend. */
  createUnitOfWork(): UnitOfWork;

  /** Run pending migrations. */
  runMigrations(): Promise<void>;

  /** Close all connections / clean up resources. */
  dispose(): Promise<void>;
}

// ─── Migration Record (Phase D.3) ───────────────────────────────────────────

export interface MigrationRecord {
  id: string;
  description: string;
  appliedAt: string;
  checksum: string;
}
