/**
 * SPYRAL OS — Kernel Contract
 * EngineHealth — Self-introspection interface for every engine.
 *
 * Per the Chief Architect directive in Sprint 7:
 *   "Every engine should expose coverage, confidence, lastUpdated, and status.
 *    Not because the user needs it. Because SPYRAL should be able to
 *    introspect itself."
 *
 * Eventually, the platform will have an internal diagnostics console
 * that aggregates EngineHealth from every registered engine.
 */

/**
 * Standard health status for an engine.
 */
export type EngineStatus = "healthy" | "degraded" | "unhealthy" | "unknown";

/**
 * Self-reported health of a SPYRAL engine.
 */
export interface EngineHealth {
  /** What percentage of the engine's capabilities are operational (0–100). */
  coverage: number;

  /** How confident the engine is in its current state (0–1). */
  confidence: number;

  /** When this health was last assessed. */
  lastUpdated: Date;

  /** Overall status string. */
  status: EngineStatus;
}
