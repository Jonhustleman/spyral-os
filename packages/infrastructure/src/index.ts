/**
 * @spyral/infrastructure — Infrastructure Adapters
 *
 * Contains database adapters (SQLite, PostgreSQL), Unit of Work,
 * migration system, and the InfrastructureFactory composition root.
 *
 * Architecture:
 *   Kernel (ports) ← Capabilities (business logic) ← Infrastructure (adapters)
 *
 * Phase D.3 — Infrastructure Adapters
 */

// ─── SQLite Connection Manager ──────────────────────────────────────────────

export { SQLiteConnection } from "./sqlite/connection.js";

// ─── SQLite Repository Implementations ──────────────────────────────────────

export { SqliteDecisionRepository } from "./sqlite/decision-repository.js";
export { SqliteExecutionPlanRepository } from "./sqlite/execution-repository.js";
export { SqliteWorkspaceRepository } from "./sqlite/workspace-repository.js";
export { SqliteLearningRecordRepository } from "./sqlite/learning-repository.js";
export { SqlitePatternRepository } from "./sqlite/pattern-repository.js";

// ─── Unit of Work ───────────────────────────────────────────────────────────

export { SqliteUnitOfWork } from "./unit-of-work.js";

// ─── Migration System ───────────────────────────────────────────────────────

export { MigrationManager } from "./migrations/manager.js";
export type { Migration } from "./migrations/manager.js";

// ─── Infrastructure Factory ─────────────────────────────────────────────────

export { InfrastructureFactory } from "./factory.js";

// ─── Configuration Validation (D.4.4) ───────────────────────────────────────

export { validateConfig } from "./config-validator.js";
export type {
  ConfigValidationResult,
  ConfigValidationReport,
  ConfigError,
  ConfigWarning,
} from "./config-validator.js";

// ─── Backup & Restore (D.4.5) ───────────────────────────────────────────────

export { createBackup, restoreFromBackup } from "./backup.js";
export type { BackupResult, RestoreResult, BackupMetadata } from "./backup.js";
