/**
 * ResponseComposer — Shared types for all agent response composers.
 *
 * Each composer receives the user input and the internal think() output,
 * then transforms them into a unique conversational experience.
 * The shared cognition (pipeline) stays in CognitiveCore — only the
 * output rendering differs per agent.
 */

import type { ThinkInput, CognitiveResponse, CognitiveIntent } from "@/core/SpyralCognitiveCore";

export interface ComposerInput {
  /** Original user input */
  input: ThinkInput;
  /** Full cognitive response from think() */
  response: CognitiveResponse;
  /** Conversation history (last few turns) */
  conversation?: { role: string; content: string }[];
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
  /** RC6: The structured ReasoningPackage built by the WorkingMind system */
  reasoningPackage?: import("@/core/mind").ReasoningPackage;
}

/**
 * Every Response Composer implements this contract.
 * It receives what the user said + what SPYRAL thinks, and returns
 * what the user actually reads.
 */
export type ResponseComposer = (
  input: ComposerInput,
  context?: ComposerContext,
) => string;
