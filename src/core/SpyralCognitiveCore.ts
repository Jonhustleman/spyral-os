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
import { GenomeBootloader, type PreThinkContext } from "@/core/genome";
import { IDENTITY, COGNITIVE_CONTRACTS } from "@/core/genome";
import {
  ResearchResponseComposer,
  ContentResponseComposer,
  ConsultantResponseComposer,
  NavigationResponseComposer,
  CommandCenterComposer,
} from "@/features/composers";

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
  private static _genomeBooted = false;
  private static _genomeContext: PreThinkContext | null = null;

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

  /** Ensure Genome bootloader has executed */
  private static ensureGenomeBooted(): void {
    if (!SpyralCognitiveCoreImpl._genomeBooted) {
      GenomeBootloader.boot();
      SpyralCognitiveCoreImpl._genomeBooted = true;
    }
  }

  /** Get the current conversation context */
  static getConversation(): ConversationContext {
    SpyralCognitiveCoreImpl.ensureGenomeBooted();
    return { ...SpyralCognitiveCoreImpl._conversation };
  }

  /** Number of times think() has been called across the entire app */
  static getThinkCount(): number {
    SpyralCognitiveCoreImpl.ensureGenomeBooted();
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

    // ─── GENOME BOOT (IMMUTABLE COGNITIVE IDENTITY) ───────────────────
    // Every think() loads and prepares the Genome before any reasoning.
    // The Genome governs how SPYRAL exists — not how it answers.
    // It is NEVER exposed to the user.
    SpyralCognitiveCoreImpl.ensureGenomeBooted();
    SpyralCognitiveCoreImpl._genomeContext = GenomeBootloader.prepareForThinking(input.agentType);

    // ─── RECORD INTERACTION EVENT (PHASE G.0) ──────────────────────────
    // Every think() call is recorded as interaction metadata (not content).
    const tempStartTime = Date.now();
    ExperienceRecorder.recordEvent("thinking_started", {
      agentType: input.agentType,
      page: input.agentType,
      metadata: {
        inputLength: input.input.length,
        genomeVersion: GenomeBootloader.getVersion(),
      },
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
    let response = this.respond(input, understanding, ste, sve, sae, recommendation, executionPlan, intent, retrievedMemories);

    // ─── SELF-CRITIQUE (PHASE F.1) ─────────────────────────────────────
    // Before returning, review and revise INTERNALLY.
    // The self-critique is NOT shown to the user — it's a silent quality gate.
    // UX indicators (stage labels) are handled by the page UI.
    const selfCritique = this.selfCritique(response, intent, input);
    // If self-review found issues, silently revise the response
    if (!selfCritique.includes("ok")) {
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

    // ─── CLEAR GENOME CONTEXT ─────────────────────────────────────────
    SpyralCognitiveCoreImpl._genomeContext = null;

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

  // ─── 1. UNDERSTAND (RC5.1: Concise, no templates) ──────────────────────

  understand(input: ThinkInput, intent: CognitiveIntent): string {
    const strategy = intent.reasoningStrategy;

    // Internal understanding — used only by the pipeline, never shown to users.
    // Kept concise and factual. No template language.
    if (input.agentType === "research") {
      if (input.researchMode === "experiment") return `Wants to design experiments. Strategy: ${strategy}.`;
      if (input.researchMode === "literature") return `Wants to engage with existing knowledge. Strategy: ${strategy}.`;
      if (input.researchMode === "theory") return `Wants to develop new frameworks. Strategy: ${strategy}.`;
      if (input.researchMode === "report") return `Explicitly requested report. Strategy: ${strategy}.`;
      if (input.researchMode === "debate") return `Wants multi-perspective challenge. Strategy: ${strategy}.`;
      return `Collaborative investigation. Strategy: ${strategy}.`;
    }
    if (input.agentType === "content") {
      return `Creative direction. Strategy: ${strategy}.`;
    }
    if (input.agentType === "consultant") {
      return `Strategic advising. Strategy: ${strategy}.`;
    }
    if (input.agentType === "navigation") {
      return `Reality navigation. Strategy: ${strategy}.`;
    }
    if (input.agentType === "command") {
      return `Command orchestration. Domain: ${intent.domain}. Strategy: ${strategy}.`;
    }
    return `Processing. Strategy: ${strategy}. Domain: ${intent.domain}. Complexity: ${intent.complexity}.`;
  }

  // ─── 2. RETRIEVE MEMORY (RC5.1: Natural references) ─────────────────

  retrieveMemory(input: ThinkInput): { agent: string; summary: string }[] {
    const memories = SharedContextStore.getMemories();
    const relevant: { agent: string; summary: string }[] = [];

    // ─── GENOME CONTEXT INTEGRATION ───────────────────────────────────
    // Include patterns, timeline events, predictions, and knowledge
    // connections discovered by the GenomeBootloader from MemoryEngine.
    // References are phrased naturally — never "I remembered..."
    const gc = SpyralCognitiveCoreImpl._genomeContext;
    if (gc) {
      for (const pattern of gc.patterns) {
        if (pattern) {
          relevant.push({ agent: "genome", summary: pattern });
        }
      }
      for (const event of gc.timeline.slice(0, 3)) {
        if (event.summary) {
          relevant.push({ agent: "genome", summary: event.summary });
        }
      }
      for (const pred of gc.predictions.slice(0, 2)) {
        if (pred) {
          relevant.push({ agent: "genome", summary: pred });
        }
      }
      for (const conn of gc.knowledgeConnections.slice(0, 3)) {
        if (conn) {
          relevant.push({ agent: "genome", summary: conn });
        }
      }
    }

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

    // Check patterns from LearningStore — phrased naturally
    const patterns = LearningStore.getPatterns();
    for (const pattern of patterns) {
      const patternWords = pattern.title.toLowerCase().split(/\s+/);
      const overlap = inputWords.filter((w) => patternWords.includes(w));
      if (overlap.length >= 1) {
        relevant.push({
          agent: "system",
          summary: pattern.title,
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

    // ─── GENOME IDENTITY INTEGRATION ──────────────────────────────────
    // The genome's identity and agent disposition silently shape
    // how SPYRAL frames its mental model of the user's request.
    const gc = SpyralCognitiveCoreImpl._genomeContext;
    const disposition = gc?.disposition ?? ["Curious.", "Collaborative."];
    const purpose = IDENTITY.purpose;

    // Derive current reality from input
    let currentReality = `The user is engaging with SPYRAL ${input.agentType} about: "${text}".`;
    let desiredReality = `The user wants to achieve or understand something related to: "${text}".`;
    let goal = `Investigate, analyze, or create something related to: "${text}".`;

    // Try to infer more specific realities based on agent type
    if (input.agentType === "research") {
      currentReality = `The user has a question or topic they want to investigate: "${text}". They may have assumptions and partial knowledge. SPYRAL's disposition: ${disposition.join(" ")}`;
      desiredReality = "A deeper, evidence-based understanding of the topic with validated findings and clear next steps.";
      goal = `Discover truth about: "${text}" through structured investigation. Purpose: ${purpose}`;
    }

    if (input.agentType === "content") {
      currentReality = `The user has a content need or idea: "${text}". They need structured creative output. SPYRAL's disposition: ${disposition.join(" ")}`;
      desiredReality = "A comprehensive content package with strategy, creative assets, and publishing plan.";
      goal = `Create compelling content about: "${text}" that resonates with the target audience. Purpose: ${purpose}`;
    }

    if (input.agentType === "consultant") {
      currentReality = `The user faces a situation: "${text}". They need expert strategic guidance. SPYRAL's disposition: ${disposition.join(" ")}`;
      desiredReality = "A clear diagnosis, actionable strategy, and 90-day roadmap to address the challenge.";
      goal = `Solve the challenge: "${text}" with strategic analysis and recommendations. Purpose: ${purpose}`;
    }

    if (input.agentType === "navigation") {
      currentReality = `The user's current situation regarding: "${text}". SPYRAL's disposition: ${disposition.join(" ")}`;
      desiredReality = `The user's desired future state regarding: "${text}".`;
      goal = `Navigate from current reality to desired reality for: "${text}". Purpose: ${purpose}`;
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

    // Add patterns from LearningStore — no confidence exposure
    const storedPatterns = LearningStore.getPatterns();
    for (const p of storedPatterns.slice(0, 3)) {
      patterns.push(p.title);
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

    // ─── COGNITIVE CONTRACT EVALUATION ─────────────────────────────────
    // The Genome's cognitive contracts silently adjust confidence.
    // If contracts are violated, confidence is reduced.
    const contractPenalty = GenomeBootloader.evaluateContracts(
      missingEvidence.length > 0, // uncertainty reported
      supportingEvidence.length / Math.max(supportingEvidence.length + contradictingEvidence.length, 1), // evidence strength
      missingEvidence.length > 0 || mentalModel.unknownVariables.length > 0, // unknowns explicit
    );
    confidence -= contractPenalty;

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

  // ─── 9. SYNTHESIZE (RC5.1: No confidence exposure) ──────────────────

  synthesize(
    mentalModel: MentalModel,
    _sop: SOPResult,
    _lde: LDEResult,
    ste: STEResult,
    sve: SVEResult,
    _sae: SAEResult,
  ): string {
    const bestStrategy = ste.strategies[0];
    return `Recommended approach: ${bestStrategy.title}. ${bestStrategy.description}`;
  }

  // ─── 10. BUILD EXECUTION PLAN (RC5.1: Concise, no report headers) ───

  buildExecutionPlan(sae: SAEResult): string {
    const immediate = sae.immediateActions
      .slice(0, 2)
      .map((a) => a.action)
      .join("; ");
    const experiments = sae.experiments.slice(0, 2).join("; ");
    return `Immediate: ${immediate}. Validate: ${experiments}.`;
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

    // Store a learning record
    try {
      LearningStore.createInsight({
        patternIds: [],
        description: `Cognitive analysis: ${mentalModel.goal.substring(0, 100)}`,
        category: "cognitive-analysis",
        confidence: 0, // internal default — not exposed
        evidence: `Analysis completed across ${sop.facts.length + sop.assumptions.length} dimensions`,
        tags: ["cognitive-core", "analysis"],
      });
    } catch {
      // LearningStore might not be available in all contexts
    }

    // Store memory in shared context — natural phrasing, no confidence exposure
    try {
      SharedContextStore.saveMemory({
        agent: "cognitive-core",
        type: "insight",
        title: `Cognitive analysis: ${mentalModel.goal.substring(0, 80)}`,
        summary: mentalModel.goal.substring(0, 120),
        data: { patterns: lde.patterns },
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

  // ─── SELF-REVIEW: RESPONSE QUALITY FILTER (RC5.1) ────────────────────

  /**
   * selfReview() — Response Quality Filter (RC5.1 PART 8).
   *
   * Before every response, silently verify:
   *   - Am I repeating the user?
   *   - Am I exposing internal reasoning?
   *   - Am I writing a report?
   *   - Am I using a template?
   *   - Am I asking unnecessary questions?
   *   - Did I move the user's thinking forward?
   *   - Did I make at least one meaningful connection?
   *   - Would an intelligent human actually say this?
   *
   * If any answer is "no," flag the issue so the response is revised.
   * Returns internal notes only, never shown to users.
   */
  private selfCritique(response: string, intent: CognitiveIntent, input: ThinkInput): string {
    const critiques: string[] = [];
    const responseLower = response.toLowerCase();
    const inputLower = input.input.toLowerCase();

    // Check: Am I repeating the user?
    const inputWords = inputLower.split(/\s+/).filter((w) => w.length > 3);
    const repeatedWords = inputWords.filter((w) => responseLower.includes(w));
    if (repeatedWords.length > inputWords.length * 0.5 && inputWords.length > 3) {
      critiques.push("repeats too much of the user's input");
    }

    // Check: Am I quoting the user unnecessarily?
    const quotedText = response.match(/"([^"]+)"/g);
    if (quotedText && quotedText.length > 1) {
      critiques.push("unnecessarily quotes the user's words");
    }

    // Check: Am I exposing internal reasoning?
    const internalTerms = [
      "my reasoning", "hypothesis", "ste strategy", "sve analysis", "sae action",
      "cognitive pipeline", "let me think", "step 1", "step 2", "step 3",
      "observation", "analysis complete", "processing", "internal",
    ];
    const hasInternalTerms = internalTerms.some((term) => responseLower.includes(term));
    if (hasInternalTerms) {
      critiques.push("exposes internal reasoning");
    }

    // Check: Am I writing a report when not requested?
    const reportIndicators = [
      "here is the report", "here is your report", "executive summary",
      "this report", "the following report", "report generated",
    ];
    const isExplicitReport = inputLower.includes("generate a report") ||
      inputLower.includes("create a report") ||
      inputLower.includes("write a report") ||
      inputLower.includes("summarize everything") ||
      inputLower.includes("export findings");
    if (!isExplicitReport) {
      const hasReportLanguage = reportIndicators.some((term) => responseLower.includes(term));
      if (hasReportLanguage) {
        critiques.push("generates report without explicit request");
      }
    }

    // Check: Am I using a template opener?
    const templateOpeners = [
      "i understand", "you want to", "you asked", "let's investigate",
      "the user", "the prompt", "based on your", "regarding your",
    ];
    const hasTemplateOpener = templateOpeners.some((opener) => responseLower.startsWith(opener));
    if (hasTemplateOpener) {
      critiques.push("uses template opener");
    }

    // Check: Am I asking unnecessary questions?
    const questionCount = (response.match(/\?/g) || []).length;
    if (intent.reasoningStrategy === "decision" && questionCount > 2) {
      critiques.push("too many questions for a decision context");
    }
    if (questionCount > 3) {
      critiques.push("asks too many questions");
    }

    // Check: Did I move the user's thinking forward?
    if (response.length < 50 && intent.complexity !== "low") {
      critiques.push("response too brief to move thinking forward");
    }
    const forwardIndicors = [
      "what if", "have you considered", "another way", "the real question",
      "underlying", "connection", "pattern", "assumption", "trade-off",
      "hidden", "contrary", "perspective", "angle",
    ];
    const hasForwardThinking = forwardIndicors.some((term) => responseLower.includes(term));
    if (!hasForwardThinking && !intent.requiresImmediateAnswer) {
      critiques.push("doesn't move thinking forward");
    }

    // Check: Did I make at least one meaningful connection?
    const connectionIndicators = [
      "reminds me", "similar to", "related to", "connects to",
      "parallel", "pattern", "structure", "like the",
    ];
    const hasConnection = connectionIndicators.some((term) => responseLower.includes(term));
    if (!hasConnection && intent.domain === "research") {
      critiques.push("no meaningful connection made");
    }

    // Check: Would an intelligent human actually say this?
    const roboticPatterns = [
      "based on the", "according to my", "as an ai", "i am an",
      "as a language model", "i was designed", "my training",
    ];
    if (roboticPatterns.some((p) => responseLower.includes(p))) {
      critiques.push("sounds robotic or AI-like");
    }

    // Apply revision: prepend the most important critique
    if (critiques.length > 0) {
      return `review: ${critiques[0]}`;
    }

    return "review: ok";
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
    retrievedMemories: { agent: string; summary: string }[],
  ): string {
    // Delegate to the appropriate agent composer.
    // Each composer is a pure function that receives the input + full
    // cognitive response and returns a unique conversational experience.
    // Build composer context with conversation state
    const composerContext = {
      currentInvestigation: SpyralCognitiveCoreImpl._conversation.currentInvestigation,
      currentProject: SpyralCognitiveCoreImpl._conversation.currentProject,
      recentMemories: retrievedMemories.map((m) => m.summary),
      userName: SpyralCognitiveCoreImpl._genomeContext?.userContext?.userName,
      turnCount: SpyralCognitiveCoreImpl._conversation.turnCount,
    };

    const composerInput = {
      input,
      response: {
        input: input.input,
        agentType: input.agentType,
        researchMode: input.researchMode,
        intent,
        reasoningStrategy: intent.reasoningStrategy,
        understanding,
        retrievedMemories,
        mentalModel: {} as MentalModel,
        sop: {} as SOPResult,
        lde: {} as LDEResult,
        ste,
        sve,
        sae,
        recommendation,
        executionPlan: _executionPlan,
        learning: { patternsFound: [], insightsGained: [], confidenceImpact: 0 },
        selfCritique: "",
        response: "",
        confidence: 0,
      } as CognitiveResponse,
    };

    switch (input.agentType) {
      case "research":
        return ResearchResponseComposer(composerInput, composerContext);
      case "content":
        return ContentResponseComposer(composerInput, composerContext);
      case "consultant":
        return ConsultantResponseComposer(composerInput, composerContext);
      case "navigation":
        return NavigationResponseComposer(composerInput, composerContext);
      case "command":
        return CommandCenterComposer(composerInput, composerContext);
      default:
        return NavigationResponseComposer(composerInput, composerContext);
    }
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
