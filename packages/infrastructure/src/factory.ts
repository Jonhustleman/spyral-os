/**
 * Infrastructure Factory — Composition root for infrastructure adapters.
 *
 * Creates the right adapter implementations (file, SQLite, etc.)
 * based on the provided configuration.
 *
 * Phase D.3 — Infrastructure Adapters (D.3.1, D.3.4)
 */

import type {
  DatabaseConfig,
  DecisionRepository,
  ExecutionPlanRepository,
  WorkspaceRepository,
  LearningRecordRepository,
  PatternRepository,
  InfrastructureProvider,
  UnitOfWork,
  TenantContext,
} from "@spyral/kernel";
import { join } from "node:path";
import { SQLiteConnection } from "./sqlite/connection.js";
import { SqliteDecisionRepository } from "./sqlite/decision-repository.js";
import { SqliteExecutionPlanRepository } from "./sqlite/execution-repository.js";
import { SqliteWorkspaceRepository } from "./sqlite/workspace-repository.js";
import { SqliteLearningRecordRepository } from "./sqlite/learning-repository.js";
import { SqlitePatternRepository } from "./sqlite/pattern-repository.js";
import { SqliteUnitOfWork } from "./unit-of-work.js";
import { MigrationManager } from "./migrations/manager.js";
import type { Migration } from "./migrations/manager.js";

/**
 * Initial schema migration for SQLite.
 * Creates all domain tables and the migrations tracking table.
 */
const INITIAL_SCHEMA_MIGRATION: Migration = {
  id: "001-initial-schema",
  description: "Create initial domain tables",
  up: `
    CREATE TABLE IF NOT EXISTS decisions (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      org_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      intent TEXT NOT NULL,
      context TEXT NOT NULL,
      options TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'draft',
      recommended_option_id TEXT,
      selected_option_id TEXT,
      confidence REAL NOT NULL DEFAULT 0.0,
      tags TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS execution_plans (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      decision_id TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      org_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      steps TEXT NOT NULL DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'draft',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      org_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      goal TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active',
      dna TEXT NOT NULL DEFAULT '{}',
      tags TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS learning_records (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      decision_id TEXT,
      outcome_ids TEXT NOT NULL DEFAULT '[]',
      pattern_ids TEXT NOT NULL DEFAULT '[]',
      type TEXT NOT NULL,
      content TEXT NOT NULL,
      confidence REAL NOT NULL DEFAULT 0.0,
      confidence_delta REAL NOT NULL DEFAULT 0.0,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS patterns (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      type TEXT NOT NULL,
      frequency INTEGER NOT NULL DEFAULT 0,
      observations TEXT NOT NULL DEFAULT '[]',
      recommendation TEXT,
      confidence REAL NOT NULL DEFAULT 0.0,
      related_pattern_ids TEXT NOT NULL DEFAULT '[]',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_decisions_workspace_id ON decisions(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_decisions_status ON decisions(status);
    CREATE INDEX IF NOT EXISTS idx_execution_plans_workspace_id ON execution_plans(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_execution_plans_decision_id ON execution_plans(decision_id);
    CREATE INDEX IF NOT EXISTS idx_learning_records_workspace_id ON learning_records(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_learning_records_decision_id ON learning_records(decision_id);
    CREATE INDEX IF NOT EXISTS idx_patterns_workspace_id ON patterns(workspace_id);
    CREATE INDEX IF NOT EXISTS idx_patterns_name ON patterns(name);
  `,
  down: `
    DROP TABLE IF EXISTS decisions;
    DROP TABLE IF EXISTS execution_plans;
    DROP TABLE IF EXISTS workspaces;
    DROP TABLE IF EXISTS learning_records;
    DROP TABLE IF EXISTS patterns;
  `,
};

export class InfrastructureFactory implements InfrastructureProvider {
  private readonly config: DatabaseConfig;
  private sqliteConnection: SQLiteConnection | null = null;
  private repos: {
    decision: DecisionRepository | null;
    execution: ExecutionPlanRepository | null;
    workspace: WorkspaceRepository | null;
    learning: LearningRecordRepository | null;
    pattern: PatternRepository | null;
  } = {
    decision: null,
    execution: null,
    workspace: null,
    learning: null,
    pattern: null,
  };
  private _unitOfWork: SqliteUnitOfWork | null = null;
  private _migrationManager: MigrationManager | null = null;
  private migrations: Migration[] = [];

  constructor(config: DatabaseConfig) {
    this.config = config;
    // Register the default initial schema migration
    this.migrations.push(INITIAL_SCHEMA_MIGRATION);
  }

  /** Register programmatic migrations to run during initialization. */
  registerMigrations(migrations: Migration[]): void {
    this.migrations.push(...migrations);
  }

  /** Initialize the infrastructure layer. Must be called before use. */
  async initialize(): Promise<void> {
    if (this.config.type === "sqlite") {
      await this.initializeSqlite();
    }
    // For "file" type, repositories are created on-demand via capability-factory
    // For "postgres", TBD in future phase
  }

  private async initializeSqlite(): Promise<void> {
    const dbPath = this.config.sqlitePath ?? join(this.config.filePath ?? "./data", "spyral.db");
    this.sqliteConnection = new SQLiteConnection(dbPath);
    this.sqliteConnection.open();

    // Run migrations
    this._migrationManager = new MigrationManager(this.sqliteConnection, {
      migrationsDir: this.config.filePath ? join(this.config.filePath, "migrations") : undefined,
    });

    // Register any programmatic migrations
    if (this.migrations.length > 0) {
      this._migrationManager.registerMigrations(this.migrations);
    }

    // Run pending file-based migrations
    await this._migrationManager.runPending();

    // Create repositories
    this.repos.decision = new SqliteDecisionRepository(this.sqliteConnection);
    this.repos.execution = new SqliteExecutionPlanRepository(this.sqliteConnection);
    this.repos.workspace = new SqliteWorkspaceRepository(this.sqliteConnection);
    this.repos.learning = new SqliteLearningRecordRepository(this.sqliteConnection);
    this.repos.pattern = new SqlitePatternRepository(this.sqliteConnection);

    // Create Unit of Work
    this._unitOfWork = new SqliteUnitOfWork(this.sqliteConnection);
  }

  createDecisionRepository(): DecisionRepository {
    if (!this.repos.decision) {
      throw new Error("Infrastructure not initialized. Call initialize() first.");
    }
    return this.repos.decision;
  }

  createExecutionPlanRepository(): ExecutionPlanRepository {
    if (!this.repos.execution) {
      throw new Error("Infrastructure not initialized. Call initialize() first.");
    }
    return this.repos.execution;
  }

  createWorkspaceRepository(): WorkspaceRepository {
    if (!this.repos.workspace) {
      throw new Error("Infrastructure not initialized. Call initialize() first.");
    }
    return this.repos.workspace;
  }

  createLearningRecordRepository(): LearningRecordRepository {
    if (!this.repos.learning) {
      throw new Error("Infrastructure not initialized. Call initialize() first.");
    }
    return this.repos.learning;
  }

  createPatternRepository(): PatternRepository {
    if (!this.repos.pattern) {
      throw new Error("Infrastructure not initialized. Call initialize() first.");
    }
    return this.repos.pattern;
  }

  createUnitOfWork(): UnitOfWork {
    if (!this._unitOfWork) {
      throw new Error("Infrastructure not initialized. Call initialize() first.");
    }
    return this._unitOfWork;
  }

  async runMigrations(): Promise<void> {
    if (this._migrationManager) {
      await this._migrationManager.runPending();
    }
  }

  async dispose(): Promise<void> {
    if (this.sqliteConnection) {
      this.sqliteConnection.close();
      this.sqliteConnection = null;
    }
    this.repos = {
      decision: null,
      execution: null,
      workspace: null,
      learning: null,
      pattern: null,
    };
    this._unitOfWork = null;
    this._migrationManager = null;
  }
}
