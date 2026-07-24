/**
 * SPYRAL OS — SpyralCognitiveCore (RC7)
 *
 * THE COGNITIVE PROCESSOR.
 *
 * Architecture (RC7):
 *   User Input → WorkingMind (RAM) → ReasoningPackage (Universal Interface)
 *   → ReasoningRouter → LLM → ReasoningResult → Format → Response
 *
 * NO fake reasoning. NO pipeline stages that fabricate intelligence.
 * The WorkingMind organizes reality. The LLM provides intelligence.
 * The composers format the result.
 *
 * All LLM communication goes through ReasoningRouter.
 * Nothing in SPYRAL calls model APIs directly.
 */

import { LearningStore } from "@/features/learning";
import { SharedContextStore } from "@/features/shared";
import { ExperienceRecorder } from "@/core/product-intelligence";
import { GenomeBootloader, type PreThinkContext } from "@/core/genome";
import { IDENTITY } from "@/core/genome";
import {
  ResearchResponseComposer,
  ContentResponseComposer,
  ConsultantResponseComposer,
  NavigationResponseComposer,
  CommandCenterComposer,
} from "@/features/composers";
import { buildWorkingMind, buildReasoningPackage, serializeReasoningPackage } from "@/core/mind";
import { initReasoningSystem, routeReasoning } from "@/core/reasoning";
import type { ReasoningResult } from "@/core/reasoning";
import type { ReasoningPackage } from "@/core/mind";

// ═══════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════

export type AgentType = "research" | "content" | "navigation" | "consultant" | "command";
export type ResearchMode = "discovery" | "experiment" | "literature" | "theory" | "report" | "debate";

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
 * Complete output of the think() pipeline (RC7).
 *
 * Simplified from RC6 — NO fake pipeline stages.
 * Just: input → WorkingMind → ReasoningPackage → LLM → result → format.
 */
export interface CognitiveResponse {
  /** The original user input */
  input: string;

  /** Agent type that initiated thinking */
  agentType: AgentType;

  /** Research mode if applicable */
  researchMode?: ResearchMode;

  /** The formatted response shown to the user */
  response: string;

  /** The ReasoningPackage that was sent to the LLM */
  reasoningPackage: ReasoningPackage;

  /** The ReasoningResult returned by the LLM */
  reasoningResult: ReasoningResult;

  /** Updated conversation context */
  conversation: ConversationContext;
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

  /** Previous conversation context to continue */
  conversation?: ConversationContext;

  /** Conversation history (last 10 turns) */
  conversationHistory?: { role: "user" | "assistant"; content: string }[];
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
  private static _reasoningInitialized = false;

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

  /** Ensure reasoning system is initialized */
  private static ensureReasoningInitialized(): void {
    if (!SpyralCognitiveCoreImpl._reasoningInitialized) {
      initReasoningSystem();
      SpyralCognitiveCoreImpl._reasoningInitialized = true;
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

  // ─── PUBLIC ENTRY POINT (RC7) ───────────────────────────────────────────

  /**
   * think() — The ONLY public entry point (RC7).
   *
   * Flow:
   *   1. Genome boot (cognitive identity)
   *   2. Build WorkingMind from user input (ConceptExtractor → Engines → ContextBuilder)
   *   3. Build ReasoningPackage (with memory, conversation history, KG)
   *   4. Route to best available LLM via ReasoningRouter
   *   5. Update memory (LearningStore + SharedContextStore)
   *   6. Format response via agent composer
   *   7. Update conversation context
   *   8. Return simplified CognitiveResponse
   *
   * NO fake reasoning. NO pipeline stages that fabricate intelligence.
   * The LLM provides all intelligence. WorkingMind organizes the input.
   * Composers format the output. That's it.
   */
  async think(input: ThinkInput): Promise<CognitiveResponse> {
    SpyralCognitiveCoreImpl._thinkCount++;

    // ─── GENOME BOOT ─────────────────────────────────────────────────
    SpyralCognitiveCoreImpl.ensureGenomeBooted();
    SpyralCognitiveCoreImpl._genomeContext = GenomeBootloader.prepareForThinking(input.agentType);

    // ─── INIT REASONING SYSTEM ──────────────────────────────────────
    SpyralCognitiveCoreImpl.ensureReasoningInitialized();

    // ─── RECORD START ───────────────────────────────────────────────
    const startTime = Date.now();
    ExperienceRecorder.recordEvent("thinking_started", {
      agentType: input.agentType,
      page: input.agentType,
      metadata: {
        inputLength: input.input.length,
        genomeVersion: GenomeBootloader.getVersion(),
      },
    });

    // ─── STEP 1: BUILD WORKING MIND (RC6 — RAM, not CPU) ─────────────
    // WorkingMind organizes reality before the LLM reasons over it.
    // It is RAM, not a CPU. It does NOT reason.
    let reasoningPackage: ReasoningPackage;
    try {
      const mind = await buildWorkingMind(input.input, input.agentType, {
        sharedContextStore: SharedContextStore as any,
        learningStore: LearningStore as any,
        currentInvestigation: input.conversation?.currentInvestigation ?? SpyralCognitiveCoreImpl._conversation.currentInvestigation,
        currentMission: input.conversation?.currentProject ?? SpyralCognitiveCoreImpl._conversation.currentProject,
      });

      // Build conversation history from input
      const history = input.conversationHistory ?? [];

      // Build Knowledge Graph from memory stores
      const kgEntities: string[] = [];
      const kgRelationships: { source: string; target: string; type: string }[] = [];

      // Gather memory from SharedContextStore
      const memories = SharedContextStore.getMemories();
      for (const mem of memories.slice(0, 5)) {
        kgEntities.push(mem.title);
      }

      // Gather patterns from LearningStore
      const patterns = LearningStore.getPatterns();
      const patternDescriptions = patterns.map(p => p.title);

      // Build the complete ReasoningPackage
      reasoningPackage = buildReasoningPackage(mind, {
        conversationHistory: history,
        knowledgeGraph: {
          entities: kgEntities,
          relationships: kgRelationships,
        },
        patterns: patternDescriptions,
        userPreferences: [...mind.activeMemory.preferences],
      });
    } catch (err) {
      // WorkingMind is non-critical — fall back to minimal ReasoningPackage
      console.warn("[RC7] WorkingMind build failed, using minimal context:", err);

      const fallbackMind = await buildWorkingMind(input.input, input.agentType, {});
      reasoningPackage = buildReasoningPackage(fallbackMind, {
        conversationHistory: input.conversationHistory ?? [],
      });
    }

    // ─── STEP 2: ROUTE TO LLM ─────────────────────────────────────────
    // Send the ReasoningPackage to the best available model.
    // This is where actual intelligence comes from — not from TypeScript rules.
    const reasoningResult = await routeReasoning(
      reasoningPackage,
      input.agentType,
    );

    // ─── STEP 3: UPDATE MEMORY ─────────────────────────────────────────
    // After receiving the LLM's response, store what we can learn from it.
    this.updateMemory(input, reasoningPackage, reasoningResult);

    // ─── STEP 4: FORMAT RESPONSE ───────────────────────────────────────
    // The composer formats the ReasoningResult into the final output.
    // In RC7, composers are thin formatting utilities — they do NOT generate content.
    const response = this.formatResponse(input, reasoningPackage, reasoningResult);

    // ─── STEP 5: UPDATE CONVERSATION CONTEXT ──────────────────────────
    this.updateConversation(input);

    // ─── RECORD COMPLETION ────────────────────────────────────────────
    ExperienceRecorder.recordEvent("thinking_completed", {
      agentType: input.agentType,
      page: input.agentType,
      duration: Date.now() - startTime,
      metadata: {
        thinkCount: SpyralCognitiveCoreImpl._thinkCount,
        model: reasoningResult.model,
        provider: reasoningResult.provider,
        tokens: reasoningResult.usage.totalTokens,
      },
    });

    // ─── CLEAR GENOME CONTEXT ─────────────────────────────────────────
    SpyralCognitiveCoreImpl._genomeContext = null;

    return {
      input: input.input,
      agentType: input.agentType,
      researchMode: input.researchMode,
      response,
      reasoningPackage,
      reasoningResult,
      conversation: { ...SpyralCognitiveCoreImpl._conversation },
    };
  }

  // ─── MEMORY UPDATE ─────────────────────────────────────────────────────

  /**
   * After the LLM responds, update SPYRAL's memory stores.
   *
   * RC7: Extracts facts, decisions, and patterns from the interaction.
   * Does NOT store raw conversation content — stores what was learned.
   */
  private updateMemory(
    input: ThinkInput,
    pkg: ReasoningPackage,
    result: ReasoningResult,
  ): void {
    // Store in SharedContextStore
    try {
      SharedContextStore.saveMemory({
        agent: input.agentType,
        type: "insight",
        title: `${input.agentType}: ${input.input.substring(0, 80)}`,
        summary: result.content.substring(0, 200),
        data: {
          goal: pkg.currentGoal,
          model: result.model,
          provider: result.provider,
          tokens: result.usage.totalTokens,
        },
        sharedWith: ["research", "content", "navigation", "consultant", "command"],
      });
    } catch {
      // Non-critical
    }

    // Store insight in LearningStore if the result had meaningful content
    if (result.content.length > 50 && !result.error) {
      try {
        LearningStore.createInsight({
          patternIds: [],
          description: `LLM reasoning: ${pkg.currentGoal.substring(0, 100)}`,
          category: "cognitive-analysis",
          confidence: 0,
          evidence: `Model: ${result.model}, Tokens: ${result.usage.totalTokens}`,
          tags: ["cognitive-core", input.agentType, "llm-reasoning"],
        });
      } catch {
        // Non-critical
      }
    }
  }

  // ─── CONVERSATION MEMORY ───────────────────────────────────────────────

  private updateConversation(input: ThinkInput): void {
    SpyralCognitiveCoreImpl._conversation.turnCount++;

    // Track the topic
    const topicWords = input.input.split(/\s+/).slice(0, 10).join(" ");
    SpyralCognitiveCoreImpl._conversation.recentTopics.push(topicWords);
    if (SpyralCognitiveCoreImpl._conversation.recentTopics.length > 10) {
      SpyralCognitiveCoreImpl._conversation.recentTopics.shift();
    }

    // Track investigation
    SpyralCognitiveCoreImpl._conversation.currentInvestigation = input.input.substring(0, 200);

    // Track project if planning keywords
    const lower = input.input.toLowerCase();
    if (/plan|project|build|create campaign|launch|roadmap|milestone|timeline/i.test(lower)) {
      SpyralCognitiveCoreImpl._conversation.currentProject = input.input.substring(0, 200);
    }

    // Merge in any passed conversation context
    if (input.conversation) {
      if (input.conversation.currentInvestigation) SpyralCognitiveCoreImpl._conversation.currentInvestigation = input.conversation.currentInvestigation;
      if (input.conversation.currentProject) SpyralCognitiveCoreImpl._conversation.currentProject = input.conversation.currentProject;
      if (input.conversation.currentStrategy) SpyralCognitiveCoreImpl._conversation.currentStrategy = input.conversation.currentStrategy;
    }
  }

  // ─── RESPONSE FORMATTING (RC7) ────────────────────────────────────────

  /**
   * Format the ReasoningResult into the final user-facing response.
   *
   * RC7: Composers are thin formatting utilities.
   * They do NOT generate content. They do NOT reason.
   * They take the LLM's output and wrap it appropriately.
   */
  private formatResponse(
    input: ThinkInput,
    pkg: ReasoningPackage,
    result: ReasoningResult,
  ): string {
    // If the LLM returned an error, use a composer to format the error
    if (result.error) {
      return this.formatError(input, pkg, result);
    }

    // Build composer context
    const composerContext = {
      currentInvestigation: SpyralCognitiveCoreImpl._conversation.currentInvestigation,
      currentProject: SpyralCognitiveCoreImpl._conversation.currentProject,
      recentMemories: [],
      turnCount: SpyralCognitiveCoreImpl._conversation.turnCount,
      reasoningPackage: pkg,
      reasoningResult: result,
    };

    const composerInput = {
      input,
      reasoningPackage: pkg,
      reasoningResult: result,
    };

    // Delegate to the appropriate agent composer
    switch (input.agentType) {
      case "research":
        return ResearchResponseComposer(composerInput as any, composerContext as any);
      case "content":
        return ContentResponseComposer(composerInput as any, composerContext as any);
      case "consultant":
        return ConsultantResponseComposer(composerInput as any, composerContext as any);
      case "navigation":
        return NavigationResponseComposer(composerInput as any, composerContext as any);
      case "command":
        return CommandCenterComposer(composerInput as any, composerContext as any);
      default:
        return result.content;
    }
  }

  /**
   * Format an error from the reasoning system.
   */
  private formatError(
    input: ThinkInput,
    pkg: ReasoningPackage,
    result: ReasoningResult,
  ): string {
    const error = result.error!;

    if (error.code === "PROVIDER_UNAVAILABLE" || error.code === "API_KEY_MISSING") {
      return [
        `I'm running in development mode — no LLM is connected yet.`,
        ``,
        `I received your input: "${input.input}"`,
        ``,
        `To enable real reasoning, add an API key to your \`.env.local\` file:`,
        `- \`OPENAI_API_KEY\` — for GPT-5 / GPT-4.1 / GPT-4o`,
        `- \`ANTHROPIC_API_KEY\` — for Claude 4 / Claude 3.5 Sonnet`,
        `- \`GEMINI_API_KEY\` — for Gemini 2.5 Pro / 2.0 Flash`,
        `- \`DEEPSEEK_API_KEY\` — for DeepSeek V3 / R1`,
        ``,
        `Then restart the development server. SPYRAL will automatically route to the best available model.`,
        ``,
        `_Cognitive Core — RC7 — No LLM Connected_`,
      ].join("\n");
    }

    // Recoverable error — suggest retry
    return [
      `I encountered an issue while reasoning: ${error.message}`,
      ``,
      `This was a ${error.recoverable ? "temporary" : "permanent"} error.`,
      error.recoverable ? "Please try again." : "You may need to check your configuration.",
    ].join("\n");
  }

  // ─── UTILITY ─────────────────────────────────────────────────────────

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
