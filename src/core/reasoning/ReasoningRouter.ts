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
import { resolveProvider, getAvailableProviders, AGENT_PROFILES, type ModelProfile } from "./ReasoningProvider";

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
 * Route a ReasoningPackage to the best available model with streaming.
 *
 * Returns an AsyncGenerator that yields content strings as they arrive
 * from the model, and returns the complete ReasoningResult when the
 * stream ends.
 *
 * If the selected adapter doesn't support streaming, falls back to
 * regular reason() and yields the full content as a single chunk.
 */
export async function* routeReasoningStream(
  pkg: ReasoningPackage,
  agentType: AgentType,
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    abortSignal?: AbortSignal;
  },
): AsyncGenerator<string, ReasoningResult, void> {
  const startTime = Date.now();

  // 1. Resolve which providers to try (ordered: preferred → fallback → any available)
  const allProviders = getAvailableProviders();
  const profile = AGENT_PROFILES[agentType];

  // Build ordered list of providers to try
  const providerOrder: string[] = [];
  if (profile.preferredProvider) providerOrder.push(profile.preferredProvider);
  if (profile.fallbackProvider && profile.fallbackProvider !== profile.preferredProvider) {
    providerOrder.push(profile.fallbackProvider);
  }
  // Add any other available providers that aren't already in the list
  for (const p of allProviders) {
    if (p.available && !providerOrder.includes(p.type)) {
      providerOrder.push(p.type);
    }
  }

  let lastError: ReasoningResult | null = null;

  for (const providerType of providerOrder) {
    // Find the adapter
    const adapter = _adapters.get(providerType);
    if (!adapter || !adapter.isAvailable()) continue;

    // Determine model for this provider
    let modelToUse = profile.preferredModel;
    const providerConfig = allProviders.find(p => p.type === providerType);
    if (providerConfig && providerConfig.models.length > 0) {
      modelToUse = providerConfig.models[0]?.id ?? modelToUse;
    }

    if (process.env.NODE_ENV === "development" || process.env.DEV_MODE === "true") {
      console.log(`[ReasoningRouter] Streaming — Trying Provider: ${providerType}, Model: ${modelToUse}`);
    }

    // Try streaming first, fall back to non-streaming
    if (adapter.streamReason) {
      try {
        const gen = adapter.streamReason(pkg, profile, {
          model: options?.model ?? modelToUse,
          maxTokens: options?.maxTokens ?? profile.maxOutputTokens,
          temperature: options?.temperature ?? profile.temperature,
          abortSignal: options?.abortSignal,
        });

        let result: IteratorResult<string, ReasoningResult>;
        while (!(result = await gen.next()).done) {
          yield result.value;
        }

        // Stream completed — return the final ReasoningResult
        const finalResult = result.value;
        if (!finalResult.reasoning) {
          finalResult.reasoning = { durationMs: Date.now() - startTime };
        }

        // Check if the result has an auth/validation error — if so, try next provider
        if (finalResult.error) {
          const authCodes = ["AUTHENTICATION_ERROR", "API_KEY_MISSING", "INVALID_REQUEST", "API_ERROR_400"];
          if (authCodes.includes(finalResult.error.code)) {
            lastError = finalResult;
            if (process.env.NODE_ENV === "development" || process.env.DEV_MODE === "true") {
              console.log(`[ReasoningRouter] ${providerType} failed with ${finalResult.error.code}, trying next provider...`);
            }
            continue; // Try next provider
          }
        }

        return finalResult;
      } catch (err: any) {
        if (process.env.NODE_ENV === "development" || process.env.DEV_MODE === "true") {
          console.error(`[ReasoningRouter] Stream failed for ${providerType}, falling back to non-streaming:`, err);
        }
        // Fall through to fallback
      }
    }

    // Fallback: non-streaming
    if (process.env.NODE_ENV === "development" || process.env.DEV_MODE === "true") {
      console.log(`[ReasoningRouter] Using non-streaming fallback for ${providerType}`);
    }

    try {
      const result = await adapter.reason(pkg, profile, {
        model: options?.model ?? modelToUse,
        maxTokens: options?.maxTokens ?? profile.maxOutputTokens,
        temperature: options?.temperature ?? profile.temperature,
        abortSignal: options?.abortSignal,
      });

      if (!result.reasoning) {
        result.reasoning = { durationMs: Date.now() - startTime };
      }

      // Check for auth errors — try next provider
      if (result.error) {
        const authCodes = ["AUTHENTICATION_ERROR", "API_KEY_MISSING", "INVALID_REQUEST", "API_ERROR_400"];
        if (authCodes.includes(result.error.code)) {
          lastError = result;
          if (process.env.NODE_ENV === "development" || process.env.DEV_MODE === "true") {
            console.log(`[ReasoningRouter] ${providerType} non-streaming failed with ${result.error.code}, trying next provider...`);
          }
          continue; // Try next provider
        }
      }

      // Yield the full content as a single chunk
      if (result.content) {
        yield result.content;
      }

      return result;
    } catch (err: any) {
      lastError = {
        content: "",
        model: modelToUse,
        provider: providerType,
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        reasoning: { durationMs: Date.now() - startTime },
        cached: false,
        error: {
          code: "REASONING_FAILED",
          message: err?.message ?? "Reasoning failed with unknown error",
          recoverable: true,
        },
      };
      continue; // Try next provider
    }
  }

  // All providers failed — return the last error
  if (!lastError) {
    lastError = {
      content: "",
      model: "none",
      provider: "none",
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      reasoning: { durationMs: Date.now() - startTime },
      cached: false,
      error: {
        code: "ALL_PROVIDERS_FAILED",
        message: "No reasoning provider available. Please configure an API key.",
        recoverable: true,
      },
    };
  }

  return lastError;
}

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

  // Developer logging — shows which provider was selected
  if (process.env.NODE_ENV === "development" || process.env.DEV_MODE === "true") {
    console.log(`[ReasoningRouter] Provider Selected: ${provider}`);
    console.log(`[ReasoningRouter] Model: ${model}`);
    console.log(`[ReasoningRouter] Agent Type: ${agentType}`);
  }

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
