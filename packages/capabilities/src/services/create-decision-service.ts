/**
 * CreateDecisionService — Orchestrates the decision creation workflow.
 *
 * This Application Service is the single entry point for creating decisions.
 * It coordinates:
 *   1. Validate workspace exists
 *   2. Create the decision via DecisionCapability
 *   3. Run validation through ValidationEngine
 *   4. Record a learning event
 *   5. Emit DomainEvent
 *   6. Return a rich response with decision + summary
 *
 * Phase C.0 — Application Service Layer
 * Phase C.1 — Validation Engine integration
 * Phase C.1.5 — Observability tracking
 * Phase C.2 — Domain Events emission
 *
 * Architecture:
 *   MCP Tool → CreateDecisionService → ValidationEngine → DecisionCapability + LearningCapability → EventBus
 */

import type {
  TenantContext,
  CreateDecisionRequest,
  CreateDecisionResponse,
} from "@spyral/kernel";
import { getApplicationContext } from "./application-context.js";
import { ObservabilityContext } from "./observability.js";
import { ValidationEngine } from "./validation-engine.js";
import { getGlobalEventBus } from "./event-bus.js";

export class CreateDecisionService {
  private engine: ValidationEngine;

  constructor() {
    this.engine = new ValidationEngine();
  }

  /**
   * Create a decision with full orchestration:
   * validate → create → validate → learn → emit event → respond
   */
  async execute(
    tenantCtx: TenantContext,
    request: CreateDecisionRequest,
    observability?: ObservabilityContext,
  ): Promise<CreateDecisionResponse> {
    const obs = observability ?? new ObservabilityContext({
      workspaceId: request.workspaceId,
      serviceName: "CreateDecisionService",
    });

    const ctx = getApplicationContext();

    // 1. Validate workspace exists
    const workspace = await obs.track("validateWorkspace", async () => {
      const ws = await ctx.workspace.getWorkspace(tenantCtx, request.workspaceId);
      if (!ws) {
        throw new Error(`Workspace not found: ${request.workspaceId}`);
      }
      return ws;
    });

    // 2. Create the decision
    const result = await obs.track("createDecision", async () => {
      return ctx.decision.createDecision(tenantCtx, {
        workspaceId: request.workspaceId,
        title: request.title,
        intent: request.intent,
        context: request.context,
        tags: request.tags,
      });
    });

    // 3. Run validation on the created decision
    await obs.track("validateDecision", async () => {
      const validation = await this.engine.validate(result.decision);
      obs.setValidationScore(validation.overallScore);
      return validation;
    });

    // 4. Record learning event
    await obs.track("recordLearning", async () => {
      await ctx.learning.recordLearning(tenantCtx, {
        workspaceId: request.workspaceId,
        decisionId: result.decision.id,
        outcomeIds: [],
        type: "insight",
        content: `Decision created: ${request.title}`,
        confidence: result.decision.confidence,
        description: request.context,
      });
    });

    // 5. Emit domain event
    const eventBus = getGlobalEventBus();
    await obs.track("emitEvent", async () => {
      await eventBus.emit({
        eventName: "DecisionCreated",
        eventId: `evt_${Date.now()}`,
        aggregateId: result.decision.id,
        aggregateType: "decision",
        timestamp: new Date().toISOString(),
        payload: {
          decisionId: result.decision.id,
          workspaceId: request.workspaceId,
          title: request.title,
          confidence: result.decision.confidence,
          optionCount: result.decision.options.length,
        },
      });
      obs.recordEvent("DecisionCreated");
    });

    obs.setOutcome("success");

    return {
      decision: result.decision,
      summary: result.summary,
    };
  }
}

