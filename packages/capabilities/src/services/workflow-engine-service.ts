/**
 * @spyral/capabilities — Workflow Engine Service (prototype)
 *
 * Phase D.1 — Workflow Engine prototype.
 * Lightweight workflow engine for orchestrating multi-step processes.
 *
 * Supports:
 *   - Configurable workflows via WorkflowDefinition
 *   - Step-by-step execution with history tracking
 *   - Retry, pause, resume
 *   - Event-driven triggers
 *
 * This prototype runs in-memory. Production version will persist instances.
 */

import { randomUUID } from "node:crypto";
import type {
  WorkflowDefinition,
  WorkflowInstance,
  WorkflowStatus,
  WorkflowExecutionRecord,
  WorkflowStep,
} from "@spyral/kernel";

export class WorkflowEngineService {
  private instances: Map<string, WorkflowInstance> = new Map();
  private definitions: Map<string, WorkflowDefinition> = new Map();

  // ─── Definition Management ────────────────────────────────────────────────

  registerDefinition(definition: WorkflowDefinition): void {
    this.definitions.set(definition.id, definition);
  }

  getDefinition(id: string): WorkflowDefinition | undefined {
    return this.definitions.get(id);
  }

  listDefinitions(): WorkflowDefinition[] {
    return Array.from(this.definitions.values());
  }

  // ─── Instance Management ──────────────────────────────────────────────────

  async execute(
    definitionId: string,
    context: Record<string, unknown>,
  ): Promise<WorkflowInstance> {
    const definition = this.definitions.get(definitionId);
    if (!definition) throw new Error(`Workflow definition not found: ${definitionId}`);

    if (definition.status !== "active") {
      throw new Error(`Workflow definition is ${definition.status}, not active`);
    }

    const now = new Date().toISOString();
    const instanceId = randomUUID();

    // Find the first step (no dependencies)
    const firstStep = definition.steps.find((s) => s.id === definition.steps[0]?.id);

    const instance: WorkflowInstance = {
      id: instanceId,
      definitionId: definition.id,
      triggerEvent: "manual",
      status: "active",
      currentStepId: firstStep?.id,
      context,
      history: [],
      organizationId: "default",
      startedBy: "system",
      auditLog: [],
      createdAt: now,
      updatedAt: now,
    };

    this.instances.set(instanceId, instance);
    return instance;
  }

  async advance(instanceId: string): Promise<WorkflowInstance> {
    const instance = this.instances.get(instanceId);
    if (!instance) throw new Error(`Workflow instance not found: ${instanceId}`);
    if (instance.status !== "active") throw new Error(`Instance is ${instance.status}, not active`);

    const definition = this.definitions.get(instance.definitionId);
    if (!definition) throw new Error(`Definition not found: ${instance.definitionId}`);

    if (!instance.currentStepId) {
      // No more steps — complete
      instance.status = "completed";
      instance.updatedAt = new Date().toISOString();
      return instance;
    }

    const currentStep = definition.steps.find((s) => s.id === instance.currentStepId);
    if (!currentStep) {
      instance.status = "failed";
      instance.updatedAt = new Date().toISOString();
      return instance;
    }

    // Record step execution
    const record: WorkflowExecutionRecord = {
      stepId: currentStep.id,
      status: "completed",
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      output: { stepName: currentStep.name },
    };
    instance.history.push(record);

    // Advance to next step
    if (currentStep.next.length > 0) {
      instance.currentStepId = currentStep.next[0];
    } else {
      instance.currentStepId = undefined;
      instance.status = "completed";
    }

    instance.updatedAt = new Date().toISOString();
    this.instances.set(instanceId, instance);
    return instance;
  }

  async pause(instanceId: string): Promise<WorkflowInstance> {
    const instance = this.instances.get(instanceId);
    if (!instance) throw new Error(`Workflow instance not found: ${instanceId}`);

    instance.status = "paused";
    instance.updatedAt = new Date().toISOString();
    this.instances.set(instanceId, instance);
    return instance;
  }

  async resume(instanceId: string): Promise<WorkflowInstance> {
    const instance = this.instances.get(instanceId);
    if (!instance) throw new Error(`Workflow instance not found: ${instanceId}`);
    if (instance.status !== "paused") throw new Error(`Instance is ${instance.status}, not paused`);

    instance.status = "active";
    instance.updatedAt = new Date().toISOString();
    this.instances.set(instanceId, instance);
    return instance;
  }

  async retry(instanceId: string, stepId: string): Promise<WorkflowInstance> {
    const instance = this.instances.get(instanceId);
    if (!instance) throw new Error(`Workflow instance not found: ${instanceId}`);

    // Remove failed records for this step and reset
    instance.history = instance.history.filter((r) => r.stepId !== stepId || r.status !== "failed");
    instance.currentStepId = stepId;
    instance.status = "active";
    instance.updatedAt = new Date().toISOString();
    this.instances.set(instanceId, instance);
    return instance;
  }

  getInstance(instanceId: string): WorkflowInstance | undefined {
    return this.instances.get(instanceId);
  }

  listInstances(): WorkflowInstance[] {
    return Array.from(this.instances.values());
  }
}
