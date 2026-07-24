/**
 * ReasoningRouter — Routes reasoning requests to the appropriate LLM adapter.
 *
 * RC7: The router selects which model should think based on:
 *   - Agent type (research → deep reasoning, content → creative, etc.)
 *   - Available providers (API keys configured)
 *   - User preference (if set)
 *
 * The router is the only entry point for reasoning.
 * Nothing in SPYRAL calls LLM adapters directly.
 */

import type { ReasoningPackage } from "@/core/mind";
import type { ReasoningResult } from "./ReasoningResult";
import type { ReasoningAdapter } from "./ReasoningAdapter";
import type { AgentType } from "../SpyralCognitiveCore";
import { resolveProvider, type ModelProfile } from "./ReasoningProvider";

// ─── Adapter Registry ────────────────────────────────────────────────────

const _adapters = new Map<string, ReasoningAdapter>();

/**
 * Register a reasoning adapter.
 * Called once at startup (or lazily on first use).
 */
export function registerAdapter(adapter: ReasoningAdapter): void {
  _adapters.set(adapter.provider, adapter);
}

/**
 * Get a registered adapter by provider name.
 */
export function getAdapter(provider: string): ReasoningAdapter | undefined {
  return _adapters.get(provider);
}

/**
 * Get all registered adapters.
 */
export function getAllAdapters(): ReasoningAdapter[] {
  return Array.from(_adapters.values());
}

// ─── Router ──────────────────────────────────────────────────────────────

/**
 * Route a ReasoningPackage to the best available model.
 *
 * Flow:
 *   1. Resolve provider based on agent type + availability
 *   2. Find the registered adapter
 *   3. Call adapter.reason() with the ReasoningPackage + profile
 *   4. Return the ReasoningResult
 *
 * If no adapter is available, returns a mock "unavailable" result.
 */
export async function routeReasoning(
  pkg: ReasoningPackage,
  agentType: AgentType,
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    abortSignal?: AbortSignal;
  },
): Promise<ReasoningResult> {
  const startTime = Date.now();

  // 1. Resolve which provider + model to use
  const { provider, model, profile } = resolveProvider(agentType);

  // 2. Find the adapter
  const adapter = _adapters.get(provider);

  if (!adapter || !adapter.isAvailable()) {
    // No adapter available — return unavailable result
    return {
      content: "",
      model: "none",
      provider: "none",
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      reasoning: { durationMs: Date.now() - startTime },
      cached: false,
      error: {
        code: "PROVIDER_UNAVAILABLE",
        message: `No reasoning provider available for ${agentType}. Please configure an API key or use Mock Reasoner for development.`,
        recoverable: true,
      },
    };
  }

  // 3. Call the adapter
  try {
    const result = await adapter.reason(pkg, profile, {
      model: options?.model ?? model,
      maxTokens: options?.maxTokens ?? profile.maxOutputTokens,
      temperature: options?.temperature ?? profile.temperature,
      abortSignal: options?.abortSignal,
    });

    // Add reasoning duration if not set
    if (!result.reasoning) {
      result.reasoning = { durationMs: Date.now() - startTime };
    }

    return result;
  } catch (err: any) {
    return {
      content: "",
      model,
      provider,
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      reasoning: { durationMs: Date.now() - startTime },
      cached: false,
      error: {
        code: "REASONING_FAILED",
        message: err?.message ?? "Reasoning failed with unknown error",
        recoverable: true,
      },
    };
  }
}
