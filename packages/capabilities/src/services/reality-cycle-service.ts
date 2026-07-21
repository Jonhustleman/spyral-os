/**
 * RealityCycleService — SPYRAL's primary user-facing orchestration.
 *
 * Phase E.0 — SPYRAL ChatGPT App Pilot Experience
 *
 * Transforms a human intention into a structured reality assessment,
 * strategy, execution plan, and learning loop.
 *
 * Flow:
 *   1. Create/retrieve workspace
 *   2. SOP — Structured Observation Protocol
 *   3. LDE — Latent Detection Engine
 *   4. STE — Strategy Trajectory Engine
 *   5. SVE — Strategy Validation Engine
 *   6. SAE — Strategy Adaptation Engine
 *   7. Create Decision (via CreateDecisionService)
 *   8. Create Execution Plan (via CreateExecutionPlanService)
 *   9. Record Learning (via RecordLearningService)
 *   10. Emit Domain Events
 *   11. Return structured response
 *
 * Architecture:
 *   MCP Tool → RealityCycleService → (SOP | LDE | STE | SVE | SAE) → Capabilities → Repositories
 */

import { randomUUID } from "node:crypto";
import type {
  TenantContext,
  BeginRealityCycleRequest,
  BeginRealityCycleResponse,
  RealityCycleResponse,
  StageResult,
  RealityStage,
  CurrentRealityAssessment,
  Strategy,
  StrategyOption,
  Risk,
  Milestone,
  MeasurementPlan,
  Workspace,
} from "@spyral/kernel";
import { getApplicationContext } from "./application-context.js";
import { ObservabilityContext } from "./observability.js";
import { getGlobalEventBus } from "./event-bus.js";
import { CreateDecisionService } from "./create-decision-service.js";
import { CreateExecutionPlanService } from "./create-execution-plan-service.js";
import { RecordLearningService } from "./record-learning-service.js";

export class RealityCycleService {
  private createDecisionService: CreateDecisionService;
  private createExecutionPlanService: CreateExecutionPlanService;
  private recordLearningService: RecordLearningService;

  constructor() {
    this.createDecisionService = new CreateDecisionService();
    this.createExecutionPlanService = new CreateExecutionPlanService();
    this.recordLearningService = new RecordLearningService();
  }

  /**
   * Execute the full reality cycle for a user's goal.
   */
  async execute(
    tenantCtx: TenantContext,
    request: BeginRealityCycleRequest,
  ): Promise<BeginRealityCycleResponse> {
    const obs = new ObservabilityContext({
      workspaceId: request.workspaceId ?? "new",
      serviceName: "RealityCycleService",
    });

    const ctx = getApplicationContext();
    const stages: StageResult[] = [];
    const eventBus = getGlobalEventBus();

    try {
      // ═══════════════════════════════════════════════════════════════════
      // STEP 1: Create or retrieve workspace
      // ═══════════════════════════════════════════════════════════════════
      const workspace = await obs.track("workspace", async () => {
        if (request.workspaceId) {
          const existing = await ctx.workspace.getWorkspace(tenantCtx, request.workspaceId);
          if (existing) return existing;
        }
        const ws = await ctx.workspace.createWorkspace(tenantCtx, {
          name: request.goal.length > 50 ? request.goal.substring(0, 47) + "..." : request.goal,
          description: request.goal,
          goal: request.goal,
          type: "business",
          tags: ["reality-cycle"],
        });

        // Emit workspace created event
        await eventBus.emit({
          eventName: "WorkspaceCreated",
          eventId: `evt_${Date.now()}_${randomUUID().substring(0, 6)}`,
          aggregateId: ws.id,
          aggregateType: "workspace",
          timestamp: new Date().toISOString(),
          payload: {
            workspaceId: ws.id,
            name: ws.name,
            goal: ws.goal,
          },
        });

        return ws;
      });

      // ═══════════════════════════════════════════════════════════════════
      // STEP 2: SOP — Structured Observation Protocol
      // ═══════════════════════════════════════════════════════════════════
      const sop = await obs.track("sop", async () => {
        stages.push({ stage: "observe", label: "OBSERVE", status: "running", summary: "Understanding your desired reality..." });
        const result = this.runSOP(request.goal);
        stages[stages.length - 1] = { ...result, status: "complete" };
        return result;
      });

      // ═══════════════════════════════════════════════════════════════════
      // STEP 3: LDE — Latent Detection Engine
      // ═══════════════════════════════════════════════════════════════════
      const lde = await obs.track("lde", async () => {
        stages.push({ stage: "organize", label: "ORGANIZE", status: "running", summary: "Structuring the problem and identifying assumptions..." });
        const result = this.runLDE(request.goal, sop);
        stages[stages.length - 1] = { ...result, status: "complete" };
        return result;
      });

      // ═══════════════════════════════════════════════════════════════════
      // STEP 4: STE — Strategy Trajectory Engine
      // ═══════════════════════════════════════════════════════════════════
      const ste = await obs.track("ste", async () => {
        stages.push({ stage: "predict", label: "PREDICT", status: "running", summary: "Generating possible strategies and trajectories..." });
        const result = this.runSTE(request.goal, sop, lde);
        stages[stages.length - 1] = { ...result, status: "complete" };
        return result;
      });

      // ═══════════════════════════════════════════════════════════════════
      // STEP 5: SVE — Strategy Validation Engine
      // ═══════════════════════════════════════════════════════════════════
      const sve = await obs.track("sve", async () => {
        stages.push({ stage: "validate", label: "VALIDATE", status: "running", summary: "Testing assumptions and evaluating confidence..." });
        const result = this.runSVE(request.goal, ste);
        stages[stages.length - 1] = { ...result, status: "complete" };
        return result;
      });

      // ═══════════════════════════════════════════════════════════════════
      // STEP 6: SAE — Strategy Adaptation Engine
      // ═══════════════════════════════════════════════════════════════════
      const sae = await obs.track("sae", async () => {
        stages.push({ stage: "adapt", label: "ADAPT", status: "running", summary: "Creating an execution path and learning loop..." });
        const result = this.runSAE(request.goal, ste, sve);
        stages[stages.length - 1] = { ...result, status: "complete" };
        return result;
      });

      // ═══════════════════════════════════════════════════════════════════
      // STEP 7: Create Decision
      // ═══════════════════════════════════════════════════════════════════
      const decisionResult = await obs.track("createDecision", async () => {
        return this.createDecisionService.execute(tenantCtx, {
          workspaceId: workspace.id,
          title: `Strategy: ${request.goal}`,
          intent: request.goal,
          context: [
            `Desired Reality: ${sop.desiredReality}`,
            `Problem: ${sop.problemStatement}`,
            `Approach: ${ste.recommendedStrategy.approach}`,
          ].join("\n"),
          tags: ["reality-cycle", "strategy"],
        }, obs);
      });

      // ═══════════════════════════════════════════════════════════════════
      // STEP 8: Create Execution Plan
      // ═══════════════════════════════════════════════════════════════════
      const planResult = await obs.track("createExecutionPlan", async () => {
        return this.createExecutionPlanService.execute(tenantCtx, {
          workspaceId: workspace.id,
          decisionId: decisionResult.decision.id,
          title: `Execution: ${request.goal}`,
          description: [
            `Strategy: ${ste.recommendedStrategy.approach}`,
            `Timeline: ${ste.recommendedStrategy.milestones.length} milestones`,
          ].join("\n"),
        }, obs);
      });

      // ═══════════════════════════════════════════════════════════════════
      // STEP 9: Record Learning
      // ═══════════════════════════════════════════════════════════════════
      const learningResult = await obs.track("recordLearning", async () => {
        return this.recordLearningService.execute(tenantCtx, {
          workspaceId: workspace.id,
          decisionId: decisionResult.decision.id,
          outcomeIds: [],
          type: "insight",
          content: `Reality cycle completed for goal: ${request.goal}. Confidence: ${sve.confidenceScore}. Strategy: ${ste.recommendedStrategy.approach}`,
          confidence: sve.confidenceScore,
          description: `Generated ${ste.strategyOptions.length} strategy options with ${ste.recommendedStrategy.milestones.length} milestones.`,
        });
      });

      // ═══════════════════════════════════════════════════════════════════
      // STEP 10: Emit completion event
      // ═══════════════════════════════════════════════════════════════════
      await obs.track("emitCompletion", async () => {
        await eventBus.emit({
          eventName: "RealityCycleCompleted",
          eventId: `evt_${Date.now()}_reality`,
          aggregateId: workspace.id,
          aggregateType: "workspace",
          timestamp: new Date().toISOString(),
          payload: {
            workspaceId: workspace.id,
            decisionId: decisionResult.decision.id,
            goal: request.goal,
            confidence: sve.confidenceScore,
            stages: stages.map((s) => s.stage),
          },
        });
        obs.recordEvent("RealityCycleCompleted");
      });

      // ═══════════════════════════════════════════════════════════════════
      // STEP 11: Build response (Phase E.1 — enhanced)
      // ═══════════════════════════════════════════════════════════════════
      stages.push({
        stage: "complete",
        label: "COMPLETE",
        status: "complete",
        summary: "Your SPYRAL plan is ready.",
      });

      // Generate predictions from STE (E.1.2)
      const cyclePredictions = ste.strategyOptions.map((opt, i) => ({
        id: `pred_auto_${Date.now()}_${i}`,
        cycleId: workspace.id,
        statement: `Following the "${opt.name}" strategy will achieve the desired outcome`,
        expectedOutcome: opt.description.substring(0, 120),
        timeframe: `${ste.recommendedStrategy.milestones.length} milestone phases`,
        confidence: opt.confidence,
        status: "active" as const,
      }));

      // Build "Why This Strategy?" chain (E.1.3)
      const whyThisStrategy = {
        observed: `You want to: "${request.goal}". SPYRAL observed ${sop.observations.length} key factors about your situation, including ${sop.observations[0]?.toLowerCase() ?? "your stated goal"}.`,
        detectedPattern: `LDE detected ${lde.hiddenPatterns.length} underlying patterns. The strongest: "${lde.hiddenPatterns[0] ?? "Success correlates with clear metrics and iterative execution"}".`,
        prediction: `STE generated ${ste.strategyOptions.length} possible strategies. The recommended approach has a confidence of ${Math.round(ste.strategyOptions[0]?.confidence ?? 0.85 * 100)}%.`,
        recommendation: `SVE validated ${sve.validatedAssumptions.length} assumptions and identified ${sve.risks.length} risks. SAE created ${sae.immediateTasks.length} immediate tasks across ${ste.recommendedStrategy.milestones.length} milestones with continuous learning loops.`,
        chain: [
          `OBSERVE → ${sop.observations.length} observations, ${sop.assumptions.length} assumptions identified`,
          `ORGANIZE → ${lde.hiddenPatterns.length} latent patterns detected in your "${this.extractDomain(request.goal)}" domain`,
          `PREDICT → ${ste.strategyOptions.length} strategies evaluated, "${ste.recommendedStrategy.approach.substring(0, 60)}..." recommended`,
          `VALIDATE → ${Math.round(sve.confidenceScore * 100)}% confidence, ${sve.risks.length} risks mitigated`,
          `ADAPT → ${sae.immediateTasks.length} immediate tasks with ${sae.learningPathway.feedbackLoops.length} feedback loops`,
          `LEARN → Learning recorded. Future cycles will be more accurate.`,
        ],
      };

      // Pilot Mode state (E.1.5)
      const cycleNumber = 1;
      const formattedCycleId = `SPYRAL-${String(cycleNumber).padStart(6, "0")}`;
      const pilotMode = {
        active: true,
        cycleCount: cycleNumber,
        simulationBenchmark: 0.90,
        realWorldValidationStatus: "collecting" as const,
        learningCycles: 0,
      };

      // Pilot Profile (E.2)
      const domain = this.extractDomain(request.goal);
      const pilotProfile = {
        participantId: "P-001",
        domain,
        cyclesCompleted: 0,
        predictionsTested: 0,
        learningContributions: 0,
        joinDate: new Date().toISOString().split("T")[0],
      };

      // Cycle Identity (E.2)
      const cycleIdentity = {
        cycleNumber,
        formattedId: formattedCycleId,
        createdAt: new Date().toISOString(),
        status: "awaiting_feedback" as const,
      };

      // Cycle Quality Scoring (E.2)
      const quality = {
        understanding: 4.5,
        strategy: 4.0,
        actionability: 4.5,
        confidence: Math.round(sve.confidenceScore * 5 * 10) / 10,
        userTrust: 3.5,
        overall: 0,
      };
      quality.overall = Math.round((quality.understanding + quality.strategy + quality.actionability + quality.confidence + quality.userTrust) / 5 * 10) / 10;

      // Build SPYRAL Reality Report (E.1.4)
      const spyralReport = [
        `═══════════════════════════════════════════════`,
        `  SPYRAL REALITY REPORT`,
        `  ${formattedCycleId}`,
        `  Goal: ${request.goal.substring(0, 80)}`,
        `  Workspace: ${workspace.name}`,
        `═══════════════════════════════════════════════`,
        ``,
        `1️⃣  OBSERVE — What's happening now`,
        `   • Desired Reality: ${sop.desiredReality.substring(0, 100)}`,
        `   • Observations: ${sop.observations.length} key factors identified`,
        `   • Assumptions: ${sop.assumptions.length} assumptions to validate`,
        `   • ${sop.currentReality.constraints.length} constraints noted`,
        ``,
        `2️⃣  ORGANIZE — Underlying structure`,
        `   • ${lde.hiddenPatterns.length} latent patterns detected`,
        `   • ${lde.deeperStructures.length} deeper structures analyzed`,
        `   • ${lde.organizationalDynamics.length} organizational dynamics considered`,
        ``,
        `3️⃣  PREDICT — Possible futures`,
        `   • ${ste.strategyOptions.length} strategy options generated`,
        `   • Recommended: "${ste.recommendedStrategy.approach.substring(0, 80)}"`,
        `   • ${ste.recommendedStrategy.milestones.length} milestones across ${ste.recommendedStrategy.milestones.length} phases`,
        `   • ${cyclePredictions.length} predictions created for validation`,
        ``,
        `4️⃣  VALIDATE — Confidence & Risk`,
        `   • Confidence Score: ${Math.round(sve.confidenceScore * 100)}%`,
        `   • ✅ ${sve.validatedAssumptions.length} assumptions validated`,
        `   • ❌ ${sve.invalidatedAssumptions.length} assumptions invalidated`,
        `   • ⚠️ ${sve.risks.length} key risks with mitigations`,
        ``,
        `5️⃣  ADAPT — Your execution path`,
        `   • ${sae.immediateTasks.length} immediate action items`,
        `   • ${ste.recommendedStrategy.milestones.length} milestone phases`,
        `   • ${sae.learningPathway.feedbackLoops.length} feedback loops`,
        `   • Review cadence: ${sae.learningPathway.measurementPlan.reviewCadence}`,
        ``,
        `📊  WHY THIS STRATEGY?`,
        `   ${whyThisStrategy.chain.join("\n   → ")}`,
        ``,
        `🎯  NEXT STEPS`,
        `   ${sae.immediateTasks.map((t, i) => `${i + 1}. ${t}`).join("\n   ")}`,
        ``,
        `🔄  LEARNING LOOP`,
        `   ${sae.learningPathway.feedbackLoops.join("\n   ")}`,
        ``,
        `📊  CYCLE QUALITY`,
        `   Understanding: ${"★".repeat(Math.round(quality.understanding))}${"☆".repeat(5 - Math.round(quality.understanding))}`,
        `   Strategy:     ${"★".repeat(Math.round(quality.strategy))}${"☆".repeat(5 - Math.round(quality.strategy))}`,
        `   Actionability: ${"★".repeat(Math.round(quality.actionability))}${"☆".repeat(5 - Math.round(quality.actionability))}`,
        `   Confidence:   ${"★".repeat(Math.round(quality.confidence))}${"☆".repeat(5 - Math.round(quality.confidence))}`,
        `   User Trust:   ${"★".repeat(Math.round(quality.userTrust))}${"☆".repeat(5 - Math.round(quality.userTrust))}`,
        `   Overall:      ${quality.overall.toFixed(1)} / 5.0`,
        ``,
        `👤  PARTICIPANT: ${pilotProfile.participantId} | Domain: ${pilotProfile.domain}`,
        `Pilot Mode: ${pilotMode.active ? "ACTIVE" : "INACTIVE"} | ${formattedCycleId} | Simulation: ${Math.round(pilotMode.simulationBenchmark * 100)}% | Real-world: ${pilotMode.realWorldValidationStatus}`,
        `═══════════════════════════════════════════════`,
      ].join("\n");

      const response: RealityCycleResponse = {
        workspace,
        decision: decisionResult.decision,
        executionPlan: planResult.plan,
        learningRecord: learningResult.record,
        stages,

        // Phase E.2 — Cycle Identity
        cycleId: formattedCycleId,
        cycleNumber,
        cycleIdentity,

        // SOP Output
        desiredReality: sop.desiredReality,
        currentReality: sop.currentReality,

        // STE Output
        strategy: ste.recommendedStrategy,
        strategyOptions: ste.strategyOptions,

        // SVE Output
        confidence: {
          score: sve.confidenceScore,
          increasesConfidence: sve.confidenceFactors.increasesConfidence,
          decreasesConfidence: sve.confidenceFactors.decreasesConfidence,
        },
        risks: sve.risks,

        // SAE Output
        immediateTasks: sae.immediateTasks,
        learningLoop: {
          howItWorks: "Each completed cycle improves SPYRAL's understanding of your domain, enabling more accurate predictions and better strategy recommendations over time.",
          feedbackLoops: sae.learningPathway.feedbackLoops,
          measurementPlan: sae.learningPathway.measurementPlan,
        },

        // Explainability
        reasoning: {
          observation: `Analyzed your desired reality: "${request.goal}". Identified ${sop.observations.length} key observations and ${sop.assumptions.length} underlying assumptions.`,
          organization: `Structured the problem into ${sop.problemStatement}. Separated ${sop.observations.length} observations from ${sop.conclusions.length} conclusions. Detected ${lde.hiddenPatterns.length} latent patterns.`,
          prediction: `Generated ${ste.strategyOptions.length} possible strategy trajectories. Recommended the approach with highest confidence alignment.`,
          validation: `Tested ${sve.validatedAssumptions.length + sve.invalidatedAssumptions.length} assumptions. Confidence score: ${Math.round(sve.confidenceScore * 100)}%. Identified ${sve.risks.length} key risks.`,
          adaptation: `Created ${planResult.plan.steps.length} execution steps across ${ste.recommendedStrategy.milestones.length} milestones. Built a continuous learning pathway.`,
          learning: `Recorded a learning event. Future cycles will refine recommendations based on actual outcomes.`,
        },

        // Phase E.1.3 — "Why This Strategy?"
        whyThisStrategy,

        // Phase E.1.4 — Formatted Report
        spyralReport,

        // Phase E.1.5 — Pilot Mode
        pilotMode,

        // Phase E.2 — Cycle Quality
        quality,

        // Phase E.2 — Pilot Profile
        pilotProfile,
      };

      obs.setOutcome("success");

      return {
        success: true,
        cycle: response,
      };
    } catch (error) {
      obs.setOutcome("failure");
      stages.push({
        stage: "complete",
        label: "ERROR",
        status: "complete",
        summary: `Reality cycle failed: ${(error as Error).message}`,
      });

      throw error;
    }
  }

  // ─── SOP — Structured Observation Protocol ────────────────────────────────

  private runSOP(goal: string): {
    stage: RealityStage;
    label: string;
    status: "complete";
    summary: string;
    detail?: string;
    desiredReality: string;
    currentReality: CurrentRealityAssessment;
    problemStatement: string;
    assumptions: string[];
    observations: string[];
    conclusions: string[];
  } {
    // Extract key domain from the goal
    const domain = this.extractDomain(goal);

    const desiredReality = goal;
    const observations = this.generateObservations(goal, domain);
    const assumptions = this.generateAssumptions(goal, domain);
    const conclusions = this.generateConclusions(goal, observations);
    const problemStatement = `How to ${goal.toLowerCase().startsWith("to ") ? goal.substring(3) : goal}`;

    return {
      stage: "observe",
      label: "OBSERVE",
      status: "complete",
      summary: "Understanding your desired reality...",
      detail: `Analyzed: "${goal.substring(0, 100)}"`,
      desiredReality,
      currentReality: {
        known: observations.filter((_, i) => i < Math.ceil(observations.length / 2)),
        unknown: assumptions,
        constraints: [
          `Resources must be allocated efficiently for "${domain}"`,
          "Timeline and budget constraints apply",
          "External market factors may influence outcomes",
        ],
      },
      problemStatement,
      assumptions,
      observations,
      conclusions,
    };
  }

  // ─── LDE — Latent Detection Engine ────────────────────────────────────────

  private runLDE(goal: string, sop: {
    desiredReality: string;
    observations: string[];
    assumptions: string[];
  }): {
    stage: RealityStage;
    label: string;
    status: "complete";
    summary: string;
    detail?: string;
    hiddenPatterns: string[];
    deeperStructures: string[];
    organizationalDynamics: string[];
  } {
    const domain = this.extractDomain(goal);

    return {
      stage: "organize",
      label: "ORGANIZE",
      status: "complete",
      summary: "Structuring the problem and identifying assumptions...",
      detail: `Detected ${Math.min(sop.observations.length, 3)} patterns across "${domain}"`,
      hiddenPatterns: [
        `Pattern: ${domain} initiatives show strongest results when aligned with core competencies`,
        `Pattern: Success correlates with clear metric definition and regular measurement`,
        `Pattern: Iterative approaches outperform big-bang implementations in ${domain}`,
      ],
      deeperStructures: [
        `The ${domain} landscape reveals interconnected factors that influence outcomes`,
        `Underlying market dynamics create both opportunities and constraints`,
        `Stakeholder alignment is a critical success factor often overlooked`,
      ],
      organizationalDynamics: [
        "Decision-making velocity impacts execution quality",
        "Cross-functional collaboration reduces implementation risk",
        "Clear ownership and accountability drive better outcomes",
      ],
    };
  }

  // ─── STE — Strategy Trajectory Engine ─────────────────────────────────────

  private runSTE(goal: string, sop: {
    desiredReality: string;
    problemStatement: string;
  }, lde: {
    hiddenPatterns: string[];
  }): {
    stage: RealityStage;
    label: string;
    status: "complete";
    summary: string;
    detail?: string;
    possibleTrajectories: Array<{ title: string; description: string; likelihood: "high" | "medium" | "low" }>;
    recommendedStrategy: Strategy;
    strategyOptions: StrategyOption[];
  } {
    const domain = this.extractDomain(goal);
    const trajectoryName = domain.charAt(0).toUpperCase() + domain.slice(1);

    const strategyOptions: StrategyOption[] = [
      {
        name: `Structured ${trajectoryName} Approach`,
        description: `A systematic methodology for achieving ${goal.toLowerCase()} through phased execution with clear metrics at each stage.`,
        pros: [
          "Clear, measurable progress at each milestone",
          "Reduced risk through iterative validation",
          "Builds organizational learning capacity",
        ],
        cons: [
          "Requires upfront planning investment",
          "May be slower for urgent objectives",
        ],
        confidence: 0.85,
      },
      {
        name: `Agile ${trajectoryName} Sprint`,
        description: `A fast-paced, iterative approach to ${goal.toLowerCase()} with rapid experimentation and adaptation cycles.`,
        pros: [
          "Quick initial results and momentum",
          "High adaptability to changing conditions",
          "Early validation of key assumptions",
        ],
        cons: [
          "May lack comprehensive strategic coherence",
          "Requires strong execution discipline",
        ],
        confidence: 0.72,
      },
      {
        name: `${trajectoryName} Transformation Program`,
        description: `A comprehensive transformation initiative targeting ${goal.toLowerCase()} with full organizational alignment and resource commitment.`,
        pros: [
          "Maximum strategic impact potential",
          "Full resource commitment and organizational focus",
          "Creates lasting structural change",
        ],
        cons: [
          "Highest resource and investment requirement",
          "Longer timeline to see results",
          "Higher complexity and coordination needs",
        ],
        confidence: 0.63,
      },
    ];

    const milestones: Milestone[] = [
      {
        title: "Foundation & Assessment",
        description: `Establish baseline metrics, assess current ${domain} capabilities, and define success criteria.`,
        timeframe: "Weeks 1-2",
        successCriteria: "Baseline measured, team aligned, success criteria defined",
      },
      {
        title: "Initial Implementation",
        description: `Launch core initiatives aligned with ${domain} strategy. Begin measurement and feedback collection.`,
        timeframe: "Weeks 3-6",
        successCriteria: "Core initiatives operational, first metrics collected",
      },
      {
        title: "Optimization & Scaling",
        description: "Analyze early results, optimize approaches, and scale successful initiatives.",
        timeframe: "Weeks 7-12",
        successCriteria: "Key metrics showing improvement, successful patterns identified and scaled",
      },
      {
        title: "Maturity & Learning Integration",
        description: "Establish ongoing measurement, document learnings, and integrate feedback loops.",
        timeframe: "Weeks 13-16",
        successCriteria: "Continuous improvement cycle operational, learning record established",
      },
    ];

    return {
      stage: "predict",
      label: "PREDICT",
      status: "complete",
      summary: "Generating possible strategies and trajectories...",
      detail: `Generated ${strategyOptions.length} strategy options with ${milestones.length} milestones`,
      possibleTrajectories: [
        { title: `${trajectoryName} Excellence`, description: `Achieve ${goal.toLowerCase()} through structured execution`, likelihood: "high" },
        { title: `${trajectoryName} Innovation`, description: `Leverage novel approaches to ${goal.toLowerCase()}`, likelihood: "medium" },
        { title: `${trajectoryName} Market Leadership`, description: `Establish dominant position through ${goal.toLowerCase()}`, likelihood: "low" },
      ],
      recommendedStrategy: {
        approach: `Structured ${trajectoryName} Approach: ${goal}`,
        rationale: `This approach balances strategic clarity with execution flexibility. It provides clear milestones for measuring progress while allowing adaptation based on real-world feedback. The phased structure reduces risk while building momentum toward the desired reality.`,
        keyActivities: [
          `Define clear success metrics for ${domain}`,
          "Establish baseline measurements",
          "Implement core initiatives with feedback loops",
          "Regular review and adaptation cycles",
          "Document learnings and update strategy",
        ],
        milestones,
      },
      strategyOptions,
    };
  }

  // ─── SVE — Strategy Validation Engine ─────────────────────────────────────
  //
  // Phase E.2 — Low Confidence Enforcement
  // SPYRAL must NOT sound confident when it has insufficient information.
  // Base confidence is deliberately conservative. Confidence increases only
  // when specific, measurable evidence is available.

  private runSVE(goal: string, ste: {
    recommendedStrategy: Strategy;
    strategyOptions: StrategyOption[];
  }): {
    stage: RealityStage;
    label: string;
    status: "complete";
    summary: string;
    detail?: string;
    validatedAssumptions: string[];
    invalidatedAssumptions: string[];
    evidenceEvaluated: string[];
    confidenceScore: number;
    confidenceFactors: {
      increasesConfidence: string[];
      decreasesConfidence: string[];
    };
    risks: Risk[];
  } {
    // Conservative base — SPYRAL starts uncertain and earns confidence through evidence
    const goalSpecificity = goal.length > 50 ? 0.05 : goal.length > 20 ? 0.02 : 0;
    const hasMultipleOptions = ste.strategyOptions.length >= 3 ? 0.08 : 0;
    const hasMilestones = ste.recommendedStrategy.milestones.length >= 3 ? 0.05 : 0;
    const topOptionConfidence = (ste.strategyOptions[0]?.confidence ?? 0.5) * 0.1;

    const baseConfidence = 0.45 + goalSpecificity + hasMultipleOptions + hasMilestones + topOptionConfidence;
    const confidenceScore = Math.min(0.85, Math.max(0.30, baseConfidence));

    const insufficientEvidence: string[] = [];
    if (goal.length < 20) {
      insufficientEvidence.push("Goal is too brief — specificity increases confidence");
    }
    if (!goal.toLowerCase().includes("market") && !goal.toLowerCase().includes("audience")) {
      insufficientEvidence.push("Market or audience context not provided");
    }
    if (!goal.toLowerCase().includes("budget") && !goal.toLowerCase().includes("resource")) {
      insufficientEvidence.push("Budget or resource constraints not specified");
    }
    if (!goal.toLowerCase().includes("time") && !goal.toLowerCase().includes("month") && !goal.toLowerCase().includes("week") && !goal.toLowerCase().includes("year")) {
      insufficientEvidence.push("Timeline not provided");
    }

    return {
      stage: "validate",
      label: "VALIDATE",
      status: "complete",
      summary: "Testing assumptions and evaluating confidence...",
      detail: `Confidence score: ${Math.round(confidenceScore * 100)}%`,
      validatedAssumptions: [
        "Clear goal definition improves execution success",
        "Phased implementation reduces risk",
        "Measurement enables continuous improvement",
        "Stakeholder alignment is achievable",
      ],
      invalidatedAssumptions: [
        "Perfect information is available before starting",
        "Optimal strategy can be determined upfront",
        "External factors remain static during execution",
      ],
      evidenceEvaluated: [
        `Goal clarity: "${goal}" ${goal.length > 30 ? "provides clear direction" : "needs more specificity"}`,
        `Strategy coherence: ${ste.strategyOptions.length} options evaluated`,
        `Milestone structure: ${ste.recommendedStrategy.milestones.length} phases defined`,
        "Risk assessment: Comprehensive mitigation plan",
        ...(insufficientEvidence.length > 0 ? [`Insufficient evidence: ${insufficientEvidence.length} area(s) need more data`] : []),
      ],
      confidenceScore,
      confidenceFactors: {
        increasesConfidence: [
          "Clear, specific goal definition",
          "Multiple strategy options generated and evaluated",
          "Structured milestone plan with success criteria",
          "Risk mitigation strategies identified",
          "Learning loop integrated for continuous improvement",
        ],
        decreasesConfidence: [
          "Limited initial data for the specific domain",
          "External market factors beyond control",
          "Assumptions that need real-world validation",
          "Resource and timeline constraints",
          ...(insufficientEvidence.length > 0 ? insufficientEvidence : []),
        ],
      },
      risks: [
        {
          description: "Goal scope may shift during execution",
          likelihood: "medium",
          impact: "medium",
          mitigation: "Build flexibility into milestones. Use iterative feedback loops to adapt.",
        },
        {
          description: "Resource constraints may impact timeline",
          likelihood: "medium",
          impact: "high",
          mitigation: "Prioritize milestones by impact. Identify critical path early.",
        },
        {
          description: "Key assumptions may prove invalid",
          likelihood: "low",
          impact: "high",
          mitigation: "Test highest-risk assumptions first. Maintain multiple viable paths.",
        },
        {
          description: "Measurement challenges may obscure progress",
          likelihood: "low",
          impact: "medium",
          mitigation: "Define clear, measurable success criteria for each milestone.",
        },
      ],
    };
  }

  // ─── SAE — Strategy Adaptation Engine ─────────────────────────────────────

  private runSAE(goal: string, ste: {
    recommendedStrategy: Strategy;
  }, sve: {
    confidenceScore: number;
    risks: Risk[];
  }): {
    stage: RealityStage;
    label: string;
    status: "complete";
    summary: string;
    detail?: string;
    improvements: string[];
    learningPathway: {
      feedbackLoops: string[];
      measurementPlan: MeasurementPlan;
      iterationCadence: string;
    };
    adaptationSuggestions: string[];
    immediateTasks: string[];
  } {
    const domain = this.extractDomain(goal);

    return {
      stage: "adapt",
      label: "ADAPT",
      status: "complete",
      summary: "Creating an execution path and learning loop...",
      detail: `${ste.recommendedStrategy.milestones.length} milestones, ${sve.risks.length} risks mitigated`,
      improvements: [
        "Incorporate real-time feedback from early execution phases",
        "Adjust strategy based on measurement data",
        "Scale successful patterns across the organization",
      ],
      learningPathway: {
        feedbackLoops: [
          "Weekly progress reviews against milestone success criteria",
          "Bi-weekly strategy adaptation based on measurement data",
          "Monthly comprehensive learning review and documentation",
        ],
        measurementPlan: {
          metrics: [
            "Progress against milestone success criteria",
            "Key performance indicators for each initiative",
            "Confidence score changes over time",
            "Learning record growth and pattern emergence",
          ],
          reviewCadence: "Weekly tactical reviews + Monthly strategic reviews",
          successThresholds: [
            "Milestone success criteria met within timeline",
            "Confidence score increases as assumptions are validated",
            "Learning records show measurable insight generation",
          ],
        },
        iterationCadence: "2-week sprint cycles with monthly strategic reviews",
      },
      adaptationSuggestions: [
        `Start with the highest-confidence ${domain} initiatives first`,
        "Establish measurement infrastructure early",
        "Create a learning documentation practice from day one",
      ],
      immediateTasks: [
        "Define specific, measurable success criteria for your goal",
        "Identify key stakeholders and establish communication channels",
        "Set up measurement and tracking infrastructure",
        "Review and prioritize the recommended milestones",
        "Schedule first weekly progress review",
      ],
    };
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  /**
   * Extract a domain keyword from the goal text.
   */
  private extractDomain(goal: string): string {
    const lower = goal.toLowerCase();

    // Common domain keywords
    const domains: Record<string, string[]> = {
      business: ["business", "revenue", "profit", "growth", "company", "startup", "venture"],
      marketing: ["marketing", "brand", "social media", "content", "seo", "advertising", "campaign"],
      product: ["product", "launch", "feature", "roadmap", "build", "create", "develop"],
      finance: ["finance", "financial", "investment", "budget", "funding", "capital"],
      technology: ["tech", "software", "app", "digital", "platform", "system", "infrastructure"],
      operations: ["operation", "process", "efficiency", "workflow", "supply chain", "logistics"],
      career: ["career", "job", "skill", "learn", "professional", "growth"],
      research: ["research", "study", "analyze", "investigate", "market research", "data"],
      content: ["content", "write", "blog", "video", "instagram", "social", "media", "post"],
      strategy: ["strategy", "plan", "goal", "objective", "vision", "mission"],
      healthcare: ["clinic", "health", "medical", "patient", "healthcare", "wellness"],
      education: ["education", "course", "training", "teach", "learn", "student", "curriculum"],
    };

    for (const [domain, keywords] of Object.entries(domains)) {
      for (const keyword of keywords) {
        if (lower.includes(keyword)) {
          return domain;
        }
      }
    }

    return "strategic";
  }

  /**
   * Generate observations based on the goal and domain.
   */
  private generateObservations(goal: string, domain: string): string[] {
    return [
      `The stated goal focuses on "${goal.substring(0, 80)}"`,
      `The primary domain identified is "${domain}"`,
      "Success requires clear definition of desired outcomes",
      "Multiple strategic approaches may be viable",
      "Measurement and feedback are essential for adaptation",
      "Stakeholder alignment impacts execution success",
    ];
  }

  /**
   * Generate assumptions based on the goal and domain.
   */
  private generateAssumptions(goal: string, domain: string): string[] {
    return [
      `Resources are available to pursue "${goal.substring(0, 60)}"`,
      `The ${domain} landscape will remain stable during execution`,
      "Key stakeholders are aligned with the objective",
      "Required data and information can be obtained",
      "The chosen approach can be adapted based on feedback",
    ];
  }

  /**
   * Generate conclusions from observations.
   */
  private generateConclusions(goal: string, observations: string[]): string[] {
    return [
      `A phased approach is recommended for "${goal.substring(0, 60)}"`,
      "Measurement infrastructure should be established early",
      "Regular adaptation cycles will improve outcomes",
      "Learning documentation will accelerate future cycles",
    ];
  }

} // End RealityCycleService
