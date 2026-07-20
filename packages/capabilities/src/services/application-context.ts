/**
 * ApplicationContext — Central access point for all SPYRAL OS capabilities.
 *
 * This is the service-locator-style context object that MCP tools and
 * Application Services use to access domain capabilities.
 *
 * Phase C.0 — Application Service Layer
 *
 * Architecture:
 *   MCP Tool → Application Service → ApplicationContext → Capabilities → Repositories
 */

import type {
  DecisionCapability,
  ExecutionCapability,
  WorkspaceCapability,
  LearningCapability,
} from "../index.js";

export interface ApplicationContext {
  decision: DecisionCapability;
  execution: ExecutionCapability;
  workspace: WorkspaceCapability;
  learning: LearningCapability;
}

let instance: ApplicationContext | null = null;

/**
 * Set the global application context.
 * Called once at startup by the composition root (capability-factory).
 */
export function setApplicationContext(ctx: ApplicationContext): void {
  instance = ctx;
}

/**
 * Get the global application context.
 * Throws if called before initialization.
 */
export function getApplicationContext(): ApplicationContext {
  if (!instance) {
    throw new Error(
      "ApplicationContext not initialized. Call setApplicationContext() during startup.",
    );
  }
  return instance;
}

/**
 * Reset the application context (for testing).
 */
export function resetApplicationContext(): void {
  instance = null;
}
