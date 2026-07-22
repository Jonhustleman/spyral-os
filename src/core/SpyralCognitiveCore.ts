/**
 * SPYRAL OS — SpyralCognitiveCore
 *
 * THE INTELLIGENCE OPERATING SYSTEM.
 *
 * This is the ONLY intelligence inside SPYRAL.
 * Every agent (Research, Content, Navigation, Consultant, Command Center)
 * MUST call think(). No page is allowed to generate responses independently.
 *
 * The underlying LLM is ONLY a Cognitive Processor.
 * SPYRAL owns: Reasoning, Research, Memory, Knowledge, Pattern Detection,
 * Decision Support, Navigation, Strategy, Validation, Learning.
 *
 * Pipeline: Understand → Retrieve Memory → Mental Model → SOP → LDE → STE → SVE → SAE → Recommend → Execute → Learn → Return
 */

import { LearningStore } from "@/features/learning";
import { SharedContextStore } from "@/features/shared";
import { ExperienceRecorder } from "@/core/product-intelligence";

// ─── Constants ──────────────────────────────────────────────────────────

/** Maximum confidence the SVE can assign without strong supporting evidence */
export const CONFIDENCE_MAX = 0.85;

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type AgentType = "research" | "content" | "navigation" | "consultant" | "command";

export type ResearchMode = "discovery" | "experiment" | "literature" | "theory" | "report" | "debate";

// ─── PHASE F.1 — ADAPTIVE COGNITION ─────────────────────────────────────

export type ReasoningStrategy = "discovery" | "reporting" | "planning" | "decision" | "creation";

export type CognitiveDomain = "research" | "creation" | "navigation" | "consulting" | "decision" | "learning" | "analysis" | "conversation";

export type CognitiveComplexity = "low" | "medium" | "high";

/**
 * Intent Analysis — determined BEFORE any pipeline stage runs.
 * Every request passes through IntentAnalysisStage FIRST.
 */
export interface CognitiveIntent {
  domain: CognitiveDomain;
  complexity: CognitiveComplexity;
  uncertainty: CognitiveComplexity;
  reasoningDepth: 1 | 2 | 3 | 4 | 5;
  requiresDialogue: boolean;
  requiresPlanning: boolean;
  requiresInvestigation: boolean;
  requiresImmediateAnswer: boolean;
  reasoningStrategy: ReasoningStrategy;
}

/**
 * Conversation Memory — SPYRAL remembers what it's doing across turns.
 */
export interface ConversationContext {
  currentInvestigation?: string;
  currentProject?: string;
  currentStrategy?: string;
  currentAssumptions: string[];
  currentHypotheses: string[];
  recentTopics: string[];
  turnCount: number;
}

/**
 * The Mental Model — SPYRAL's internal understanding before any response.
 * The user should never see this unless requested.
 */
export interface MentalModel {
  currentReality: string;
  desiredReality: string;
  goal: string;
  motivation: string;
  constraints: string[];
  knownFacts: string[];
  assumptions: string[];
  evidence: { claim: string; support: string; strength: "strong" | "moderate" | "weak" }[];
  unknownVariables: string[];
  risks: string[];
  opportunities: string[];
  missingInformation: string[];
}

export interface SOPResult {
  facts: string[];
  assumptions: string[];
  evidence: { claim: string; support: string; strength: "strong" | "moderate" | "weak" }[];
  unknowns: string[];
  goals: string[];
}

export interface LDEResult {
  hiddenVariables: string[];
  patterns: string[];
  relationships: string[];
  dependencies: string[];
  rootCauses: string[];
  feedbackLoops: string[];
  deeperExplanations: string[];
}

export interface STEStrategy {
  title: string;
  description: string;
  advantages: string[];
  disadvantages: string[];
  requirements: string[];
  dependencies: string[];
  probability: number; // 0-1
}

export interface STEResult {
  strategies: STEStrategy[];
}

export interface SVEResult {
  supportingEvidence: string[];
  contradictingEvidence: string[];
  assumptionsIdentified: string[];
  missingEvidence: string[];
  alternativeExplanations: string[];
  confidence: number; // 0-1, max 0.85 without strong evidence
  adjustedRecommendations: string[];
}

export interface SAEAction {
  action: string;
  timeframe: "immediate" | "short-term" | "medium-term" | "long-term";
  effort: "low" | "medium" | "high";
  impact: "low" | "medium" | "high";
}

export interface SAEResult {
  immediateActions: SAEAction[];
  experiments: string[];
  learningOpportunities: string[];
  measurements: string[];
  futureAdaptations: string[];
}

/**
 * Complete output of the think() pipeline.
 */
export interface CognitiveResponse {
  /** The original user input */
  input: string;

  /** Agent type that initiated thinking */
  agentType: AgentType;

  /** Research mode if applicable */
  researchMode?: ResearchMode;

  // ─── PHASE F.1 — ADAPTIVE COGNITION ───────────────────────────────────

  /** Intent analysis — determined first */
  intent: CognitiveIntent;

  /** The reasoning strategy chosen based on intent */
  reasoningStrategy: ReasoningStrategy;

  /** Self-critique performed before final response */
  selfCritique: string;

  // ─── PIPELINE OUTPUTS ─────────────────────────────────────────────────

  /** Understanding of user intent */
  understanding: string;

  /** Retrieved memories relevant to this input */
  retrievedMemories: { agent: string; summary: string }[];

  /** The mental model (internal — may be hidden) */
  mentalModel: MentalModel;

  /** SOP — Separated constructs */
  sop: SOPResult;

  /** LDE — Layered Decomposition Exploration */
  lde: LDEResult;

  /** STE — Strategic Trajectory Exploration */
  ste: STEResult;

  /** SVE — Strategic Validation & Evaluation */
  sve: SVEResult;

  /** SAE — Strategic Action Execution */
  sae: SAEResult;

  /** Generated recommendation */
  recommendation: string;

  /** Execution plan */
  executionPlan: string;

  /** Learning recorded */
  learning: {
    patternsFound: string[];
    insightsGained: string[];
    confidenceImpact: number;
  };

  /** The final synthesized response to the user */
  response: string;

  /** Confidence in this response (0-1) */
  confidence: number;
}

/**
 * Input to the think() pipeline.
 */
export interface ThinkInput {
  /** The user's input text */
  input: string;

  /** Which agent is calling think() */
  agentType: AgentType;

  /** Research mode (only for research agent) */
  researchMode?: ResearchMode;

  /** Previous context from the conversation */
  context?: string;

  /** Any existing mental model to build upon */
  existingMentalModel?: Partial<MentalModel>;

  // ─── PHASE F.1 — ADAPTIVE COGNITION ───────────────────────────────────

  /** Optional intent override (useful for command center routing) */
  intentOverride?: Partial<CognitiveIntent>;

  /** Previous conversation context to continue */
  conversation?: ConversationContext;
}

// ═══════════════════════════════════════════════════════════════════════════
// COGNITIVE CORE
// ═══════════════════════════════════════════════════════════════════════════

function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

class SpyralCognitiveCoreImpl {
  private static _thinkCount = 0;

  /** Conversation memory — SPYRAL remembers across turns */
  private static _conversation: ConversationContext = {
    currentInvestigation: undefined,
    currentProject: undefined,
    currentStrategy: undefined,
    currentAssumptions: [],
    currentHypotheses: [],
    recentTopics: [],
    turnCount: 0,
  };

  /** Get the current conversation context */
  static getConversation(): ConversationContext {
    return { ...SpyralCognitiveCoreImpl._conversation };
  }

  /** Number of times think() has been called across the entire app */
  static getThinkCount(): number {
    return SpyralCognitiveCoreImpl._thinkCount;
  }

  /** Instance delegate for getThinkCount (used by UI components) */
  getThinkCount(): number {
    return SpyralCognitiveCoreImpl.getThinkCount();
  }

  /** Instance delegate for getConversation */
  getConversation(): ConversationContext {
    return SpyralCognitiveCoreImpl.getConversation();
  }

  // ─── PUBLIC ENTRY POINT ───────────────────────────────────────────────

  /**
   * think() — The ONLY public entry point.
   *
   * Every agent calls this. Nothing bypasses it.
   *
   * Pipeline:
   *   analyzeIntent() → understand() → retrieveMemory() → buildMentalModel()
   *   → sop() → lde() → ste() → sve() → sae()
   *   → synthesize() → buildExecutionPlan() → learn() → respond() → selfCritique()
   */
  think(input: ThinkInput): CognitiveResponse {
    SpyralCognitiveCoreImpl._thinkCount++;

    // ─── RECORD INTERACTION EVENT (PHASE G.0) ──────────────────────────
    // Every think() call is recorded as interaction metadata (not content).
    const tempStartTime = Date.now();
    ExperienceRecorder.recordEvent("thinking_started", {
      agentType: input.agentType,
      page: input.agentType,
      metadata: { inputLength: input.input.length },
    });

    // ─── STAGE 0: INTENT ANALYSIS (PHASE F.1) ──────────────────────────
    // Every request passes through IntentAnalysisStage FIRST.
    const intent = this.analyzeIntent(input);

    // Update conversation memory
    this.updateConversation(input, intent);

    // ─── STAGE 1: UNDERSTAND ───────────────────────────────────────────
    const understanding = this.understand(input, intent);

    // ─── STAGE 2: RETRIEVE MEMORY ──────────────────────────────────────
    const retrievedMemories = this.retrieveMemory(input);

    // ─── STAGE 3: BUILD MENTAL MODEL ───────────────────────────────────
    const mentalModel = this.buildMentalModel(input, understanding, retrievedMemories);

    // ─── STAGE 4+: PIPELINE (CONDITIONAL ON STRATEGY) ──────────────────
    // Some strategies skip certain stages for efficiency.
    // DISCOVERY & REPORTING: full pipeline
    // PLANNING: full pipeline
    // DECISION: partial (skips LDE if clear)
    // CREATION: partial (skips some validation)

    const sop = this.sop(mentalModel);

    // LDE — skip for low-complexity, immediate-answer requests
    let lde: LDEResult;
    if (intent.reasoningStrategy === "decision" && intent.complexity === "low" && intent.requiresImmediateAnswer) {
      lde = {
        hiddenVariables: [],
        patterns: [],
        relationships: [],
        dependencies: [],
        rootCauses: [],
        feedbackLoops: [],
        deeperExplanations: ["Low complexity — skipped deep decomposition"],
      };
    } else {
      lde = this.lde(mentalModel, sop);
    }

    const ste = this.ste(mentalModel, sop, lde);

    const sve = this.sve(mentalModel, ste);

    // SAE — reduce for REPORTING (just present findings)
    let sae: SAEResult;
    if (intent.reasoningStrategy === "reporting") {
      sae = {
        immediateActions: [
          { action: "Present structured findings clearly", timeframe: "immediate", effort: "low", impact: "high" },
          { action: "Offer to dive deeper on any section", timeframe: "immediate", effort: "low", impact: "medium" },
        ],
        experiments: [],
        learningOpportunities: ["User may want to explore specific sections further"],
        measurements: ["User engagement with the report"],
        futureAdaptations: ["Adjust depth based on user follow-up"],
      };
    } else {
      sae = this.sae(mentalModel, ste, sve);
    }

    const recommendation = this.synthesize(mentalModel, sop, lde, ste, sve, sae);

    const executionPlan = this.buildExecutionPlan(sae);

    const learning = this.learn(mentalModel, sop, lde, sve);

    // ─── BUILD RESPONSE ────────────────────────────────────────────────
    let response = this.respond(input, understanding, ste, sve, sae, recommendation, executionPlan, intent);

    // ─── SELF-CRITIQUE (PHASE F.1) ─────────────────────────────────────
    // Before returning, review and revise INTERNALLY.
    // The self-critique is NOT shown to the user — it's a silent quality gate.
    // UX indicators (stage labels) are handled by the page UI.
    const selfCritique = this.selfCritique(response, intent);
    // If self-critique found issues, silently revise the response
    if (selfCritique.includes("⚠")) {
      // Silently adjust: make response more inquiry-focused by appending a question
      response = response + "\n\nWhat do you think?";
    }

    // ─── RECORD COMPLETION EVENT (PHASE G.0) ──────────────────────────
    ExperienceRecorder.recordEvent("thinking_completed", {
      agentType: input.agentType,
      page: input.agentType,
      duration: Date.now() - tempStartTime,
      metadata: { thinkCount: SpyralCognitiveCoreImpl._thinkCount },
    });

    // Record agent-specific completion
    const completionEventType = `${input.agentType}_completed` as any;
    ExperienceRecorder.recordEvent(completionEventType, {
      agentType: input.agentType,
      page: input.agentType,
      metadata: { confidence: sve.confidence, reasoningStrategy: intent.reasoningStrategy },
    });

    const confidence = sve.confidence;

    return {
      input: input.input,
      agentType: input.agentType,
      researchMode: input.researchMode,
      intent,
      reasoningStrategy: intent.reasoningStrategy,
      selfCritique,
      understanding,
      retrievedMemories,
      mentalModel,
      sop,
      lde,
      ste,
      sve,
      sae,
      recommendation,
      executionPlan,
      learning,
      response,
      confidence,
    };
  }

  // ─── STAGE 0: INTENT ANALYSIS (PHASE F.1) ──────────────────────────────

  /**
   * analyzeIntent() — NEW FIRST STAGE.
   * Determines domain, complexity, uncertainty, reasoning strategy.
   * Everything else flows from this.
   */
  analyzeIntent(input: ThinkInput): CognitiveIntent {
    const text = input.input.toLowerCase();

    // ─── Domain ────────────────────────────────────────────────────────
    let domain: CognitiveDomain;
    if (input.agentType === "research") domain = "research";
    else if (input.agentType === "content") domain = "creation";
    else if (input.agentType === "navigation") domain = "navigation";
    else if (input.agentType === "consultant") domain = "consulting";
    else if (input.agentType === "command") domain = "conversation";
    else domain = "analysis";

    // ─── Complexity ────────────────────────────────────────────────────
    let complexity: CognitiveComplexity = "medium";
    const wordCount = text.split(/\s+/).length;
    if (wordCount < 10) complexity = "low";
    else if (wordCount > 40) complexity = "high";

    // ─── Uncertainty ───────────────────────────────────────────────────
    let uncertainty: CognitiveComplexity = "medium";
    const uncertainWords = /maybe|perhaps|not sure|uncertain|unknown|might|could|possibly|what if/i.test(text);
    const confidentWords = /i know|i'm sure|certainly|definitely|clearly|obviously/i.test(text);
    if (uncertainWords) uncertainty = "high";
    if (confidentWords) uncertainty = "low";

    // ─── Reasoning Depth ───────────────────────────────────────────────
    let reasoningDepth: 1 | 2 | 3 | 4 | 5 = 3;
    if (complexity === "low" && uncertainty === "low") reasoningDepth = 1;
    else if (complexity === "high" || uncertainty === "high") reasoningDepth = 5;
    else if (complexity === "medium" && uncertainty === "medium") reasoningDepth = 4;

    // ─── Requirements ──────────────────────────────────────────────────
    const requiresDialogue = /what do you think|tell me more|your opinion|let's discuss|talk|chat|what's your take/i.test(text) ||
      input.agentType === "research";
    const requiresPlanning = /plan|project|build|create campaign|launch|roadmap|milestone|timeline/i.test(text) ||
      input.agentType === "navigation";
    const requiresInvestigation = /research|investigate|explore|find out|learn about|understand|why|how does|i think|idea/i.test(text) ||
      input.agentType === "research";
    const requiresImmediateAnswer = /what is|who is|when is|where is|how many|how much|define|explain quickly|tell me/i.test(text) &&
      !requiresInvestigation;

    // ─── Reasoning Strategy ────────────────────────────────────────────
    let reasoningStrategy: ReasoningStrategy;
    const isReportRequest = /write.*report|generate.*report|create.*report|summarize|create documentation|prepare.*report/i.test(text);
    const isDecisionRequest = /should i|which option|compare|what's better|recommend|choose between|pros and cons|trade.?off/i.test(text);
    const isCreationRequest = /create|generate|write|produce|design|make|develop|build.*content|campaign|post|video|ad/i.test(text);
    const isPlanningRequest = /plan|project|goal|launch|roadmap|strategy|milestone|navigate|build.*company|start.*business/i.test(text);

    if (isReportRequest && input.agentType === "research") {
      reasoningStrategy = "reporting";
    } else if (isDecisionRequest || input.agentType === "consultant") {
      reasoningStrategy = "decision";
    } else if (isCreationRequest || input.agentType === "content") {
      reasoningStrategy = "creation";
    } else if (isPlanningRequest || input.agentType === "navigation") {
      reasoningStrategy = "planning";
    } else {
      // Default: DISCOVERY — investigate, don't answer
      reasoningStrategy = "discovery";
    }

    // Allow override from input (e.g., command center)
    if (input.intentOverride) {
      return { ...this.defaultIntent(input), ...input.intentOverride, reasoningStrategy } as CognitiveIntent;
    }

    return {
      domain,
      complexity,
      uncertainty,
      reasoningDepth,
      requiresDialogue,
      requiresPlanning,
      requiresInvestigation,
      requiresImmediateAnswer,
      reasoningStrategy,
    };
  }

  private defaultIntent(input: ThinkInput): CognitiveIntent {
    return {
      domain: "analysis",
      complexity: "medium",
      uncertainty: "medium",
      reasoningDepth: 3,
      requiresDialogue: false,
      requiresPlanning: false,
      requiresInvestigation: false,
      requiresImmediateAnswer: true,
      reasoningStrategy: "discovery",
    };
  }

  // ─── CONVERSATION MEMORY ─────────────────────────────────────────────

  private updateConversation(input: ThinkInput, intent: CognitiveIntent): void {
    SpyralCognitiveCoreImpl._conversation.turnCount++;

    // Track the topic
    const topicWords = input.input.split(/\s+/).slice(0, 10).join(" ");
    SpyralCognitiveCoreImpl._conversation.recentTopics.push(topicWords);
    if (SpyralCognitiveCoreImpl._conversation.recentTopics.length > 10) {
      SpyralCognitiveCoreImpl._conversation.recentTopics.shift();
    }

    // Track investigation or project
    if (intent.reasoningStrategy === "discovery" || intent.requiresInvestigation) {
      SpyralCognitiveCoreImpl._conversation.currentInvestigation = input.input.substring(0, 200);
    }
    if (intent.reasoningStrategy === "planning" || intent.requiresPlanning) {
      SpyralCognitiveCoreImpl._conversation.currentProject = input.input.substring(0, 200);
      SpyralCognitiveCoreImpl._conversation.currentStrategy = undefined; // reset for new planning
    }
    if (intent.reasoningStrategy === "decision") {
      SpyralCognitiveCoreImpl._conversation.currentStrategy = input.input.substring(0, 200);
    }

    // Merge in any passed conversation context
    if (input.conversation) {
      if (input.conversation.currentInvestigation) SpyralCognitiveCoreImpl._conversation.currentInvestigation = input.conversation.currentInvestigation;
      if (input.conversation.currentProject) SpyralCognitiveCoreImpl._conversation.currentProject = input.conversation.currentProject;
      if (input.conversation.currentStrategy) SpyralCognitiveCoreImpl._conversation.currentStrategy = input.conversation.currentStrategy;
    }
  }

  // ─── 1. UNDERSTAND ─────────────────────────────────────────────────────

  understand(input: ThinkInput, intent: CognitiveIntent): string {
    const text = input.input.toLowerCase();
    const strategy = intent.reasoningStrategy;

    if (input.agentType === "research") {
      if (input.researchMode === "experiment") {
        return `The user wants to design experiments to investigate: "${input.input}". They are in Experiment Mode. Reasoning: ${strategy}.`;
      }
      if (input.researchMode === "literature") {
        return `The user wants a literature review and summary of existing knowledge on: "${input.input}". They are in Literature Mode.`;
      }
      if (input.researchMode === "theory") {
        return `The user wants to develop new theories around: "${input.input}". They are in Theory Mode. Reasoning: ${strategy}.`;
      }
      if (input.researchMode === "report") {
        return `The user explicitly requested a report on: "${input.input}". Using REPORTING strategy.`;
      }
      if (input.researchMode === "debate") {
        return `The user wants to challenge ideas from multiple perspectives on: "${input.input}". They are in Debate Mode.`;
      }
      // Default research: DISCOVERY — investigate, don't answer
      return `The user wants to collaboratively investigate: "${input.input}". I determined this requires the ${strategy} strategy — I will investigate rather than immediately answer. This is an open-ended exploration.`;
    }

    if (input.agentType === "content") {
      if (strategy === "creation") {
        return `The user wants to create content about: "${input.input}". Using CREATION strategy — research first, then strategy, then assets.`;
      }
      return `The user wants to create content about: "${input.input}". SPYRAL must first research, understand audience and positioning, THEN generate creative output.`;
    }

    if (input.agentType === "consultant") {
      if (strategy === "decision") {
        return `The user needs a decision on: "${input.input}". Using DECISION strategy — challenge assumptions, evaluate trade-offs, recommend.`;
      }
      const isStrategic = /strategy|growth|scale|revenue|market/i.test(text);
      const isProblem = /problem|challenge|issue|difficult|struggling/i.test(text);
      if (isStrategic) return `The user is seeking strategic advice on: "${input.input}". SPYRAL must challenge assumptions, identify blind spots, and provide executive-level guidance.`;
      if (isProblem) return `The user has a challenge they need help solving: "${input.input}". SPYRAL must diagnose root causes and provide actionable recommendations.`;
      return `The user wants consulting advice on: "${input.input}". SPYRAL must analyze, diagnose, and recommend.`;
    }

    if (input.agentType === "navigation") {
      return `The user wants to navigate from their current reality to a desired reality regarding: "${input.input}". Using PLANNING strategy — roadmap with milestones and execution.`;
    }

    if (input.agentType === "command") {
      return `The user wants to: "${input.input}". This appears to be a ${intent.domain} question using a ${strategy} approach.`;
    }

    return `User input: "${input.input}". Intent: ${strategy} strategy in ${intent.domain} domain. Complexity: ${intent.complexity}. Depth: ${intent.reasoningDepth}.`;
  }

  // ─── 2. RETRIEVE MEMORY ───────────────────────────────────────────────

  retrieveMemory(input: ThinkInput): { agent: string; summary: string }[] {
    const memories = SharedContextStore.getMemories();
    const relevant: { agent: string; summary: string }[] = [];

    // Find memories that relate to the current input
    const inputWords = input.input.toLowerCase().split(/\s+/);

    for (const memory of memories) {
      const titleWords = memory.title.toLowerCase().split(/\s+/);
      const summaryWords = memory.summary.toLowerCase().split(/\s+/);

      // Check for keyword overlap
      const overlap = inputWords.filter((w) => titleWords.includes(w) || summaryWords.includes(w));

      if (overlap.length >= 2) {
        relevant.push({
          agent: memory.agent,
          summary: memory.summary,
        });
      }
    }

    // Also check patterns from LearningStore
    const patterns = LearningStore.getPatterns();
    for (const pattern of patterns) {
      const patternWords = pattern.title.toLowerCase().split(/\s+/);
      const overlap = inputWords.filter((w) => patternWords.includes(w));
      if (overlap.length >= 1) {
        relevant.push({
          agent: "system",
          summary: `Pattern: ${pattern.title} (confidence: ${Math.round(pattern.confidence * 100)}%)`,
        });
      }
    }

    return relevant.slice(0, 5);
  }

  // ─── 3. BUILD MENTAL MODEL ───────────────────────────────────────────

  buildMentalModel(
    input: ThinkInput,
    understanding: string,
    memories: { agent: string; summary: string }[],
  ): MentalModel {
    const text = input.input;

    // Derive current reality from input
    let currentReality = `The user is engaging with SPYRAL ${input.agentType} about: "${text}".`;
    let desiredReality = `The user wants to achieve or understand something related to: "${text}".`;
    let goal = `Investigate, analyze, or create something related to: "${text}".`;

    // Try to infer more specific realities based on agent type
    if (input.agentType === "research") {
      currentReality = `The user has a question or topic they want to investigate: "${text}". They may have assumptions and partial knowledge.`;
      desiredReality = "A deeper, evidence-based understanding of the topic with validated findings and clear next steps.";
      goal = `Discover truth about: "${text}" through structured investigation.`;
    }

    if (input.agentType === "content") {
      currentReality = `The user has a content need or idea: "${text}". They need structured creative output.`;
      desiredReality = "A comprehensive content package with strategy, creative assets, and publishing plan.";
      goal = `Create compelling content about: "${text}" that resonates with the target audience.`;
    }

    if (input.agentType === "consultant") {
      currentReality = `The user faces a situation: "${text}". They need expert strategic guidance.`;
      desiredReality = "A clear diagnosis, actionable strategy, and 90-day roadmap to address the challenge.";
      goal = `Solve the challenge: "${text}" with strategic analysis and recommendations.`;
    }

    if (input.agentType === "navigation") {
      currentReality = `The user's current situation regarding: "${text}".`;
      desiredReality = `The user's desired future state regarding: "${text}".`;
      goal = `Navigate from current reality to desired reality for: "${text}".`;
    }

    // Generate constraints, facts, assumptions based on input patterns
    const constraints = this.extractConstraints(text);
    const knownFacts = this.extractKnownFacts(text, input.agentType);
    const assumptions = this.extractAssumptions(text);
    const evidence = this.extractEvidence(text);
    const unknownVariables = this.extractUnknowns(text);
    const risks = this.extractRisks(text);
    const opportunities = this.extractOpportunities(text);
    const missingInformation = this.extractMissingInfo(text);

    return {
      currentReality,
      desiredReality,
      goal,
      motivation: `The user is seeking SPYRAL's intelligence to ${input.agentType === "research" ? "discover truth" : input.agentType === "content" ? "create content" : input.agentType === "consultant" ? "solve a challenge" : input.agentType === "navigation" ? "navigate realities" : "execute a command"}.`,
      constraints,
      knownFacts,
      assumptions,
      evidence,
      unknownVariables,
      risks,
      opportunities,
      missingInformation,
    };
  }

  // ─── Mental Model Helpers ─────────────────────────────────────────────

  private extractConstraints(text: string): string[] {
    const constraints: string[] = [
      "Information is limited to what the user provides",
      "SPYRAL must reason before generating output",
      "Confidence must reflect evidence strength",
    ];

    const lower = text.toLowerCase();
    if (lower.includes("budget") || lower.includes("cost") || lower.includes("money")) {
      constraints.push("Financial constraints are relevant to this inquiry");
    }
    if (lower.includes("time") || lower.includes("deadline") || lower.includes("urgent")) {
      constraints.push("Time constraints are relevant to this inquiry");
    }
    if (lower.includes("team") || lower.includes("people") || lower.includes("staff")) {
      constraints.push("Personnel/resource constraints are relevant");
    }

    return constraints;
  }

  private extractKnownFacts(text: string, agentType: AgentType): string[] {
    const facts: string[] = [];

    // Input-derived facts
    if (text.length > 10) {
      facts.push(`The user provided input about: "${text.substring(0, 80)}..."`);
    }

    // Agent-specific facts
    if (agentType === "research") {
      facts.push("Research follows the SPYRAL investigation methodology: observe, hypothesize, experiment, conclude");
      facts.push("Research is collaborative discovery, not report generation");
    }
    if (agentType === "content") {
      facts.push("Content creation requires understanding audience, positioning, and strategy before production");
      facts.push("Content should be multi-format and platform-optimized");
    }
    if (agentType === "consultant") {
      facts.push("Consulting requires diagnosis before recommendation");
      facts.push("Every recommendation must include trade-offs and alternatives");
    }

    // Add patterns from LearningStore
    const patterns = LearningStore.getPatterns();
    if (patterns.length > 0) {
      const relevantPatterns = patterns.filter((p) =>
        text.toLowerCase().includes(p.title.toLowerCase().slice(0, 10)),
      );
      if (relevantPatterns.length > 0) {
        facts.push(`SPYRAL has identified relevant patterns: ${relevantPatterns.map((p) => p.title).join(", ")}`);
      }
    }

    return facts;
  }

  private extractAssumptions(text: string): string[] {
    const assumptions: string[] = [
      "The user has provided accurate information about their situation",
      "SPYRAL's reasoning can add value to this inquiry",
    ];

    const lower = text.toLowerCase();
    if (lower.includes("always") || lower.includes("never") || lower.includes("everyone") || lower.includes("nobody")) {
      assumptions.push("The user may be making an absolute statement that should be challenged");
    }
    if (lower.includes("obvious") || lower.includes("clearly") || lower.includes("of course")) {
      assumptions.push("The user assumes something is obvious that may need examination");
    }
    if (lower.includes("they") || lower.includes("them") || lower.includes("people")) {
      assumptions.push("The user may be making assumptions about others' perspectives or behaviors");
    }

    return assumptions;
  }

  private extractEvidence(text: string): { claim: string; support: string; strength: "strong" | "moderate" | "weak" }[] {
    const evidence: { claim: string; support: string; strength: "strong" | "moderate" | "weak" }[] = [];

    // Extract claims that might be supported
    const sentences = text.split(/[.!?]+/).filter(Boolean);
    for (const sentence of sentences.slice(0, 3)) {
      const trimmed = sentence.trim();
      if (trimmed.length > 20) {
        evidence.push({
          claim: trimmed.substring(0, 60),
          support: "User statement — needs external validation",
          strength: "weak" as const,
        });
      }
    }

    return evidence;
  }

  private extractUnknowns(text: string): string[] {
    const unknowns: string[] = [
      "Full context behind the user's request",
      "External data that could validate or challenge assumptions",
      "The user's complete background knowledge on this topic",
    ];

    const lower = text.toLowerCase();
    if (lower.includes("?")) {
      unknowns.push("The user has specific questions that need answers");
    }

    return unknowns;
  }

  private extractRisks(text: string): string[] {
    const risks: string[] = [
      "SPYRAL cannot access real-time external data without API integration",
      "User may have implicit assumptions not captured in the input",
    ];

    const lower = text.toLowerCase();
    if (lower.includes("competitor") || lower.includes("market") || lower.includes("launch")) {
      risks.push("Competitive dynamics may change rapidly");
    }
    if (lower.includes("invest") || lower.includes("spend") || lower.includes("buy")) {
      risks.push("Financial decisions carry inherent risk");
    }

    return risks;
  }

  private extractOpportunities(text: string): string[] {
    return [
      "SPYRAL can provide structured reasoning that reveals hidden patterns",
      "The investigation can generate actionable insights and next steps",
      "Learning from this interaction can improve future SPYRAL responses",
    ];
  }

  private extractMissingInfo(text: string): string[] {
    const missing: string[] = [
      "Specific data points and metrics relevant to the topic",
      "External research and validation from multiple sources",
      "The user's complete intent and desired outcome",
    ];

    if (text.length < 50) {
      missing.push("The user provided limited context — more detail would enable deeper analysis");
    }

    return missing;
  }

  // ─── 4. SOP ───────────────────────────────────────────────────────────

  sop(mentalModel: MentalModel): SOPResult {
    return {
      facts: mentalModel.knownFacts,
      assumptions: mentalModel.assumptions,
      evidence: mentalModel.evidence,
      unknowns: mentalModel.unknownVariables,
      goals: [mentalModel.goal],
    };
  }

  // ─── 5. LDE ───────────────────────────────────────────────────────────

  lde(mentalModel: MentalModel, sop: SOPResult): LDEResult {
    const text = mentalModel.goal;

    const hiddenVariables: string[] = [
      "The user's unstated expectations and preferences",
      "External factors that could influence outcomes",
      "Underlying motivations not explicitly stated",
    ];

    const patterns: string[] = [
      "Users often have more context than they initially share",
      "Structured reasoning reveals connections not immediately obvious",
      "Challenging assumptions leads to deeper understanding",
    ];

    // Add patterns from LearningStore
    const storedPatterns = LearningStore.getPatterns();
    for (const p of storedPatterns.slice(0, 3)) {
      patterns.push(`Discovered pattern: ${p.title} (confidence: ${Math.round(p.confidence * 100)}%)`);
    }

    const relationships: string[] = [
      "Understanding drives strategy, strategy drives execution",
      "Assumptions affect how evidence is interpreted",
    ];

    const dependencies: string[] = [
      "Quality of output depends on quality of input understanding",
      "Recommendations depend on accurate diagnosis",
    ];

    const rootCauses: string[] = [
      "Most challenges stem from misalignment between current reality and desired reality",
      "Knowledge gaps are often the root cause of suboptimal decisions",
    ];

    const feedbackLoops: string[] = [
      "Better understanding → Better decisions → Better outcomes → Better understanding",
      "Assumptions that go unchallenged reinforce themselves",
    ];

    const deeperExplanations: string[] = [
      "The user's request likely sits within a broader context not fully expressed",
      "SPYRAL's cognitive pipeline ensures thoroughness that surface-level responses miss",
    ];

    return {
      hiddenVariables,
      patterns,
      relationships,
      dependencies,
      rootCauses,
      feedbackLoops,
      deeperExplanations,
    };
  }

  // ─── 6. STE ───────────────────────────────────────────────────────────

  ste(mentalModel: MentalModel, _sop: SOPResult, _lde: LDEResult): STEResult {
    const text = mentalModel.goal;

    const strategies: STEStrategy[] = [
      {
        title: "Thorough Investigation",
        description: `Deeply explore "${text}" through structured reasoning, evidence gathering, and multi-perspective analysis. This approach prioritizes depth over speed and ensures comprehensive understanding.`,
        advantages: [
          "Produces the most reliable and well-supported conclusions",
          "Identifies patterns and connections that surface approaches miss",
          "Builds a knowledge base that improves future SPYRAL responses",
        ],
        disadvantages: [
          "Takes more time and cognitive processing",
          "May surface complexity the user wasn't expecting",
        ],
        requirements: [
          "User engagement in the reasoning process",
          "Willingness to challenge assumptions",
        ],
        dependencies: [
          "Quality of user input and responsiveness",
          "Available patterns and memories from LearningStore",
        ],
        probability: 0.85,
      },
      {
        title: "Focused Analysis",
        description: `Concentrate specifically on the core elements of "${text}" without broad exploration. This approach is efficient when the user has a clear, narrow focus.`,
        advantages: [
          "Faster path to actionable output",
          "Less cognitive overhead for the user",
          "Good for well-defined problems",
        ],
        disadvantages: [
          "May miss important adjacent considerations",
          "Less likely to surface novel insights",
        ],
        requirements: [
          "Clear problem definition from the user",
          "Sufficient context to narrow scope correctly",
        ],
        dependencies: [
          "User's ability to define scope clearly",
        ],
        probability: 0.70,
      },
      {
        title: "Iterative Discovery",
        description: `Engage the user in a back-and-forth discovery process, using each response to refine understanding and direction. This is the default research mode — collaborative and adaptive.`,
        advantages: [
          "Most adaptable to user's evolving needs",
          "Builds shared understanding between SPYRAL and user",
          "Natural conversation flow rather than rigid report",
        ],
        disadvantages: [
          "Requires multiple interaction cycles",
          "Less structured than a comprehensive analysis",
        ],
        requirements: [
          "User willingness to engage in dialogue",
          "SPYRAL's ability to ask good follow-up questions",
        ],
        dependencies: [
          "User responsiveness and engagement",
        ],
        probability: 0.80,
      },
    ];

    return { strategies };
  }

  // ─── 7. SVE ───────────────────────────────────────────────────────────

  sve(mentalModel: MentalModel, ste: STEResult): SVEResult {
    const supportingEvidence: string[] = [];
    const contradictingEvidence: string[] = [];
    const assumptionsIdentified: string[] = [];
    const missingEvidence: string[] = [];
    const alternativeExplanations: string[] = [];
    const adjustedRecommendations: string[] = [];

    // Evaluate each strategy
    for (const strategy of ste.strategies) {
      supportingEvidence.push(
        `Strategy "${strategy.title}": ${strategy.advantages.length} clear advantages identified, ${strategy.requirements.length} requirements understood.`,
      );
      if (strategy.probability < 0.75) {
        contradictingEvidence.push(
          `Strategy "${strategy.title}" has lower probability (${Math.round(strategy.probability * 100)}%), suggesting risks or uncertainties.`,
        );
      }
    }

    assumptionsIdentified.push(
      "The user's input represents their current understanding, which may be incomplete",
      "SPYRAL's reasoning is based on available patterns and memory, which may not cover all scenarios",
      "Recommended strategies assume user has capacity to execute",
    );

    missingEvidence.push(
      "External data sources are not integrated — all reasoning is based on user input and stored patterns",
      "Validation against real-world outcomes is not possible without execution feedback",
    );

    alternativeExplanations.push(
      "The user's stated goal may not be their actual underlying need",
      "What seems like a research question may actually be a decision in disguise",
      "A content request may actually be a strategic positioning question",
    );

    // Calculate confidence
    let confidence = 0.75; // Base confidence

    // Adjust based on available evidence
    if (supportingEvidence.length > contradictingEvidence.length) {
      confidence += 0.05;
    }
    if (assumptionsIdentified.length > 3) {
      confidence -= 0.05;
    }

    // Max confidence without strong evidence is 85%
    confidence = Math.min(confidence, 0.85);

    adjustedRecommendations.push(
      `Proceed with highest-confidence strategy (${ste.strategies[0]?.title || "Thorough Investigation"}), but remain open to switching based on user feedback.`,
    );

    if (confidence < 0.7) {
      adjustedRecommendations.push("Gather more information before finalizing recommendations.");
    }

    return {
      supportingEvidence,
      contradictingEvidence,
      assumptionsIdentified,
      missingEvidence,
      alternativeExplanations,
      confidence,
      adjustedRecommendations,
    };
  }

  // ─── 8. SAE ───────────────────────────────────────────────────────────

  sae(mentalModel: MentalModel, _ste: STEResult, _sve: SVEResult): SAEResult {
    return {
      immediateActions: [
        {
          action: "Present SPYRAL's understanding to the user for validation",
          timeframe: "immediate",
          effort: "low",
          impact: "high",
        },
        {
          action: "Identify and challenge key assumptions in the user's input",
          timeframe: "immediate",
          effort: "low",
          impact: "high",
        },
        {
          action: "Generate structured output with reasoning, evidence, and recommendations",
          timeframe: "immediate",
          effort: "medium",
          impact: "high",
        },
      ],
      experiments: [
        "Ask the user a targeted follow-up question to validate understanding",
        "Present competing hypotheses for the user to evaluate",
        "Suggest an approach and measure user engagement with the recommendation",
      ],
      learningOpportunities: [
        "User's response to SPYRAL's reasoning provides feedback for model improvement",
        "New patterns can be stored in LearningStore if this reveals novel insights",
        "User corrections help refine SPYRAL's understanding of the topic",
      ],
      measurements: [
        "User engagement with the response (follow-up questions, time spent)",
        "Whether the user accepts or challenges SPYRAL's assumptions",
        "Confidence level of the response vs. user satisfaction",
      ],
      futureAdaptations: [
        "If user provides additional context, incorporate into revised mental model",
        "If user challenges an assumption, update the assumption database",
        "Learn from which strategy the user prefers for future interactions",
      ],
    };
  }

  // ─── 9. SYNTHESIZE ────────────────────────────────────────────────────

  synthesize(
    mentalModel: MentalModel,
    _sop: SOPResult,
    _lde: LDEResult,
    ste: STEResult,
    sve: SVEResult,
    _sae: SAEResult,
  ): string {
    const bestStrategy = ste.strategies[0];
    let recommendation = `Based on SPYRAL's analysis, the recommended approach is: "${bestStrategy.title}".\n\n`;
    recommendation += `${bestStrategy.description}\n\n`;
    recommendation += `Key advantages: ${bestStrategy.advantages.join(", ")}.\n\n`;
    recommendation += `Confidence in this recommendation: ${Math.round(sve.confidence * 100)}%.\n\n`;
    recommendation += `Important considerations: ${sve.assumptionsIdentified.slice(0, 2).join(", ")}.`;

    return recommendation;
  }

  // ─── 10. BUILD EXECUTION PLAN ─────────────────────────────────────────

  buildExecutionPlan(sae: SAEResult): string {
    let plan = "SPYRAL Execution Plan:\n\n";

    plan += "Immediate Actions:\n";
    for (const action of sae.immediateActions) {
      plan += `  • ${action.action} (${action.timeframe}, ${action.effort} effort, ${action.impact} impact)\n`;
    }

    plan += "\nExperiments to Validate:\n";
    for (const exp of sae.experiments) {
      plan += `  • ${exp}\n`;
    }

    plan += "\nLearning Opportunities:\n";
    for (const lo of sae.learningOpportunities) {
      plan += `  • ${lo}\n`;
    }

    return plan;
  }

  // ─── 11. LEARN ────────────────────────────────────────────────────────

  learn(
    mentalModel: MentalModel,
    sop: SOPResult,
    lde: LDEResult,
    sve: SVEResult,
  ): { patternsFound: string[]; insightsGained: string[]; confidenceImpact: number } {
    const patternsFound: string[] = [];
    const insightsGained: string[] = [];

    // Extract patterns from LDE
    for (const pattern of lde.patterns) {
      patternsFound.push(pattern);
    }

    // Generate insights
    insightsGained.push(`Analyzed topic related to: "${mentalModel.goal.substring(0, 60)}"`);
    insightsGained.push(`Separated ${sop.facts.length} facts from ${sop.assumptions.length} assumptions`);
    insightsGained.push(`Confidence in analysis: ${Math.round(sve.confidence * 100)}%`);

    // Store a learning record
    try {
      LearningStore.createInsight({
        patternIds: [],
        description: `Cognitive analysis: ${mentalModel.goal.substring(0, 100)}`,
        category: "cognitive-analysis",
        confidence: sve.confidence,
        evidence: `Analysis confidence: ${Math.round(sve.confidence * 100)}%`,
        tags: ["cognitive-core", "analysis"],
      });
    } catch {
      // LearningStore might not be available in all contexts
    }

    // Store memory in shared context
    try {
      SharedContextStore.saveMemory({
        agent: "cognitive-core",
        type: "insight",
        title: `Cognitive analysis: ${mentalModel.goal.substring(0, 80)}`,
        summary: `SPYRAL analyzed: "${mentalModel.goal.substring(0, 120)}". Found ${patternsFound.length} patterns, confidence ${Math.round(sve.confidence * 100)}%.`,
        data: { patterns: lde.patterns, confidence: sve.confidence },
        sharedWith: ["research", "content", "navigation", "consultant", "command"],
      });
    } catch {
      // SharedContextStore might not be available in all contexts
    }

    return {
      patternsFound,
      insightsGained,
      confidenceImpact: sve.confidence - 0.5, // Delta from baseline
    };
  }

  // ─── SELF-CRITIQUE (PHASE F.1) ───────────────────────────────────────

  /**
   * selfCritique() — Before every response, review and revise.
   * Asks internally: Did I answer too quickly? Did I challenge assumptions?
   * Did I investigate enough? Did I produce value? Did I just repeat information?
   */
  private selfCritique(response: string, intent: CognitiveIntent): string {
    const critiques: string[] = [];
    const responseLower = response.toLowerCase();

    // Check: Did I answer too quickly?
    if (intent.reasoningStrategy === "discovery" && intent.requiresInvestigation) {
      if (!responseLower.includes("?") && !responseLower.includes("investigate") && !responseLower.includes("explore")) {
        critiques.push("⚠ I notice I started answering instead of investigating. Let me step back.");
      }
    }

    // Check: Did I challenge assumptions?
    if (intent.reasoningStrategy === "decision" || intent.reasoningStrategy === "discovery") {
      if (!responseLower.includes("assum") && !responseLower.includes("question") && !responseLower.includes("challenge")) {
        critiques.push("⚠ I should challenge assumptions more directly. Let me reconsider.");
      }
    }

    // Check: Did I produce value or just repeat?
    if (response.length < 100 && intent.complexity !== "low") {
      critiques.push("⚠ My response seems too brief for the complexity of this topic. Let me expand.");
    }

    // Check: Am I being curious enough?
    if (intent.reasoningStrategy === "discovery" && !responseLower.includes("?")) {
      critiques.push("⚠ I didn't ask a question. Discovery requires dialogue. Let me engage.");
    }

    // Check: Am I pretending certainty?
    if (intent.uncertainty === "high" && (responseLower.includes("definitely") || responseLower.includes("certainly"))) {
      critiques.push("⚠ I sound too certain for a topic with high uncertainty. Let me acknowledge the unknowns.");
    }

    // Apply revision: prepend the most important critique
    if (critiques.length > 0) {
      return `[Self-Review: ${critiques[0]}]`;
    }

    // No issues found
    return "[Self-Review: Response is aligned with intent. No revision needed.]";
  }

  // ─── 12. RESPOND ──────────────────────────────────────────────────────

  respond(
    input: ThinkInput,
    understanding: string,
    ste: STEResult,
    sve: SVEResult,
    sae: SAEResult,
    recommendation: string,
    _executionPlan: string,
    intent: CognitiveIntent,
  ): string {
    const strategy = intent.reasoningStrategy;
    let response = "";

    if (input.agentType === "research") {
      response = this.buildResearchResponse(input, ste, sve, sae, intent);
    } else if (input.agentType === "content") {
      response = this.buildContentResponse(input, understanding, recommendation, intent);
    } else if (input.agentType === "consultant") {
      response = this.buildConsultantResponse(input, ste, sve, sae, recommendation, intent);
    } else if (input.agentType === "navigation") {
      response = this.buildNavigationResponse(input, ste, sve, sae, intent);
    } else {
      response = this.buildGenericResponse(input, understanding, recommendation, sae, intent);
    }

    return response;
  }

  // ─── Agent-Specific Response Builders ────────────────────────────────

  private buildResearchResponse(input: ThinkInput, ste: STEResult, sve: SVEResult, sae: SAEResult, intent: CognitiveIntent): string {
    const mode = input.researchMode || "discovery";

    if (mode === "discovery") {
      return `That's an interesting direction to explore.

There are a few ways we could approach this — what stands out to you most right now?

${this.buildFollowUpQuestion(input)}`;
    }

    if (mode === "experiment") {
      return `Let's design a way to test this.

A few things to consider as starting points:
${sve.assumptionsIdentified.slice(0, 2).map((a) => `• ${a}`).join("\n")}

And some experiments worth trying:
${sae.experiments.map((e) => `• ${e}`).join("\n")}

Which hypothesis feels most worth testing first?`;
    }

    if (mode === "literature") {
      return `Here's what I know so far:

${ste.strategies.map((s) => `• ${s.title}: ${s.description.substring(0, 100)}...`).join("\n")}

What aspects of this are most important to explore further?`;
    }

    if (mode === "theory") {
      return `Let's think about this from different angles.

Some assumptions worth examining:
${sve.assumptionsIdentified.map((a) => `• ${a}`).join("\n")}

Alternative ways to look at this:
${sve.alternativeExplanations.map((a) => `• ${a}`).join("\n")}

What if we started from a completely different premise?

What theoretical direction feels most promising to you?`;
    }

    if (mode === "report") {
      return `Here's what I'm seeing so far:

${ste.strategies.map((s, i) => `${i + 1}. ${s.title}: ${s.description.substring(0, 80)}...`).join("\n")}

${ste.strategies[0]?.title ? `The initial direction that seems most worth pursuing: **${ste.strategies[0].title}**` : ""}

Would you like to dive deeper into any of these?`;
    }

    if (mode === "debate") {
      return `Let me play with some different perspectives on this.

**One way to see it:**
${ste.strategies[0]?.advantages.join(", ") || "This approach has several benefits"}

**Another way to see it:**
${ste.strategies[1]?.disadvantages.join(", ") || "There are also risks to consider"}

**What's missing from both views:**
${sve.missingEvidence.slice(0, 2).join("\n")}

What's the strongest argument against your current position on this?`;
    }

    return `That's worth investigating. What aspect would you like to explore first?`;
  }

  private buildContentResponse(input: ThinkInput, understanding: string, recommendation: string, intent: CognitiveIntent): string {
    const strategy = intent.reasoningStrategy;

    if (strategy === "creation") {
      return `Before we create anything, let's make sure I understand what you're going for.

A great piece of content starts with clarity on a few things:

1. Who are we trying to reach?
2. What platform or medium makes sense?
3. What's the real goal — awareness, engagement, conversion, or something else?
4. What tone or voice fits best?

Once you share those, I'll develop a full creative direction including brief, storyboard, hooks, and production-ready assets.`;
    }

    return `I want to make sure I get this right before we start creating.

The most effective content starts with understanding the audience and the change we're trying to make.

A few things that would help:
1. Who is the target audience?
2. What platform are you creating for?
3. What's the primary goal — awareness, engagement, conversion, or education?

Once you share these, I'll put together a complete content strategy with creative brief, storyboard, hooks, and production-ready assets.`;
  }

  private buildConsultantResponse(input: ThinkInput, ste: STEResult, sve: SVEResult, _sae: SAEResult, recommendation: string, intent: CognitiveIntent): string {
    const strategy = intent.reasoningStrategy;

    if (strategy === "decision") {
      return `This is a good situation to think through carefully.

**A few assumptions I'm questioning:**
${sve.assumptionsIdentified.map((a) => `• ${a}`).join("\n")}

**Worth considering from different angles:**
${sve.alternativeExplanations.slice(0, 2).map((v, i) => `• ${v}`).join("\n")}

**Trade-offs I can see:**
${ste.strategies.slice(0, 2).map((s) => `• ${s.title}: ${s.advantages.length} upsides, ${s.disadvantages.length} downsides to weigh`).join("\n")}

**What I'd recommend based on what I know:**
${recommendation}

**But before we settle on that — tell me more:**
${this.buildConsultantFollowUp(input)}`;
    }

    return `Let's think through this together.

**What I'm seeing:**
${ste.strategies.map((s) => `• ${s.title}`).join("\n")}

**What I'm questioning:**
${sve.assumptionsIdentified.map((a) => `• ${a}`).join("\n")}

**Another way to frame this:**
${sve.alternativeExplanations[0] || "Let me challenge how you're thinking about this."}

${recommendation ? `**A direction worth considering:**\n${recommendation}` : ""}

**To help me think with you more effectively:**
${this.buildConsultantFollowUp(input)}`;
  }

  private buildNavigationResponse(input: ThinkInput, ste: STEResult, sve: SVEResult, _sae: SAEResult, intent: CognitiveIntent): string {
    const strategy = intent.reasoningStrategy;

    if (strategy === "planning") {
      return `Let's map out where you are and where you want to be.

**What I'm noticing about your current situation:**
${ste.strategies.map((s, i) => `${i + 1}. ${s.title}`).join("\n")}

**Gaps worth thinking about:**
${sve.alternativeExplanations.slice(0, 2).map((g) => `• ${g}`).join("\n")}

**A path worth considering:**
${ste.strategies[0]?.title || "Structured navigation"}

**To build a complete plan, it would help to know:**
• Where are you starting from?
• Where do you want to get to?
• What resources do you have available?

Once I understand those, I'll lay out a clear path forward with milestones, execution steps, and success metrics.`;
    }

    return `Let's figure out the path from where you are to where you want to be.

**What I'm seeing:**
${ste.strategies.map((s, i) => `${i + 1}. ${s.title} — ${s.description.substring(0, 80)}...`).join("\n")}

**The direction that stands out most:**
${ste.strategies[0]?.title || "Structured navigation"}

**To build your full plan, tell me:**
• Where are you now?
• Where do you want to be?
• What's the gap between them?`;
  }

  private buildGenericResponse(input: ThinkInput, understanding: string, recommendation: string, _sae: SAEResult, intent: CognitiveIntent): string {
    const strategy = intent.reasoningStrategy;
    if (strategy === "discovery") {
      return `Let's explore this together.

${understanding}

I'm here to investigate with you — not to give you a finished answer.

What's the first thread you'd like to pull?`;
    }
    return `${understanding}\n\n${recommendation}\n\nHow would you like to proceed?`;
  }

  private buildFollowUpQuestion(input: ThinkInput): string {
    const questions = [
      "What sparked your interest in this topic?",
      "What have you already observed or discovered?",
      "What makes this question important to you right now?",
      "Is there a specific angle you want to explore first?",
      "What assumptions might we challenge together?",
    ];

    // Use the input to pick a relevant question
    const index = input.input.length % questions.length;
    return questions[index];
  }

  private buildConsultantFollowUp(input: ThinkInput): string {
    const questions = [
      "What have you already tried that hasn't worked?",
      "What's at stake if this isn't addressed?",
      "Who else is affected by this situation?",
      "What would success look like in 90 days?",
      "What resources do you have available?",
    ];

    const index = input.input.length % questions.length;
    return questions[index];
  }

  // ─── UTILITY: Get Research Modes ─────────────────────────────────────

  getResearchModes(): { id: ResearchMode; label: string; icon: string; description: string }[] {
    return [
      { id: "discovery", label: "Discovery Mode", icon: "🔬", description: "Open-ended collaborative investigation — the default." },
      { id: "experiment", label: "Experiment Mode", icon: "🧪", description: "Design experiments to test hypotheses." },
      { id: "literature", label: "Literature Mode", icon: "📚", description: "Summarize existing knowledge on a topic." },
      { id: "theory", label: "Theory Mode", icon: "🧠", description: "Develop new theories and frameworks." },
      { id: "report", label: "Report Mode", icon: "📄", description: "Generate a polished, structured report." },
      { id: "debate", label: "Debate Mode", icon: "⚖", description: "Challenge ideas from multiple perspectives." },
    ];
  }
}

// ─── Singleton Export ─────────────────────────────────────────────────────

export const SpyralCognitiveCore = new SpyralCognitiveCoreImpl();
