/**
 * Tool: spyral_create_prediction & spyral_resolve_prediction
 *
 * Phase E.1.2 — Prediction Tracking
 *
 * Every reality cycle creates predictions — concrete, testable
 * forecasts about what will happen. Later, these predictions
 * are compared with observed reality to measure SPYRAL's accuracy.
 *
 * Architecture:
 *   ChatGPT → spyral_create_prediction (thin MCP tool) → PredictionService
 */

import { z } from "zod";
import { randomUUID } from "node:crypto";
import type { TenantContext, Prediction, CreatePredictionRequest, ResolvePredictionRequest } from "@spyral/kernel";

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

// ─── In-memory store for predictions (will be replaced with repository later) ─

const predictions = new Map<string, Prediction>();

// ─── Create Prediction ─────────────────────────────────────────────────────

export const CreatePredictionInputSchema = z.object({
  cycleId: z.string().describe("The cycle ID this prediction belongs to"),
  statement: z.string().describe("What you predict will happen (e.g., 'Posting 4 educational videos/week will increase qualified inquiries')"),
  expectedOutcome: z.string().describe("The specific outcome you expect"),
  timeframe: z.string().describe("When this prediction should be evaluated (e.g., '30 days', 'next quarter')"),
  confidence: z.number().min(0).max(1).describe("How confident are you? 0.0 to 1.0 (e.g., 0.82 = 82%)"),
});

export type CreatePredictionInput = z.infer<typeof CreatePredictionInputSchema>;

export const createPredictionToolDefinition = {
  name: "spyral_create_prediction",
  description: `Create a testable prediction from SPYRAL's analysis.

Every SPYRAL strategy implies predictions about reality. Make them explicit so we can measure accuracy later.

Example:
- "Posting 4 educational videos per week will increase qualified inquiries by 30%"
- Expected: 30% increase in 30 days
- Confidence: 82%

When the timeframe expires, use spyral_resolve_prediction to compare with reality.`,
  inputSchema: {
    type: "object" as const,
    properties: {
      cycleId: {
        type: "string",
        description: "The cycle ID this prediction belongs to",
      },
      statement: {
        type: "string",
        description: "What you predict will happen",
      },
      expectedOutcome: {
        type: "string",
        description: "The specific outcome you expect",
      },
      timeframe: {
        type: "string",
        description: "When this prediction should be evaluated",
      },
      confidence: {
        type: "number",
        description: "How confident are you? 0.0 to 1.0",
        minimum: 0,
        maximum: 1,
      },
    },
    required: ["cycleId", "statement", "expectedOutcome", "timeframe", "confidence"],
  },
};

export async function handleCreatePrediction(input: CreatePredictionInput): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  const prediction: Prediction = {
    id: `pred_${Date.now()}_${randomUUID().substring(0, 6)}`,
    cycleId: input.cycleId,
    statement: input.statement,
    expectedOutcome: input.expectedOutcome,
    timeframe: input.timeframe,
    confidence: input.confidence,
    status: "active",
  };

  predictions.set(prediction.id, prediction);

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: true,
            prediction,
            message: `Prediction recorded: "${prediction.statement}". Confidence: ${Math.round(prediction.confidence * 100)}%. Will check in ${prediction.timeframe}.`,
          },
          null,
          2,
        ),
      },
    ],
  };
}

// ─── Resolve Prediction ────────────────────────────────────────────────────

export const ResolvePredictionInputSchema = z.object({
  predictionId: z.string().describe("The ID of the prediction to resolve"),
  observedOutcome: z.string().describe("What actually happened"),
  variance: z.number().min(-1).max(1).describe("How close was the prediction? -1 (way off) to +1 (exact match)"),
  status: z.enum(["confirmed", "refuted", "inconclusive"]).describe("Was the prediction confirmed, refuted, or inconclusive?"),
});

export type ResolvePredictionInput = z.infer<typeof ResolvePredictionInputSchema>;

export const resolvePredictionToolDefinition = {
  name: "spyral_resolve_prediction",
  description: `Compare a prediction with what actually happened.

After the prediction timeframe has elapsed, use this tool to record whether SPYRAL's prediction was accurate.

This is how SPYRAL learns what works and what doesn't in your real world.`,
  inputSchema: {
    type: "object" as const,
    properties: {
      predictionId: {
        type: "string",
        description: "The ID of the prediction to resolve",
      },
      observedOutcome: {
        type: "string",
        description: "What actually happened",
      },
      variance: {
        type: "number",
        description: "How close was the prediction? -1 (way off) to +1 (exact match)",
        minimum: -1,
        maximum: 1,
      },
      status: {
        type: "string",
        enum: ["confirmed", "refuted", "inconclusive"] as const,
        description: "Was the prediction confirmed, refuted, or inconclusive?",
      },
    },
    required: ["predictionId", "observedOutcome", "variance", "status"],
  },
};

export async function handleResolvePrediction(input: ResolvePredictionInput): Promise<{
  content: Array<{ type: "text"; text: string }>;
}> {
  const prediction = predictions.get(input.predictionId);
  if (!prediction) {
    throw new Error(`Prediction not found: ${input.predictionId}`);
  }

  prediction.status = input.status;
  prediction.observedOutcome = input.observedOutcome;
  prediction.variance = input.variance;
  prediction.completedAt = new Date().toISOString();

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(
          {
            success: true,
            prediction,
            message: `Prediction ${input.status}! Variance: ${input.variance}. ${
              input.status === "confirmed"
                ? "SPYRAL's prediction was accurate."
                : input.status === "refuted"
                  ? "SPYRAL's prediction was incorrect. This is valuable learning data."
                  : "Not enough data to confirm or refute."
            }`,
          },
          null,
          2,
        ),
      },
    ],
  };
}
