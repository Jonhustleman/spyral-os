/**
 * ValidateDecisionService — Centralized validation orchestration.
 *
 * Phase C.1 — Full Validation Engine integration.
 * Uses the ValidationEngine pipeline:
 *   Schema Validation → Business Rules → Evidence Check → Risk Assessment → Confidence Score → Recommendations
 */

import type {
  TenantContext,
  ValidateDecisionRequest,
  ValidateDecisionResponse,
  Decision,
} from "@spyral/kernel";
import { getApplicationContext } from "./application-context.js";
import { ValidationEngine } from "./validation-engine.js";

export class ValidateDecisionService {
  private engine: ValidationEngine;

  constructor(config?: Partial<import("@spyral/kernel").ValidationEngineConfig>) {
    this.engine = new ValidationEngine(config);
  }

  async execute(tenantCtx: TenantContext, request: ValidateDecisionRequest): Promise<ValidateDecisionResponse> {
    const ctx = getApplicationContext();

    // 1. Check decision exists
    const decision = await ctx.decision.getDecision(tenantCtx, request.decisionId);
    if (!decision) {
      return {
        valid: false,
        overallScore: 0,
        confidence: 0,
        risk: {
          level: "critical",
          score: 1,
          factors: ["Decision not found"],
          mitigations: ["Create the decision first"],
        },
        checks: [],
        recommendations: [{
          priority: "high",
          category: "Required Fix",
          suggestion: `Decision not found: ${request.decisionId}`,
          impact: "Cannot validate a non-existent decision",
        }],
        summary: `Validation FAILED: Decision ${request.decisionId} not found`,
        decisionId: request.decisionId,
        timestamp: new Date().toISOString(),
        duration: 0,
      };
    }

    // 2. Run the full validation pipeline
    const result = await this.engine.validate(decision as Decision);

    return result as ValidateDecisionResponse;
  }
}

