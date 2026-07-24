/**
 * ResponseComposer — Shared types for all agent response composers (RC7).
 *
 * RC7: Composers are thin formatting utilities.
 * They do NOT generate content. They do NOT reason.
 * They take the LLM's output (ReasoningResult) and wrap it appropriately.
 *
 * The LLM produces all intelligence. The WorkingMind organizes input.
 * The composer formats the output. That's the entire architecture.
 */

import type { ThinkInput } from "@/core/SpyralCognitiveCore";
import type { ReasoningResult } from "@/core/reasoning";
import type { ReasoningPackage } from "@/core/mind";

export interface ComposerInput {
  /** Original user input */
  input: ThinkInput;
  /** RC7: The ReasoningPackage sent to the LLM */
  reasoningPackage: ReasoningPackage;
  /** RC7: The ReasoningResult returned by the LLM */
  reasoningResult: ReasoningResult;
}

export interface ComposerContext {
  /** Current investigation title, if any */
  currentInvestigation?: string;
  /** Current project name, if any */
  currentProject?: string;
  /** Recent memory items relevant to this agent */
  recentMemories?: string[];
  /** User's name for personalization */
  userName?: string;
  /** Number of turns in the current conversation */
  turnCount?: number;
  /** RC7: The structured ReasoningPackage built by the WorkingMind system */
  reasoningPackage?: ReasoningPackage;
  /** RC7: The ReasoningResult returned by the LLM */
  reasoningResult?: ReasoningResult;
}

/**
 * Every Response Composer implements this contract.
 * It receives what the user said + what the LLM returned, and returns
 * what the user actually reads.
 *
 * RC7: Composers are formatting utilities. They do NOT generate content.
 */
export type ResponseComposer = (
  input: ComposerInput,
  context?: ComposerContext,
) => string;
