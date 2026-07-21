/**
 * Tool: spyral_submit_reality_feedback
 *
 * Phase E.1.1 — Reality Validation & Learning Loop
 *
 * After SPYRAL produces a plan, the user rates it and provides
 * feedback about what was accurate, inaccurate, or missing.
 * This becomes the first real-world training signal.
 *
 * Architecture:
 *   ChatGPT → spyral_submit_reality_feedback (thin MCP tool) → RealityCycleFeedbackService
 */

import { z } from "zod";
import { randomUUID } from "node:crypto";
import { RealityCycleFeedbackService } from "@spyral/capabilities";
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

const feedbackService = new RealityCycleFeedbackService();

export const SubmitFeedbackInputSchema = z.object({
  cycleId: z
    .string()
    .describe("The cycle ID from SPYRAL's response (from the workspace or decision ID)"),
  userRating: z
    .enum(["yes", "partial", "no"])
    .describe("Your overall rating: 'yes' if the plan is accurate and actionable, 'partial' if it's somewhat useful but misses things, 'no' if it's off track"),
  expectedReality: z
    .string()
    .optional()
    .describe("What you expected SPYRAL to understand or produce"),
  observedReality: z
    .string()
    .optional()
    .describe("What SPYRAL actually produced — your honest assessment"),
  gaps: z
    .array(z.string())
    .optional()
    .describe("What was missing from SPYRAL's analysis (e.g., 'didn't consider budget constraints', 'missed competitor X')"),
  corrections: z
    .array(z.string())
    .optional()
    .describe("Specific corrections SPYRAL should apply next time"),
});

export type SubmitFeedbackInput = z.infer<typeof SubmitFeedbackInputSchema>;

export const submitRealityFeedbackToolDefinition = {
  name: "spyral_submit_reality_feedback",
  description: `Rate SPYRAL's plan and provide feedback. This is how SPYRAL learns what worked and what didn't.

After receiving a SPYRAL plan, tell us:
- 👍 Yes / ⚠️ Partially / 👎 No — was the plan useful?
- What was accurate? What was missing?
- What should SPYRAL do differently next time?

This feedback becomes a real-world training signal that improves future cycles.`,
  inputSchema: {
    type: "object" as const,
    properties: {
      cycleId: {
        type: "string",
        description: "The cycle ID from SPYRAL's response (from the workspace or decision ID)",
      },
      userRating: {
        type: "string",
        enum: ["yes", "partial", "no"] as const,
        description: "Your overall rating: 'yes' if the plan is accurate and actionable, 'partial' if it's somewhat useful but misses things, 'no' if it's off track",
      },
      expectedReality: {
        type: "string",
        description: "What you expected SPYRAL to understand or produce",
      },
      observedReality: {
        type: "string",
        description: "What SPYRAL actually produced — your honest assessment",
      },
      gaps: {
        type: "array",
        items: { type: "string" },
        description: "What was missing from SPYRAL's analysis",
      },
      corrections: {
        type: "array",
        items: { type: "string" },
        description: "Specific corrections SPYRAL should apply next time",
      },
    },
    required: ["cycleId", "userRating"],
  },
};

export async function handleSubmitRealityFeedback(input: SubmitFeedbackInput): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  const tenantCtx = createBasicTenantContext();

  const result = await feedbackService.submitFeedback(tenantCtx, {
    cycleId: input.cycleId,
    userRating: input.userRating,
    expectedReality: input.expectedReality,
    observedReality: input.observedReality,
    gaps: input.gaps,
    corrections: input.corrections,
  });

  // Format a readable gap analysis report
  const gapSection = result.gapAnalysis
    ? [
        `\n📊 REALITY GAP ANALYSIS`,
        `   Expected: ${result.gapAnalysis.expectedOutcome.substring(0, 120)}`,
        `   Observed: ${result.gapAnalysis.observedOutcome.substring(0, 120)}`,
        `   Difference: ${result.gapAnalysis.difference}`,
        `   Magnitude: ${Math.round(result.gapAnalysis.differenceMagnitude * 100)}%`,
        `   Possible causes:`,
        ...result.gapAnalysis.possibleCauses.map(c => `   • ${c}`),
        `   Recommended: ${result.gapAnalysis.recommendedAction}`,
      ].join("\n")
    : "";

  const qualitySection = result.quality
    ? [
        `\n⭐ CYCLE QUALITY`,
        `   Understanding: ${"★".repeat(Math.round(result.quality.understanding))}${"☆".repeat(5 - Math.round(result.quality.understanding))}`,
        `   Strategy:      ${"★".repeat(Math.round(result.quality.strategy))}${"☆".repeat(5 - Math.round(result.quality.strategy))}`,
        `   Actionability: ${"★".repeat(Math.round(result.quality.actionability))}${"☆".repeat(5 - Math.round(result.quality.actionability))}`,
        `   Confidence:    ${"★".repeat(Math.round(result.quality.confidence))}${"☆".repeat(5 - Math.round(result.quality.confidence))}`,
        `   User Trust:    ${"★".repeat(Math.round(result.quality.userTrust))}${"☆".repeat(5 - Math.round(result.quality.userTrust))}`,
      ].join("\n")
    : "";

  const fullReport = [
    `✅ Feedback Recorded`,
    `   Rating: ${result.feedback.userRating}`,
    gapSection,
    qualitySection,
    ``,
    result.message,
    ``,
    `--- Full data below ---`,
    JSON.stringify(result, null, 2),
  ].join("\n");

  return {
    content: [
      {
        type: "text" as const,
        text: fullReport,
      },
    ],
  };
}
