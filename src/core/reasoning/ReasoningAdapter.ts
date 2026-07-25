/**
 * ReasoningAdapter — Abstract interface for all model providers.
 *
 * RC7: Every adapter accepts ONLY a ReasoningPackage and returns ONLY a ReasoningResult.
 * No adapter knows about pages, React, composers, or internal pipeline stages.
 *
 * This is the universal contract between SPYRAL's mind and any LLM.
 */

import type { ReasoningPackage } from "@/core/mind";
import type { ReasoningResult } from "./ReasoningResult";
import type { ModelProfile } from "./ReasoningProvider";

export interface ReasoningAdapter {
  /** Unique provider identifier */
  readonly provider: string;

  /** Display name */
  readonly label: string;

  /** Whether this adapter is available (has API key, etc.) */
  isAvailable(): boolean;

  /**
   * Send a ReasoningPackage to the model and get a ReasoningResult back.
   * This is the primary method adapters need to implement.
   *
   * @param pkg - The complete ReasoningPackage (WorkingMind + memory + context)
   * @param profile - Model profile (temperature, tokens, reasoning effort, etc.)
   * @param options - Optional overrides
   */
  reason(
    pkg: ReasoningPackage,
    profile: ModelProfile,
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      abortSignal?: AbortSignal;
    },
  ): Promise<ReasoningResult>;

  /**
   * Stream a ReasoningPackage to the model, yielding content chunks as they arrive.
   * Returns an AsyncGenerator that yields partial content strings and returns the
   * complete ReasoningResult when the stream is done.
   *
   * @param pkg - The complete ReasoningPackage
   * @param profile - Model profile
   * @param options - Optional overrides including abortSignal
   */
  streamReason?(
    pkg: ReasoningPackage,
    profile: ModelProfile,
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      abortSignal?: AbortSignal;
    },
  ): AsyncGenerator<string, ReasoningResult, void>;

  /**
   * Get the list of available models for this provider.
   */
  getModels(): { id: string; label: string }[];
}
