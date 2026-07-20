/**
 * ExecutionCapability — Execution plan management for SPYRAL.
 *
 * Manages execution plans, steps, and progress tracking.
 * Each execution plan is linked to a decision.
 *
 * Phase 2 — Milestone B.3 (Domain Capabilities)
 */

import type {
  TenantContext,
  ExecutionPlan,
  ExecutionPlanRepository,
  ExecutionStep,
  ExecutionPlanSummary,
} from "@spyral/kernel";

export interface CreateExecutionPlanInput {
  workspaceId: string;
  decisionId: string;
  ownerId?: string;
  orgId?: string;
  title: string;
  description?: string;
  steps?: Omit<ExecutionStep, "id">[];
}

export class ExecutionCapability {
  constructor(private readonly executionRepo: ExecutionPlanRepository) {}

  /** Create an execution plan for a decision */
  async createPlan(ctx: TenantContext, input: CreateExecutionPlanInput): Promise<ExecutionPlan> {
    const now = new Date().toISOString();
    const planId = generateId("exec");

    const steps: ExecutionStep[] = (input.steps ?? this.generateDefaultSteps()).map(
      (step, index) => ({
        ...step,
        id: `step_${index + 1}`,
        status: step.status ?? "pending",
        dependencies: step.dependencies ?? [],
      }),
    );

    const plan: ExecutionPlan = {
      id: planId,
      workspaceId: input.workspaceId,
      decisionId: input.decisionId,
      ownerId: input.ownerId ?? "",
      orgId: input.orgId ?? "",
      title: input.title,
      description: input.description,
      steps,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };

    return this.executionRepo.save(ctx, plan);
  }

  /** Get an execution plan by ID */
  async getPlan(ctx: TenantContext, id: string): Promise<ExecutionPlan | undefined> {
    return this.executionRepo.findById(ctx, id);
  }

  /** Get plan linked to a decision */
  async getPlanByDecision(ctx: TenantContext, decisionId: string): Promise<ExecutionPlan | undefined> {
    return this.executionRepo.findByDecisionId(ctx, decisionId);
  }

  /** Start execution (moves from draft to active) */
  async startPlan(ctx: TenantContext, planId: string): Promise<ExecutionPlan> {
    const plan = await this.executionRepo.findById(ctx, planId);
    if (!plan) throw new Error(`ExecutionPlan not found: ${planId}`);

    const updated: ExecutionPlan = {
      ...plan,
      status: "active",
      startedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.executionRepo.save(ctx, updated);
  }

  /** Update a step's status */
  async updateStepStatus(
    ctx: TenantContext,
    planId: string,
    stepId: string,
    status: ExecutionStep["status"],
  ): Promise<ExecutionPlan> {
    const plan = await this.executionRepo.findById(ctx, planId);
    if (!plan) throw new Error(`ExecutionPlan not found: ${planId}`);

    const step = plan.steps.find((s) => s.id === stepId);
    if (!step) throw new Error(`Step not found: ${stepId}`);

    const updatedStep: ExecutionStep = { ...step, status };
    return this.executionRepo.updateStep(ctx, planId, updatedStep);
  }

  /** List plans for a workspace */
  async listByWorkspace(ctx: TenantContext, workspaceId: string): Promise<ExecutionPlanSummary[]> {
    const plans = await this.executionRepo.findByWorkspaceId(ctx, workspaceId);
    return plans.map((p) => ({
      id: p.id,
      title: p.title,
      status: p.status,
      stepCount: p.steps.length,
      completedSteps: p.steps.filter((s) => s.status === "completed").length,
      decisionId: p.decisionId,
    }));
  }

  private generateDefaultSteps(): Omit<ExecutionStep, "id">[] {
    return [
      {
        title: "Research and preparation",
        description: "Gather necessary information and prepare resources",
        status: "pending",
        dependencies: [],
      },
      {
        title: "Execute plan",
        description: "Carry out the planned activities",
        status: "pending",
        dependencies: ["step_1"],
      },
      {
        title: "Review and validate",
        description: "Review outcomes and validate against expectations",
        status: "pending",
        dependencies: ["step_2"],
      },
    ];
  }
}

// ─── ID Generation ───────────────────────────────────────────────────────────

let counter = 0;

function generateId(prefix: string): string {
  counter++;
  const timestamp = Date.now().toString(36);
  return `${prefix}_${timestamp}_${counter.toString(36).padStart(4, "0")}`;
}
