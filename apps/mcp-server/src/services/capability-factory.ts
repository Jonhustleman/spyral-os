/**
 * Capability Factory — Wires together repositories, capabilities, and MCP tools.
 *
 * This is the composition root for the MCP server.
 * Following the advisor's recommended architecture:
 *   MCP Tool (thin) → Application Service → Capability (logic) → Repository (persistence)
 *
 * Phase 2 — Milestone B.3
 * Phase C.0 — Application Service Layer: registers ApplicationContext
 * Phase C.1 — Validation Engine (used by services)
 * Phase C.2 — Domain Events: EventBus initialized here
 * Phase C.3 — File-based persistence: JSON file repositories
 * Phase D.1 — Auth, Workflow Engine, Logger, Config
 * Phase D.3 — Infrastructure Adapters (SQLite via InfrastructureFactory)
 */

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

import {
  DecisionCapability,
  ExecutionCapability,
  WorkspaceCapability,
  LearningCapability,
  FileDecisionRepository,
  FileExecutionPlanRepository,
  FileWorkspaceRepository,
  FileLearningRecordRepository,
  FilePatternRepository,
  setApplicationContext,
  getGlobalEventBus,
  AuthService,
  FileUserRepository,
  FileOrganizationRepository,
  FileMembershipRepository,
  FileSessionRepository,
  WorkflowEngineService,
  Logger,
} from "@spyral/capabilities";

import type { InfrastructureProvider, DatabaseConfig } from "@spyral/kernel";
import { InfrastructureFactory, MigrationManager } from "@spyral/infrastructure";
import type { Migration } from "@spyral/infrastructure";

export interface CapabilityContext {
  decision: DecisionCapability;
  execution: ExecutionCapability;
  workspace: WorkspaceCapability;
  learning: LearningCapability;
}

export interface ServiceContext {
  auth: AuthService;
  workflow: WorkflowEngineService;
  logger: Logger;
}

export interface InfrastructureContext {
  provider: InfrastructureProvider;
  config: DatabaseConfig;
}

let instance: CapabilityContext | null = null;
let serviceInstance: ServiceContext | null = null;
let infraInstance: InfrastructureContext | null = null;

/** Get the data directory path for file persistence */
function getDataDir(): string {
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = dirname(__filename);
    return join(__dirname, "..", "..", "data");
  } catch {
    return join(process.cwd(), "data");
  }
}

/** Initialize the infrastructure layer (Phase D.3) */
export async function initializeInfrastructure(
  config?: DatabaseConfig,
  migrations?: Migration[],
): Promise<InfrastructureContext | null> {
  const dbConfig = config ?? { type: "file", filePath: getDataDir() };

  if (dbConfig.type === "file") {
    console.log("[CapabilityFactory] Using file-based persistence");
    infraInstance = { provider: null as any, config: dbConfig };
    return null;
  }

  if (dbConfig.type === "sqlite") {
    console.log("[CapabilityFactory] Initializing SQLite infrastructure");
    const factory = new InfrastructureFactory(dbConfig);
    if (migrations && migrations.length > 0) {
      factory.registerMigrations(migrations);
    }
    await factory.initialize();
    infraInstance = { provider: factory, config: dbConfig };
    return infraInstance;
  }

  throw new Error(`Unsupported database type: ${dbConfig.type}`);
}

/** Initialize all capabilities with file-backed repositories (Phase C.3) or SQLite (Phase D.3) */
function initializeCapabilities(infra?: InfrastructureContext | null): CapabilityContext {
  const dataDir = getDataDir();
  console.log(`[CapabilityFactory] Data directory: ${dataDir}`);

  let decisionRepo;
  let executionRepo;
  let workspaceRepo;
  let learningRepo;
  let patternRepo;

  if (infra?.provider && infra.config.type !== "file") {
    // Use infrastructure provider (SQLite, PostgreSQL, etc.)
    decisionRepo = infra.provider.createDecisionRepository();
    executionRepo = infra.provider.createExecutionPlanRepository();
    workspaceRepo = infra.provider.createWorkspaceRepository();
    learningRepo = infra.provider.createLearningRecordRepository();
    patternRepo = infra.provider.createPatternRepository();
    console.log("[CapabilityFactory] Using infrastructure-backed repositories");
  } else {
    // Default to file-based repositories
    decisionRepo = new FileDecisionRepository(dataDir);
    executionRepo = new FileExecutionPlanRepository(dataDir);
    workspaceRepo = new FileWorkspaceRepository(dataDir);
    learningRepo = new FileLearningRecordRepository(dataDir);
    patternRepo = new FilePatternRepository(dataDir);
    console.log("[CapabilityFactory] Using file-based repositories");
  }

  const ctx: CapabilityContext = {
    decision: new DecisionCapability(decisionRepo),
    execution: new ExecutionCapability(executionRepo),
    workspace: new WorkspaceCapability(workspaceRepo),
    learning: new LearningCapability(learningRepo, patternRepo),
  };

  // Register the ApplicationContext so Application Services can access capabilities
  setApplicationContext(ctx);

  // Initialize the global EventBus (Phase C.2)
  const eventBus = getGlobalEventBus();
  console.log("[CapabilityFactory] EventBus initialized");

  return ctx;
}

/** Initialize Phase D.1 services (auth, workflow, logging) */
function initializeServices(): ServiceContext {
  const dataDir = getDataDir();
  const logger = new Logger("SPYRAL");

  const userRepo = new FileUserRepository(dataDir);
  const orgRepo = new FileOrganizationRepository(dataDir);
  const membershipRepo = new FileMembershipRepository(dataDir);
  const sessionRepo = new FileSessionRepository(dataDir);

  const auth = new AuthService(userRepo, orgRepo, membershipRepo, sessionRepo);
  const workflow = new WorkflowEngineService();

  logger.info("Services initialized", { auth: true, workflow: true });

  return { auth, workflow, logger };
}

/** Get the singleton capability context (Phase D.3: accepts optional InfrastructureContext) */
export function getCapabilities(infra?: InfrastructureContext | null): CapabilityContext {
  if (!instance) {
    instance = initializeCapabilities(infra);
  }
  return instance;
}

/** Get the singleton service context (Phase D.1) */
export function getServices(): ServiceContext {
  if (!serviceInstance) {
    serviceInstance = initializeServices();
  }
  return serviceInstance;
}

/** Get the singleton infrastructure context (Phase D.3) */
export function getInfrastructure(): InfrastructureContext | null {
  return infraInstance;
}

/** For testing: reset all singletons */
export function resetAll(): void {
  instance = null;
  serviceInstance = null;
  infraInstance = null;
}
