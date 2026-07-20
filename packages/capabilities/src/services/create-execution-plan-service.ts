/**
 * CreateExecutionPlanService — Orchestrates execution plan creation.
 *
 * Coordinates:
 *   1. Validate workspace exists
 *   2. Validate decision exists
 *   3. Create execution plan via ExecutionCapability
 *   4. Start the plan automatically
 *   5. Record learning event
 *   6. Emit DomainEvent
 *
 * Phase C.0 — Application Service Layer
 * Phase C.1.5 — Observability tracking
 * Phase C.2 — Domain Events emission
 */

import type {
  TenantContext,
  CreateExecutionPlanRequest,
  CreateExecutionPlanResponse,
} from "@spyral/kernel";
import { getApplicationContext } from "./application-context.js";
import { ObservabilityContext } from "./observability.js";
import { getGlobalEventBus } from "./event-bus.js";

export class CreateExecutionPlanService {
  async execute(
    tenantCtx: TenantContext,
    request: CreateExecutionPlanRequest,
    observability?: ObservabilityContext,
  ): Promise<CreateExecutionPlanResponse> {
    const obs = observability ?? new ObservabilityContext({
      workspaceId: request.workspaceId,
      serviceName: "CreateExecutionPlanService",
    });

    const ctx = getApplicationContext();

    // 1. Validate workspace exists
    await obs.track("validateWorkspace", async () => {
      const ws = await ctx.workspace.getWorkspace(tenantCtx, request.workspaceId);
      if (!ws) throw new Error(`Workspace not found: ${request.workspaceId}`);
      return ws;
    });

    // 2. Validate decision exists
    const decision = await obs.track("validateDecision", async () => {
      const d = await ctx.decision.getDecision(tenantCtx, request.decisionId);
      if (!d) throw new Error(`Decision not found: ${request.decisionId}`);
      return d;
    });

    // 3. Create execution plan
    const plan = await obs.track("createPlan", async () => {
      return ctx.execution.createPlan(tenantCtx, {
        workspaceId: request.workspaceId,
        decisionId: request.decisionId,
        title: request.title,
        description: request.description,
      });
    });

    // 4. Auto-start the plan
    const startedPlan = await obs.track("startPlan", async () => {
      return ctx.execution.startPlan(tenantCtx, plan.id);
    });

    // 5. Record learning event
    await obs.track("recordLearning", async () => {
      await ctx.learning.recordLearning(tenantCtx, {
        workspaceId: request.workspaceId,
        decisionId: request.decisionId,
        outcomeIds: [startedPlan.id],
        type: "lesson",
        content: `Execution plan created and started: ${request.title}`,
        confidence: 0.8,
        description: request.description,
      });
    });

    // 6. Emit domain events
    const eventBus = getGlobalEventBus();
    await obs.track("emitEvents", async () => {
      await eventBus.emit({
        eventName: "ExecutionPlanCreated",
        eventId: `evt_${Date.now()}`,
        aggregateId: startedPlan.id,
        aggregateType: "execution",
        timestamp: new Date().toISOString(),
        payload: {
          planId: startedPlan.id,
          decisionId: request.decisionId,
          workspaceId: request.workspaceId,
          title: request.title,
          stepCount: startedPlan.steps.length,
        },
      });
      await eventBus.emit({
        eventName: "ExecutionPlanStarted",
        eventId: `evt_${Date.now() + 1}`,
        aggregateId: startedPlan.id,
        aggregateType: "execution",
        timestamp: new Date().toISOString(),
        payload: {
          planId: startedPlan.id,
          startedAt: startedPlan.startedAt ?? new Date().toISOString(),
        },
      });
      obs.recordEvent("ExecutionPlanCreated");
      obs.recordEvent("ExecutionPlanStarted");
    });

    obs.setOutcome("success");

    return { plan: startedPlan };
  }
}
