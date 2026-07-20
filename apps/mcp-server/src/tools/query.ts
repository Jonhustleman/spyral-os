import { z } from "zod";
import { randomUUID } from "node:crypto";
import { getCapabilities } from "../services/capability-factory.js";
import type { TenantContext } from "@spyral/kernel";

function createBasicTenantContext(): TenantContext {
  return {
    userId: "system",
    organizationId: "default",
    role: "admin",
    permissions: [],
    requestId: randomUUID(),
    sessionId: "mcp-session",
    issuedAt: new Date().toISOString(),
  };
}

/**
 * Tool: spyral_get_decision
 *
 * Retrieve a decision by ID from persistent storage.
 */

export const GetDecisionInputSchema = z.object({
  decisionId: z.string().min(1).describe("The decision ID to retrieve"),
});

export const getDecisionToolDefinition = {
  name: "spyral_get_decision",
  description: "Retrieve a previously created decision by ID. Returns the full decision with options, confidence scores, and status.",
  inputSchema: {
    type: "object" as const,
    properties: {
      decisionId: { type: "string", description: "The decision ID to retrieve" },
    },
    required: ["decisionId"],
  },
};

export async function handleGetDecision(input: { decisionId: string }): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  const caps = getCapabilities();
  const tenantCtx = createBasicTenantContext();
  const decision = await caps.decision.getDecision(tenantCtx, input.decisionId);

  if (!decision) {
    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ error: `Decision not found: ${input.decisionId}` }, null, 2),
        },
      ],
    };
  }

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(decision, null, 2),
      },
    ],
  };
}

/**
 * Tool: spyral_list_decisions
 *
 * List decisions for a workspace, optionally filtered by status.
 */

export const ListDecisionsInputSchema = z.object({
  workspaceId: z.string().min(1).describe("The workspace ID"),
  status: z
    .enum(["draft", "analyzed", "executing", "completed", "abandoned"])
    .optional()
    .describe("Optional filter by status"),
});

export const listDecisionsToolDefinition = {
  name: "spyral_list_decisions",
  description: "List all decisions for a workspace, with optional status filter. Returns summaries with title, status, option count, and confidence.",
  inputSchema: {
    type: "object" as const,
    properties: {
      workspaceId: { type: "string", description: "The workspace ID" },
      status: {
        type: "string",
        enum: ["draft", "analyzed", "executing", "completed", "abandoned"],
        description: "Optional filter by status",
      },
    },
    required: ["workspaceId"],
  },
};

export async function handleListDecisions(input: {
  workspaceId: string;
  status?: string;
}): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  const caps = getCapabilities();
  const tenantCtx = createBasicTenantContext();

  const summaries = input.status
    ? await caps.decision.listByStatus(tenantCtx, input.status as any)
    : await caps.decision.listByWorkspace(tenantCtx, input.workspaceId);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ decisions: summaries }, null, 2),
      },
    ],
  };
}
