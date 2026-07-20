import { z } from "zod";

/**
 * Tool: spyral_get_status
 *
 * Returns the current operational status of SPYRAL OS.
 * This is the first tool to prove the ChatGPT → Apps SDK → SPYRAL pipeline.
 *
 * Phase: B.2
 * Status: Operational
 */

export const GetStatusInputSchema = z.object({
  detail: z
    .enum(["basic", "full"])
    .optional()
    .default("basic")
    .describe("Level of detail to return"),
});

export type GetStatusInput = z.infer<typeof GetStatusInputSchema>;

export interface SystemCapability {
  name: string;
  status: "operational" | "degraded" | "offline";
  description: string;
}

export interface SystemStatus {
  system: string;
  version: string;
  phase: string;
  health: "operational" | "degraded" | "offline";
  uptime: number;
  capabilities: SystemCapability[];
  timestamp: string;
}

let startTime = Date.now();

/** Reset uptime counter (useful for testing) */
export function resetUptime(): void {
  startTime = Date.now();
}

export function getSystemStatus(detail: "basic" | "full" = "basic"): SystemStatus {
  const uptime = Math.floor((Date.now() - startTime) / 1000);

  const capabilities: SystemCapability[] = [
    {
      name: "decision_intelligence",
      status: "operational",
      description: "Structured decision creation and analysis",
    },
    {
      name: "execution_tracking",
      status: "operational",
      description: "Execution plan management and progress tracking",
    },
    {
      name: "learning_loops",
      status: "operational",
      description: "Pattern recognition and insight generation",
    },
    {
      name: "reality_analysis",
      status: "operational",
      description: "Reality gap analysis and goal tracking",
    },
    {
      name: "validation",
      status: "operational",
      description: "Outcome validation and variance analysis",
    },
  ];

  return {
    system: "SPYRAL OS",
    version: "0.2.1-alpha",
    phase: "A.2 Complete — Phase 2 In Progress",
    health: "operational",
    uptime,
    capabilities: detail === "full" ? capabilities : capabilities.slice(0, 2),
    timestamp: new Date().toISOString(),
  };
}

/** Tool definition for MCP registration */
export const statusToolDefinition = {
  name: "spyral_get_status",
  description: "Get the current operational status of SPYRAL OS, including system health, version, phase, and capability status. Proves the ChatGPT → Apps SDK → SPYRAL pipeline.",
  inputSchema: {
    type: "object" as const,
    properties: {
      detail: {
        type: "string",
        enum: ["basic", "full"],
        description: "Level of detail to return. 'basic' (default) returns summary; 'full' returns all capabilities.",
      },
    },
  },
};

/** Execute the spyral_get_status tool */
export async function handleGetStatus(input: GetStatusInput): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  const status = getSystemStatus(input.detail);
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(status, null, 2),
      },
    ],
  };
}
