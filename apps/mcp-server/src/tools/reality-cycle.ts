/**
 * Tool: spyral_begin_reality_cycle
 *
 * Phase E.0 — SPYRAL ChatGPT App Pilot Experience
 *
 * The primary user-facing entry point for SPYRAL OS.
 * Transforms a human intention into a structured reality assessment,
 * strategy, execution plan, and learning loop.
 *
 * Input:
 *   goal: The user's stated intention or goal
 *   workspaceId: Optional workspace ID to resume an existing cycle
 *
 * Output:
 *   A structured RealityCycleResponse with strategy, plan, tasks, and confidence.
 *
 * Architecture:
 *   ChatGPT → spyral_begin_reality_cycle (thin MCP tool) → RealityCycleService → Capabilities
 */

import { z } from "zod";
import { randomUUID } from "node:crypto";
import { RealityCycleService } from "@spyral/capabilities";
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

const realityCycleService = new RealityCycleService();

export const BeginRealityCycleInputSchema = z.object({
  goal: z
    .string()
    .min(3)
    .max(2000)
    .describe("Your intention, goal, or desired reality. Describe what you want to create, improve, understand, or validate."),
  workspaceId: z
    .string()
    .optional()
    .describe("Optional workspace ID to continue an existing reality cycle"),
});

export type BeginRealityCycleInput = z.infer<typeof BeginRealityCycleInputSchema>;

export const beginRealityCycleToolDefinition = {
  name: "spyral_begin_reality_cycle",
  description: `SPYRAL's primary entry point. Describe a goal, desired reality, or intention, and SPYRAL will:

1. OBSERVE — Understand your desired reality and current situation
2. ORGANIZE — Structure the problem and identify assumptions
3. PREDICT — Generate possible strategies and trajectories
4. VALIDATE — Test assumptions and evaluate confidence
5. ADAPT — Create an execution path and learning loop

Returns a complete strategy with milestones, immediate tasks, confidence assessment, and a learning loop for continuous improvement.

Examples:
- "Grow my business revenue by 30% this year"
- "Create a month's Instagram strategy for my clinic"
- "Research the market for a new product launch"
- "Build a career development plan"
- "Make a difficult business decision"`,
  inputSchema: {
    type: "object" as const,
    properties: {
      goal: {
        type: "string",
        description: "Your intention, goal, or desired reality. Describe what you want to create, improve, understand, or validate.",
      },
      workspaceId: {
        type: "string",
        description: "Optional workspace ID to continue an existing reality cycle",
      },
    },
    required: ["goal"],
  },
};

export async function handleBeginRealityCycle(input: BeginRealityCycleInput): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  const tenantCtx = createBasicTenantContext();

  const result = await realityCycleService.execute(tenantCtx, {
    goal: input.goal,
    workspaceId: input.workspaceId,
  });

  // Return both the SPYRAL Report (for immediate readability) and the full JSON data
  const report = result.cycle.spyralReport;
  const fullData = JSON.stringify(result, null, 2);

  return {
    content: [
      {
        type: "text" as const,
        text: `${report}\n\n---\n*Full structured data available below for reference:*\n\n${fullData}`,
      },
    ],
  };
}
