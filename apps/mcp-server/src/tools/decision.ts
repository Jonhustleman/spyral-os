import { z } from "zod";
import { randomUUID } from "node:crypto";
import { CreateDecisionService } from "@spyral/capabilities";
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
 * Tool: spyral_create_decision
 *
 * Creates a structured decision from a human intent statement.
 * Delegates to CreateDecisionService for full orchestration:
 *   validate → create decision → record learning → respond
 *
 * Phase: C.0
 * Architecture: MCP Tool → Application Service → Capabilities → Repositories
 */

const createDecisionService = new CreateDecisionService();

export const CreateDecisionInputSchema = z.object({
  workspaceId: z
    .string()
    .min(1)
    .describe("The workspace ID this decision belongs to"),
  title: z
    .string()
    .min(3)
    .max(200)
    .describe("A human-readable title for this decision"),
  intent: z
    .string()
    .min(10)
    .max(2000)
    .describe("The human intent or decision to be made (e.g., 'Should we launch this product next quarter?')"),
  context: z
    .string()
    .max(5000)
    .optional()
    .describe("Additional context, constraints, or background information"),
  tags: z
    .array(z.string())
    .max(10)
    .optional()
    .describe("Optional tags for categorization"),
});

export type CreateDecisionInput = z.infer<typeof CreateDecisionInputSchema>;

/** Tool definition for MCP registration */
export const createDecisionToolDefinition = {
  name: "spyral_create_decision",
  description: "Transform a human intent into a structured decision with context, strategic options, risks, confidence scores, and a recommended path. SPYRAL's core differentiator — intent → structured decision → execution → learning loop. Persists the decision for future reference.",
  inputSchema: {
    type: "object" as const,
    properties: {
      workspaceId: {
        type: "string",
        description: "The workspace ID this decision belongs to",
      },
      title: {
        type: "string",
        description: "A human-readable title for this decision",
      },
      intent: {
        type: "string",
        description: "The human intent or decision to be made (e.g., 'Should we launch this product next quarter?')",
      },
      context: {
        type: "string",
        description: "Additional context, constraints, or background information",
      },
      tags: {
        type: "array",
        items: { type: "string" },
        description: "Optional tags for categorization",
      },
    },
    required: ["workspaceId", "title", "intent"],
  },
};

/** Execute the spyral_create_decision tool via CreateDecisionService */
export async function handleCreateDecision(input: CreateDecisionInput): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  const result = await createDecisionService.execute(createBasicTenantContext(), {
    workspaceId: input.workspaceId,
    title: input.title,
    intent: input.intent,
    context: input.context,
    tags: input.tags,
  });

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
}
