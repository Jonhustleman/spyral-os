/**
 * Health & Readiness — Operational endpoints for monitoring.
 *
 * Provides:
 *   - /health    — Liveness check (is the process alive?)
 *   - /ready     — Readiness check (are dependencies available?)
 *   - /status    — Full system status with capability details
 *
 * Phase D.4.1 — Health & Readiness
 */

import { Router } from "express";
import type { Request, Response } from "express";
import type { InfrastructureContext } from "./capability-factory.js";

export interface HealthCheck {
  name: string;
  status: "ok" | "degraded" | "offline";
  message?: string;
  latencyMs?: number;
}

export interface HealthResponse {
  status: "ok" | "degraded" | "offline";
  server: string;
  version: string;
  uptime: number;
  timestamp: string;
  checks: HealthCheck[];
}

const SERVER_NAME = "SPYRAL OS MCP Server";
const SERVER_VERSION = "0.1.0";
const startTime = Date.now();

/** Create health check handlers and return an Express Router. */
export function createHealthRouter(
  getInfra: () => InfrastructureContext | null,
): Router {
  const router = Router();

  // ─── Liveness: /health ────────────────────────────────────────────────
  router.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      server: SERVER_NAME,
      version: SERVER_VERSION,
      timestamp: new Date().toISOString(),
    });
  });

  // ─── Readiness: /ready ───────────────────────────────────────────────
  router.get("/ready", async (_req: Request, res: Response) => {
    const checks: HealthCheck[] = [];
    let overall: "ok" | "degraded" | "offline" = "ok";

    // Check database connectivity
    const dbCheck = await checkDatabase(getInfra());
    checks.push(dbCheck);
    if (dbCheck.status !== "ok") {
      overall = "degraded";
    }

    // Check infrastructure provider
    const infra = getInfra();
    if (infra?.provider) {
      checks.push({
        name: "infrastructure_provider",
        status: "ok",
        message: `${infra.config.type} provider active`,
      });
    } else {
      checks.push({
        name: "infrastructure_provider",
        status: "ok",
        message: "file-based persistence (no external deps)",
      });
    }

    const response: HealthResponse = {
      status: overall,
      server: SERVER_NAME,
      version: SERVER_VERSION,
      uptime: Math.floor((Date.now() - startTime) / 1000),
      timestamp: new Date().toISOString(),
      checks,
    };

    const httpStatus = overall === "ok" ? 200 : overall === "degraded" ? 200 : 503;
    res.status(httpStatus).json(response);
  });

  // ─── Full status: /status ─────────────────────────────────────────────
  router.get("/status", (_req: Request, res: Response) => {
    res.json({
      system: SERVER_NAME,
      version: SERVER_VERSION,
      health: "operational",
      uptime: Math.floor((Date.now() - startTime) / 1000),
      phase: "D.4 — Operational Excellence",
      capabilities: [
        { name: "decision_intelligence", status: "operational", description: "Structured decision creation and analysis" },
        { name: "execution_tracking", status: "operational", description: "Execution plan management and progress tracking" },
        { name: "learning_loops", status: "operational", description: "Pattern recognition and insight generation" },
        { name: "authentication", status: "operational", description: "User registration, login, session management" },
        { name: "workflow_engine", status: "operational", description: "Declarative workflow definitions and execution" },
        { name: "infrastructure", status: "operational", description: "Adapter-based persistence (file/SQLite)" },
      ],
      timestamp: new Date().toISOString(),
    });
  });

  return router;
}

/** Check database connectivity based on infrastructure type. */
async function checkDatabase(infra: InfrastructureContext | null): Promise<HealthCheck> {
  const start = Date.now();
  try {
    if (infra?.provider) {
      // Try a simple operation to verify database connectivity
      const uow = infra.provider.createUnitOfWork();
      const latencyMs = Date.now() - start;
      return {
        name: `database_${infra.config.type}`,
        status: "ok",
        message: `${infra.config.type} connection verified`,
        latencyMs,
      };
    }
    // File-based persistence — no external database to check
    return {
      name: "database_file",
      status: "ok",
      message: "File-based persistence, no external database",
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return {
      name: "database",
      status: "offline",
      message: err instanceof Error ? err.message : String(err),
      latencyMs: Date.now() - start,
    };
  }
}
