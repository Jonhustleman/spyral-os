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
 * Tool: spyral_create_workspace
 *
 * Creates a new workspace — the aggregate root in SPYRAL OS.
 * Every decision, execution, and learning belongs to a workspace.
 */

export const CreateWorkspaceInputSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(100)
    .describe("Human-readable name for the workspace"),
  description: z
    .string()
    .min(1)
    .max(500)
    .describe("Short summary of what this workspace is for"),
  goal: z
    .string()
    .min(1)
    .max(500)
    .describe("The primary objective this workspace is organized around"),
  type: z
    .string()
    .optional()
    .default("business")
    .describe("Workspace type identifier (e.g., 'business', 'personal')"),
  tags: z
    .array(z.string())
    .max(10)
    .optional()
    .describe("Optional tags for categorization"),
});

export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceInputSchema>;

export const createWorkspaceToolDefinition = {
  name: "spyral_create_workspace",
  description: "Create a new SPYRAL workspace. Workspaces are the aggregate root — every decision, execution, and learning belongs to exactly one workspace.",
  inputSchema: {
    type: "object" as const,
    properties: {
      name: { type: "string", description: "Human-readable name for the workspace" },
      description: { type: "string", description: "Short summary of what this workspace is for" },
      goal: { type: "string", description: "The primary objective this workspace is organized around" },
      type: { type: "string", description: "Workspace type identifier (e.g., 'business', 'personal')" },
      tags: { type: "array", items: { type: "string" }, description: "Optional tags for categorization" },
    },
    required: ["name", "description", "goal"],
  },
};

export async function handleCreateWorkspace(input: CreateWorkspaceInput): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  const caps = getCapabilities();
  const tenantCtx = createBasicTenantContext();
  const workspace = await caps.workspace.createWorkspace(tenantCtx, {
    name: input.name,
    description: input.description,
    goal: input.goal,
    type: input.type,
    tags: input.tags,
  });

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(workspace, null, 2),
      },
    ],
  };
}

/**
 * Tool: spyral_get_workspace
 */

export const GetWorkspaceInputSchema = z.object({
  id: z.string().min(1).describe("The workspace ID to retrieve"),
});

export const getWorkspaceToolDefinition = {
  name: "spyral_get_workspace",
  description: "Retrieve workspace details by ID, including summary statistics.",
  inputSchema: {
    type: "object" as const,
    properties: {
      id: { type: "string", description: "The workspace ID to retrieve" },
    },
    required: ["id"],
  },
};

export async function handleGetWorkspace(input: { id: string }): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  const caps = getCapabilities();
  const tenantCtx = createBasicTenantContext();
  const workspace = await caps.workspace.getWorkspace(tenantCtx, input.id);
  const summary = workspace ? await caps.workspace.getSummary(tenantCtx, input.id) : undefined;

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify({ workspace, summary }, null, 2),
      },
    ],
  };
}
