/**
 * DecisionCapability — Core decision intelligence for SPYRAL.
 *
 * Transforms human intent into structured decisions with context,
 * strategic options, risks, and confidence scoring.
 *
 * This capability follows the pattern:
 *   MCP Tool (thin) → Capability (logic) → Repository (persistence)
 *
 * Phase 2 — Milestone B.3 (Domain Capabilities)
 */

import type {
  TenantContext,
  Decision,
  DecisionRepository,
  DecisionOption,
  DecisionSummary,
} from "@spyral/kernel";

export interface CreateDecisionInput {
  workspaceId: string;
  ownerId?: string;
  orgId?: string;
  title: string;
  intent: string;
  context?: string;
  tags?: string[];
}

export interface DecisionAnalysisResult {
  decision: Decision;
  summary: DecisionSummary;
}

export class DecisionCapability {
  constructor(private readonly decisionRepo: DecisionRepository) {}

  /**
   * Create a decision from a human intent statement.
   * Analyzes intent to generate structured options with confidence scoring.
   */
  async createDecision(ctx: TenantContext, input: CreateDecisionInput): Promise<DecisionAnalysisResult> {
    const now = new Date().toISOString();
    const decisionId = generateId("dec");

    const options = this.analyzeIntent(input.intent);

    const decision: Decision = {
      id: decisionId,
      workspaceId: input.workspaceId,
      ownerId: input.ownerId ?? "",
      orgId: input.orgId ?? "",
      title: input.title,
      intent: input.intent,
      context: input.context ?? "",
      options,
      status: "analyzed",
      confidence: Math.max(...options.map((o) => o.confidence)),
      tags: input.tags ?? [],
      createdAt: now,
      updatedAt: now,
    };

    const saved = await this.decisionRepo.save(ctx, decision);

    return {
      decision: saved,
      summary: this.toSummary(saved),
    };
  }

  /** Get a decision by ID */
  async getDecision(ctx: TenantContext, id: string): Promise<Decision | undefined> {
    return this.decisionRepo.findById(ctx, id);
  }

  /** Select an option for a decision (moves status to "executing") */
  async selectOption(ctx: TenantContext, decisionId: string, optionId: string): Promise<Decision> {
    return this.decisionRepo.selectOption(ctx, decisionId, optionId);
  }

  /** List decisions for a workspace */
  async listByWorkspace(ctx: TenantContext, workspaceId: string): Promise<DecisionSummary[]> {
    const decisions = await this.decisionRepo.findByWorkspaceId(ctx, workspaceId);
    return decisions.map((d) => this.toSummary(d));
  }

  /** List decisions by status */
  async listByStatus(ctx: TenantContext, status: Decision["status"]): Promise<DecisionSummary[]> {
    const decisions = await this.decisionRepo.findByStatus(ctx, status);
    return decisions.map((d) => this.toSummary(d));
  }

  // ─── Private: Intent Analysis ────────────────────────────────────────────

  private analyzeIntent(intent: string): DecisionOption[] {
    const lower = intent.toLowerCase();
    const options: DecisionOption[] = [];

    // Detect domain keywords to generate relevant options
    const hasLaunch = lower.includes("launch") || lower.includes("release") || lower.includes("introduce");
    const hasInvest = lower.includes("invest") || lower.includes("fund") || lower.includes("budget");
    const hasHire = lower.includes("hire") || lower.includes("recruit") || lower.includes("staff");
    const hasPartner = lower.includes("partner") || lower.includes("acquire") || lower.includes("merge");
    const hasPivot = lower.includes("pivot") || lower.includes("change") || lower.includes("restructure");

    // Proceed option
    if (hasLaunch || options.length === 0) {
      options.push({
        id: generateOptionId(),
        title: "Proceed with launch",
        description: "Move forward with the initiative as planned, committing resources and timeline.",
        expectedBenefit: "First-mover advantage, market opportunity capture, momentum building",
        expectedCost: "Full resource commitment, higher burn rate",
        expectedRisk: "Market readiness uncertainty, execution risk",
        requiredEffort: "High — immediate full allocation",
        confidence: 72,
      });
    }

    // Deliberate option (always present)
    options.push({
      id: generateOptionId(),
      title: "Deliberate further",
      description: "Gather more data, run experiments, and validate assumptions before committing.",
      expectedBenefit: "Reduced risk, better-informed decision, stakeholder alignment",
      expectedCost: "Delayed value realization, continued analysis cost",
      expectedRisk: "May miss timing window, analysis paralysis",
      requiredEffort: "Medium — focused research and validation",
      confidence: 85,
    });

    if (hasInvest) {
      options.push({
        id: generateOptionId(),
        title: "Phased investment",
        description: "Commit partial resources now with stage-gates for continued funding based on results.",
        expectedBenefit: "Limits downside, creates learning checkpoints, preserves optionality",
        expectedCost: "Complex governance overhead",
        expectedRisk: "Potential underfunding, slower execution",
        requiredEffort: "Medium-high — staged resource allocation",
        confidence: 78,
      });
    }

    if (hasPartner) {
      options.push({
        id: generateOptionId(),
        title: "Strategic partnership",
        description: "Share risk and capability by partnering with a complementary organization.",
        expectedBenefit: "Shared risk, access to additional capabilities, faster market entry",
        expectedCost: "Revenue sharing, integration investment",
        expectedRisk: "Cultural misalignment, integration complexity",
        requiredEffort: "Medium — partnership development and management",
        confidence: 65,
      });
    }

    if (hasPivot) {
      options.push({
        id: generateOptionId(),
        title: "Pivot and restructure",
        description: "Change direction based on new insights, reallocating resources to higher-value activities.",
        expectedBenefit: "Realigns with market reality, unlocks new growth, builds adaptability",
        expectedCost: "Disruption to current operations, restructuring costs",
        expectedRisk: "Team morale impact, stakeholder confusion",
        requiredEffort: "High — organizational change management",
        confidence: 60,
      });
    }

    if (hasHire) {
      options.push({
        id: generateOptionId(),
        title: "Build internal capability",
        description: "Recruit and develop talent to build the capability in-house.",
        expectedBenefit: "Long-term ownership, cultural fit, full control",
        expectedCost: "Time to hire, training investment, salary commitments",
        expectedRisk: "Wrong hire risk, time-to-productivity lag",
        requiredEffort: "Medium-long — recruitment and ramping up",
        confidence: 70,
      });
    }

    // Always include a conservative option
    if (!options.some((o) => o.title.toLowerCase().includes("maintain"))) {
      options.push({
        id: generateOptionId(),
        title: "Maintain current course",
        description: "Continue existing operations without changes. Revisit at the next review cycle.",
        expectedBenefit: "No disruption, preserved resources, trend observation time",
        expectedCost: "Opportunity cost of inaction",
        expectedRisk: "Competitive erosion, stagnation",
        requiredEffort: "Minimal — continue current operations",
        confidence: 50,
      });
    }

    return options;
  }

  private toSummary(decision: Decision): DecisionSummary {
    return {
      id: decision.id,
      title: decision.title,
      status: decision.status,
      optionCount: decision.options.length,
      confidence: decision.confidence,
      createdAt: decision.createdAt,
      workspaceId: decision.workspaceId,
    };
  }
}

// ─── ID Generation ───────────────────────────────────────────────────────────

let counter = 0;

function generateId(prefix: string): string {
  counter++;
  const timestamp = Date.now().toString(36);
  return `${prefix}_${timestamp}_${counter.toString(36).padStart(4, "0")}`;
}

function generateOptionId(): string {
  counter++;
  return `opt_${counter.toString(36).padStart(4, "0")}`;
}
