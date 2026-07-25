/**
 * MockAdapter — Development-only mock reasoner.
 *
 * RC7: Exists ONLY for development when no real LLM is available.
 * Never market it as intelligence. Never fake reasoning.
 *
 * Displays a fallback message instead of pretending to be intelligent.
 */

import type { ReasoningPackage } from "@/core/mind";
import type { ReasoningResult } from "../ReasoningResult";
import type { ReasoningAdapter } from "../ReasoningAdapter";
import type { ModelProfile } from "../ReasoningProvider";

export class MockAdapter implements ReasoningAdapter {
  readonly provider = "mock";
  readonly label = "Mock Reasoner (Dev)";

  isAvailable(): boolean {
    return true;
  }

  getModels(): { id: string; label: string }[] {
    return [{ id: "mock", label: "Mock Reasoner" }];
  }

  async reason(
    pkg: ReasoningPackage,
    profile: ModelProfile,
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      abortSignal?: AbortSignal;
    },
  ): Promise<ReasoningResult> {
    // Simulate a small delay like a real LLM
    await new Promise(resolve => setTimeout(resolve, 300));

    // User-friendly message — NO developer output, NO setup instructions
    const content = "I'm having trouble reaching my reasoning service right now. Please try again in a moment.";

    return {
      content,
      model: "mock",
      provider: "mock",
      usage: {
        inputTokens: 0,
        outputTokens: content.split(/\s+/).length,
        totalTokens: content.split(/\s+/).length,
      },
      cached: false,
      error: {
        code: "PROVIDER_UNAVAILABLE",
        message: "No reasoning provider is available",
        recoverable: true,
      },
    };
  }

  /**
   * streamReason — Dev mock streaming.
   * Yields the mock message character by character to simulate streaming.
   */
  async *streamReason(
    pkg: ReasoningPackage,
    profile: ModelProfile,
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
      abortSignal?: AbortSignal;
    },
  ): AsyncGenerator<string, ReasoningResult, void> {
    const content = "I'm having trouble reaching my reasoning service right now. Please try again in a moment.";

    // Yield character by character to simulate streaming
    for (let i = 0; i < content.length; i++) {
      // Check for abort
      if (options?.abortSignal?.aborted) break;
      yield content[i];
      // Small delay to simulate real streaming
      await new Promise(resolve => setTimeout(resolve, 10));
    }

    return {
      content,
      model: "mock",
      provider: "mock",
      usage: {
        inputTokens: 0,
        outputTokens: content.split(/\s+/).length,
        totalTokens: content.split(/\s+/).length,
      },
      cached: false,
      error: {
        code: "PROVIDER_UNAVAILABLE",
        message: "No reasoning provider is available",
        recoverable: true,
      },
    };
  }
}
