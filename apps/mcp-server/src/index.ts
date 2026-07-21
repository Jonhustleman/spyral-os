/**
 * SPYRAL OS — MCP Server
 *
 * The MCP server is SPYRAL's nervous system into ChatGPT.
 * It exposes tools, resources, and UI experiences through the
 * Model Context Protocol (MCP) via HTTP/SSE transport.
 *
 * Architecture:
 *   ChatGPT → Apps SDK → MCP Server (thin tools) → Capabilities (logic) → Repositories (persistence)
 *
 * Phase 2 Milestones:
 *   B.2 — spyral_get_status (✅)
 *   B.3 — Domain Capabilities (✅)
 *   B.4 — UI Widgets (✅)
 *   C.0-C.3 — Application Services, Validation, Events, Persistence (✅)
 *   D.1 — Auth, RBAC, Workflow Engine (✅)
 *
 * @see https://modelcontextprotocol.io
 * @see https://developers.openai.com/apps-sdk
 */

import express from "express";
import cors from "cors";
import { randomUUID } from "node:crypto";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import type { TenantContext } from "@spyral/kernel";
import type { Request, Response } from "express";

import { statusToolDefinition, handleGetStatus, GetStatusInputSchema } from "./tools/status.js";
import { beginRealityCycleToolDefinition, handleBeginRealityCycle, BeginRealityCycleInputSchema } from "./tools/reality-cycle.js";
import { submitRealityFeedbackToolDefinition, handleSubmitRealityFeedback, SubmitFeedbackInputSchema } from "./tools/reality-cycle-feedback.js";
import { createPredictionToolDefinition, handleCreatePrediction, CreatePredictionInputSchema, resolvePredictionToolDefinition, handleResolvePrediction, ResolvePredictionInputSchema } from "./tools/prediction.js";
import { getTestScenarioToolDefinition, handleGetTestScenario, GetTestScenarioInputSchema } from "./tools/test-scenarios.js";
import { createDecisionToolDefinition, handleCreateDecision, CreateDecisionInputSchema } from "./tools/decision.js";
import { createWorkspaceToolDefinition, handleCreateWorkspace, CreateWorkspaceInputSchema, getWorkspaceToolDefinition, handleGetWorkspace, GetWorkspaceInputSchema } from "./tools/workspace.js";
import { getDecisionToolDefinition, handleGetDecision, GetDecisionInputSchema, listDecisionsToolDefinition, handleListDecisions, ListDecisionsInputSchema } from "./tools/query.js";
import { uiResources, getWidgetHtml } from "./resources/ui.js";
import { getCapabilities, getServices, getInfrastructure, initializeInfrastructure } from "./services/capability-factory.js";
import {
  registerToolDefinition,
  loginToolDefinition,
  getProfileToolDefinition,
  logoutToolDefinition,
  RegisterInputSchema,
  LoginInputSchema,
  GetProfileInputSchema,
  LogoutInputSchema,
  createAuthHandlers,
} from "./tools/auth.js";

// ─── Phase D.4 — Operational Excellence Imports ────────────────────────────

import { metricsMiddleware } from "./services/metrics.js";
import { correlationMiddleware } from "./services/correlation.js";
import { RateLimiter } from "./services/rate-limiter.js";
import { validateConfig } from "@spyral/infrastructure";
import type { DatabaseConfig } from "@spyral/kernel";

// ─── Configuration ───────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || "3001", 10);
const SERVER_NAME = "SPYRAL OS MCP Server";
const SERVER_VERSION = "0.1.0";
const startTime = Date.now();

// ─── MCP Server Setup ────────────────────────────────────────────────────────

const server = new Server(
  {
    name: SERVER_NAME,
    version: SERVER_VERSION,
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  },
);

// ─── Auth Handlers (initialized after services) ──────────────────────────────

const { auth: authService } = getServices();
const authHandlers = createAuthHandlers(authService);

// ─── Infrastructure Initialization (Phase D.3) ──────────────────────────────
// Supports SQLite via InfrastructureFactory when DB_TYPE=sqlite is set.
// Defaults to file-based persistence for backward compatibility.

const dbType = process.env.DB_TYPE ?? "file";
let infra = null;

if (dbType === "sqlite") {
  console.log("[MCP Server] Initializing SQLite infrastructure...");
  infra = await initializeInfrastructure({
    type: "sqlite",
    filePath: process.env.DB_PATH ?? "./data",
    sqlitePath: process.env.SQLITE_PATH ?? "./data/spyral.db",
  });
}

// Initialize capabilities with the infrastructure layer (or default to file repos)
const caps = getCapabilities(infra);

// ─── Tool Handlers ───────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    statusToolDefinition,
    beginRealityCycleToolDefinition,
    submitRealityFeedbackToolDefinition,
    createPredictionToolDefinition,
    resolvePredictionToolDefinition,
    getTestScenarioToolDefinition,
    createDecisionToolDefinition,
    getDecisionToolDefinition,
    listDecisionsToolDefinition,
    createWorkspaceToolDefinition,
    getWorkspaceToolDefinition,
    registerToolDefinition,
    loginToolDefinition,
    getProfileToolDefinition,
    logoutToolDefinition,
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  switch (name) {
    case "spyral_get_status": {
      const input = GetStatusInputSchema.parse(args);
      return handleGetStatus(input);
    }

    case "spyral_begin_reality_cycle": {
      const input = BeginRealityCycleInputSchema.parse(args);
      return handleBeginRealityCycle(input);
    }

    case "spyral_submit_reality_feedback": {
      const input = SubmitFeedbackInputSchema.parse(args);
      return handleSubmitRealityFeedback(input);
    }

    case "spyral_create_prediction": {
      const input = CreatePredictionInputSchema.parse(args);
      return handleCreatePrediction(input);
    }

    case "spyral_resolve_prediction": {
      const input = ResolvePredictionInputSchema.parse(args);
      return handleResolvePrediction(input);
    }

    case "spyral_get_test_scenario": {
      const input = GetTestScenarioInputSchema.parse(args);
      return handleGetTestScenario(input);
    }

    case "spyral_create_decision": {
      const input = CreateDecisionInputSchema.parse(args);
      return handleCreateDecision(input);
    }

    case "spyral_get_decision": {
      const input = GetDecisionInputSchema.parse(args);
      return handleGetDecision(input);
    }

    case "spyral_list_decisions": {
      const input = ListDecisionsInputSchema.parse(args);
      return handleListDecisions(input);
    }

    case "spyral_create_workspace": {
      const input = CreateWorkspaceInputSchema.parse(args);
      return handleCreateWorkspace(input);
    }

    case "spyral_get_workspace": {
      const input = GetWorkspaceInputSchema.parse(args);
      return handleGetWorkspace(input);
    }

    // ─── Phase D.1: Auth Tools ────────────────────────────────────────────

    case "spyral_register": {
      const input = RegisterInputSchema.parse(args);
      return authHandlers.handleRegister(input);
    }

    case "spyral_login": {
      const input = LoginInputSchema.parse(args);
      return authHandlers.handleLogin(input);
    }

    case "spyral_get_profile": {
      const input = GetProfileInputSchema.parse(args);
      return authHandlers.handleGetProfile(input);
    }

    case "spyral_logout": {
      const input = LogoutInputSchema.parse(args);
      return authHandlers.handleLogout(input);
    }

    default:
      throw new Error(`Unknown tool: ${name}`);
  }
});

// ─── Resource Handlers (for UI widgets) ─────────────────────────────────────

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: uiResources,
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  const caps = getCapabilities();
  const tenantCtx: TenantContext = {
    userId: "system",
    organizationId: "default",
    role: "admin",
    permissions: [],
    requestId: randomUUID(),
    sessionId: "mcp-session",
    issuedAt: new Date().toISOString(),
  };
  const html = await getWidgetHtml(uri, caps, tenantCtx);

  if (!html) {
    throw new Error(`Unknown resource: ${uri}`);
  }

  return {
    contents: [
      {
        uri,
        mimeType: "text/html",
        text: html,
      },
    ],
  };
});

// ─── HTTP Server (Express + SSE Transport) ───────────────────────────────────

const app = express();

app.use(cors());
app.use(express.json());

// Phase D.4.3 — Request Correlation (must be first middleware)
app.use(correlationMiddleware);

// Phase D.4.2 — Structured Metrics
app.use(metricsMiddleware);

// Phase D.4.6 — Rate Limiting
const rateLimiter = new RateLimiter();
app.use(rateLimiter.middleware());

// Phase D.4.1 — Health & Readiness Endpoints (inline routes)
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    server: "SPYRAL OS MCP Server",
    version: "0.1.0",
    timestamp: new Date().toISOString(),
  });
});
app.get("/ready", async (_req: Request, res: Response) => {
  res.json({
    status: "ok",
    server: "SPYRAL OS MCP Server",
    version: "0.1.0",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    timestamp: new Date().toISOString(),
    checks: [{ name: "server", status: "ok", message: "Process is alive" }],
  });
});
app.get("/status", (_req: Request, res: Response) => {
  res.json({
    system: "SPYRAL OS MCP Server",
    version: "0.1.0",
    health: "operational",
    uptime: Math.floor((Date.now() - startTime) / 1000),
    phase: "D.4 — Operational Excellence",
    capabilities: [
      { name: "decision_intelligence", status: "operational", description: "Structured decision creation and analysis" },
      { name: "execution_tracking", status: "operational", description: "Execution plan management" },
      { name: "learning_loops", status: "operational", description: "Pattern recognition and insight generation" },
      { name: "authentication", status: "operational", description: "User registration and session management" },
      { name: "infrastructure", status: "operational", description: "Adapter-based persistence (file/SQLite)" },
    ],
    timestamp: new Date().toISOString(),
  });
});

// Phase D.4.2 — Metrics Endpoint
app.get("/metrics", (_req: Request, res: Response) => {
  res.json({
    totalRequests: 0,
    activeRequests: 0,
    uptimeSeconds: Math.floor((Date.now() - startTime) / 1000),
    memoryMB: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024),
      heapUsed: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      heapTotal: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024),
    },
    timestamp: new Date().toISOString(),
  });
});

// Phase D.4.4 — Configuration Validation on startup
const dbConfig: DatabaseConfig = dbType === "sqlite"
  ? { type: "sqlite", filePath: process.env.DB_PATH ?? "./data", sqlitePath: process.env.SQLITE_PATH ?? "./data/spyral.db" }
  : { type: "file", filePath: process.env.DB_PATH ?? "./data" };

const validationReport = validateConfig({
  secrets: {
    jwtSecret: process.env.JWT_SECRET ?? "spyral-dev-secret-do-not-use-in-production",
    sessionExpiryMs: parseInt(process.env.SESSION_EXPIRY_MS ?? String(24 * 60 * 60 * 1000), 10),
  },
  logging: {
    level: (process.env.SPYRAL_LOG_LEVEL as any) ?? "info",
    format: "text",
    output: "console",
  },
  server: {
    port: PORT,
    host: process.env.HOST ?? "0.0.0.0",
    corsOrigins: ["*"],
  },
  database: dbConfig,
});

if (!validationReport.valid) {
  for (const result of validationReport.results) {
    for (const err of result.errors) {
      console.warn(`[Config] ${result.section}: ${err.field} — ${err.message}`);
    }
  }
}
for (const result of validationReport.results) {
  for (const warn of result.warnings) {
    console.warn(`[Config] ${result.section}: ${warn.field} — ${warn.message}`);
  }
}

// ─── MCP Transport (Streamable HTTP) ─────────────────────────────────────────
// Uses the modern StreamableHTTPServerTransport which handles both SSE (GET)
// and message POST endpoints through a single handleRequest() method.

const mcpTransport = new StreamableHTTPServerTransport({
  sessionIdGenerator: () => randomUUID(),
});

// Connect MCP server to the transport before handling requests
await server.connect(mcpTransport);

// MCP SSE endpoint — ChatGPT connects here (GET stream)
app.get("/sse", async (req, res) => {
  await mcpTransport.handleRequest(req, res);
});

// MCP message endpoint — receives tool calls from ChatGPT (POST)
app.post("/messages", async (req, res) => {
  await mcpTransport.handleRequest(req, res, req.body);
});

// ─── Start ───────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════════════════╗
  ║  ✦ SPYRAL OS — MCP Server                                ║
  ║  ✦ Version: ${SERVER_VERSION.padEnd(47)}║
  ║  ✦ Port:   ${String(PORT).padEnd(47)}║
  ║  ✦ Health: http://localhost:${PORT}/health                ║
  ║  ✦ Ready:  http://localhost:${PORT}/ready                 ║
  ║  ✦ Status: http://localhost:${PORT}/status                ║
  ║  ✦ Metrics:http://localhost:${PORT}/metrics               ║
  ║  ✦ SSE:    http://localhost:${PORT}/sse                    ║
  ║  ✦ Tools:                                               ║
  ║  ✦   spyral_get_status                                   ║
  ║  ✦   spyral_create_decision                               ║
  ║  ✦   spyral_get_decision                                  ║
  ║  ✦   spyral_list_decisions                                ║
  ║  ✦   spyral_create_workspace                              ║
  ║  ✦   spyral_get_workspace                                 ║
  ║  ✦   spyral_register                                       ║
  ║  ✦   spyral_login                                          ║
  ║  ✦   spyral_get_profile                                    ║
  ║  ✦   spyral_logout                                         ║
  ╚═══════════════════════════════════════════════════════════╝
  `);
});

export type { ResourceDefinition } from "./types.js";
