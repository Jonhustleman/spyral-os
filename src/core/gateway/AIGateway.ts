/**
 * AIGateway — The unified AI communication layer for SPYRAL OS.
 *
 * Every reasoning request from every SPYRAL experience flows through this Gateway.
 * No page calls any provider directly.
 *
 * Responsibilities:
 *   - Provider selection (Gemini primary → OpenRouter fallback → chain)
 *   - Automatic retry on failure
 *   - Streaming and non-streaming support
 *   - Token budgeting (adaptive max_tokens)
 *   - Error classification (auth, rate-limit, quota, timeout, network, provider)
 *   - Normalized response format
 *   - Memory integration trigger
 *
 * Architecture:
 *   WorkingMind → AIGateway → ReasoningRouter → Adapter → LLM
 *
 * Changing providers in the future requires modifying only this Gateway
 * and the provider layer — NOT experiences, WorkingMind, or Memory Engine.
 */

import type { ReasoningPackage } from "@/core/mind";
import type { ReasoningResult } from "@/core/reasoning";
import type { AgentType } from "@/core/SpyralCognitiveCore";
import { routeReasoning, routeReasoningStream } from "@/core/reasoning";

// ─── Types ───────────────────────────────────────────────────────────────

export interface GatewayRequest {
  reasoningPackage: ReasoningPackage;
  agentType: AgentType;
  stream?: boolean;
  maxTokens?: number;
  temperature?: number;
  abortSignal?: AbortSignal;
}

export interface GatewayResponse {
  /** The natural language response content */
  content: string;
  /** The provider that fulfilled this request */
  provider: string;
  /** The model used */
  model: string;
  /** Token usage */
  usage: { inputTokens: number; outputTokens: number; totalTokens: number };
  /** Whether a fallback provider was used */
  usedFallback: boolean;
  /** Error information (null if successful) */
  error: GatewayError | null;
}

export interface GatewayError {
  code: string;
  message: string;
  recoverable: boolean;
  diagnostics?: {
    provider: string;
    statusCode?: number;
    durationMs: number;
    retryAttempted: boolean;
    fallbackProvider?: string;
  };
}

// ─── Token Budget Configuration ──────────────────────────────────────────
// Intelligent defaults — concise output for normal conversations.
// Long reports increase output length only when explicitly requested.

const DEFAULT_MAX_TOKENS = 1024;
const EXTENDED_MAX_TOKENS = 4096;

/**
 * Determine the token budget based on the request.
 * Normal conversations: concise (1024 tokens)
 * Long reports / explicit requests: extended (4096 tokens)
 */
function getTokenBudget(pkg: ReasoningPackage, requestedMaxTokens?: number): number {
  if (requestedMaxTokens) return requestedMaxTokens;

  // Check if the user explicitly asked for a long response
  const input = pkg.mind?.rawInput ?? "";
  const isLongRequest = /\b(detailed|comprehensive|long|extensive|report|essay|deep analysis)\b/i.test(input);

  if (isLongRequest) {
    return EXTENDED_MAX_TOKENS;
  }

  return DEFAULT_MAX_TOKENS;
}

// ─── Retry Configuration ────────────────────────────────────────────────

const MAX_RETRIES = 1; // Try primary, then fallback

// ─── Gateway Implementation ─────────────────────────────────────────────

class AIGatewayImpl {
  /**
   * Send a request to the AI provider.
   * Automatically selects provider (Gemini → OpenRouter → chain),
   * handles retries, and returns a normalized response.
   */
  async send(request: GatewayRequest): Promise<GatewayResponse> {
    const { reasoningPackage, agentType, maxTokens, temperature, abortSignal } = request;

    const tokenBudget = getTokenBudget(reasoningPackage, maxTokens);
    let lastError: ReasoningResult | null = null;
    let usedFallback = false;

    // Try primary provider (Gemini) first
    const primaryResult = await this.tryProvider(
      reasoningPackage,
      agentType,
      tokenBudget,
      temperature,
      abortSignal,
    );

    if (primaryResult && !primaryResult.error) {
      return this.toGatewayResponse(primaryResult, false);
    }

    // Primary failed — try fallback providers
    lastError = primaryResult;
    usedFallback = true;

    // If primary failed with auth error, don't retry — just return the classified error
    if (lastError?.error?.code === "AUTHENTICATION_ERROR" || lastError?.error?.code === "API_KEY_MISSING") {
      return this.toErrorResponse(lastError, null, usedFallback);
    }

    // The ReasoningRouter already handles fallback via resolveProvider,
    // but if it failed, we retry with a different approach:
    // Try the non-streaming path which might use different provider
    if (lastError?.error) {
      try {
        const fallbackResult = await routeReasoning(
          reasoningPackage,
          agentType,
          {
            maxTokens: tokenBudget,
            temperature,
            abortSignal,
          },
        );

        if (fallbackResult && !fallbackResult.error) {
          return this.toGatewayResponse(fallbackResult, true);
        }

        // Both primary and fallback failed
        return this.toErrorResponse(fallbackResult, lastError, usedFallback);
      } catch (err: any) {
        return {
          content: "",
          provider: "none",
          model: "none",
          usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
          usedFallback: true,
          error: {
            code: "ALL_PROVIDERS_FAILED",
            message: "Unable to process your request at this time. Please try again.",
            recoverable: true,
            diagnostics: {
              provider: "none",
              durationMs: 0,
              retryAttempted: true,
              fallbackProvider: "openrouter",
            },
          },
        };
      }
    }

    return this.toErrorResponse(lastError, null, usedFallback);
  }

  /**
   * Send a streaming request to the AI provider.
   * Returns an async generator that yields content chunks and returns a GatewayResponse.
   */
  async *sendStream(
    request: GatewayRequest,
  ): AsyncGenerator<string, GatewayResponse, void> {
    const { reasoningPackage, agentType, maxTokens, temperature, abortSignal } = request;

    const tokenBudget = getTokenBudget(reasoningPackage, maxTokens);

    // Try streaming with the primary provider (via ReasoningRouter)
    const streamGen = routeReasoningStream(
      reasoningPackage,
      agentType,
      {
        maxTokens: tokenBudget,
        temperature,
        abortSignal,
      },
    );

    let fullContent = "";
    let finalResult: ReasoningResult | null = null;
    let usedFallback = false;

    try {
      let result: IteratorResult<string, ReasoningResult>;
      while (true) {
        result = await streamGen.next();
        if (result.done) {
          finalResult = result.value;
          break;
        }
        fullContent += result.value;
        yield result.value;
      }
    } catch (err: any) {
      // Stream failed — try non-streaming fallback
      console.warn("[AIGateway] Stream failed, trying non-streaming fallback:", err?.message);
      usedFallback = true;

      try {
        const fallbackResult = await routeReasoning(
          reasoningPackage,
          agentType,
          {
            maxTokens: tokenBudget,
            temperature,
            abortSignal,
          },
        );

        if (fallbackResult && !fallbackResult.error) {
          if (fallbackResult.content) {
            yield fallbackResult.content;
          }
          finalResult = fallbackResult;
        } else {
          finalResult = fallbackResult;
        }
      } catch (fallbackErr: any) {
        const gwResponse: GatewayResponse = {
          content: fullContent,
          provider: "none",
          model: "none",
          usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
          usedFallback: true,
          error: {
            code: "ALL_PROVIDERS_FAILED",
            message: "Unable to process your request at this time. Please try again.",
            recoverable: true,
            diagnostics: {
              provider: "none",
              durationMs: 0,
              retryAttempted: true,
              fallbackProvider: "openrouter",
            },
          },
        };
        return gwResponse;
      }
    }

    // finalResult should be set by this point — either from successful stream or fallback
    // TypeScript narrows: if null, something went wrong but we return gracefully
    if (!finalResult) {
      return {
        content: fullContent,
        provider: "none",
        model: "none",
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        usedFallback,
        error: {
          code: "ALL_PROVIDERS_FAILED",
          message: "Unable to process your request at this time. Please try again.",
          recoverable: true,
          diagnostics: {
            provider: "none",
            durationMs: 0,
            retryAttempted: true,
            fallbackProvider: "openrouter",
          },
        },
      };
    }

    return this.toGatewayResponse(finalResult, usedFallback);
  }

  /**
   * Try a single provider via the ReasoningRouter.
   */
  private async tryProvider(
    pkg: ReasoningPackage,
    agentType: AgentType,
    maxTokens: number,
    temperature?: number,
    abortSignal?: AbortSignal,
  ): Promise<ReasoningResult | null> {
    try {
      return await routeReasoning(pkg, agentType, {
        maxTokens,
        temperature,
        abortSignal,
      });
    } catch {
      return null;
    }
  }

  /**
   * Convert a successful ReasoningResult to a GatewayResponse.
   */
  private toGatewayResponse(result: ReasoningResult, usedFallback: boolean): GatewayResponse {
    return {
      content: result.content,
      provider: result.provider,
      model: result.model,
      usage: result.usage,
      usedFallback,
      error: result.error
        ? {
            code: result.error.code,
            message: this.toUserMessage(result.error.code),
            recoverable: result.error.recoverable,
            diagnostics: {
              provider: result.provider,
              durationMs: result.reasoning?.durationMs ?? 0,
              retryAttempted: usedFallback,
              fallbackProvider: usedFallback ? "openrouter" : undefined,
            },
          }
        : null,
    };
  }

  /**
   * Convert a failed reasoning attempt to a GatewayResponse with classified error.
   */
  private toErrorResponse(
    result: ReasoningResult | null,
    _previousError: ReasoningResult | null,
    usedFallback: boolean,
  ): GatewayResponse {
    const error = result?.error ?? {
      code: "UNKNOWN_ERROR",
      message: "An unexpected error occurred.",
      recoverable: true,
    };

    return {
      content: result?.content ?? "",
      provider: result?.provider ?? "none",
      model: result?.model ?? "none",
      usage: result?.usage ?? { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
      usedFallback,
      error: {
        code: error.code,
        message: this.toUserMessage(error.code),
        recoverable: error.recoverable,
        diagnostics: {
          provider: result?.provider ?? "none",
          durationMs: result?.reasoning?.durationMs ?? 0,
          retryAttempted: usedFallback,
          fallbackProvider: usedFallback ? "openrouter" : undefined,
        },
      },
    };
  }

  /**
   * Classify error codes into user-friendly messages.
   * Never displays internal diagnostics to the user.
   */
  private toUserMessage(code: string): string {
    switch (code) {
      case "API_KEY_MISSING":
      case "AUTHENTICATION_ERROR":
        return "Authentication failed. Please check your API key configuration.";
      case "RATE_LIMIT_EXCEEDED":
        return "Too many requests. Please wait a moment and try again.";
      case "QUOTA_EXCEEDED":
      case "API_ERROR_402":
        return "API quota exceeded. Please check your billing settings.";
      case "TIMEOUT":
      case "NETWORK_ERROR":
      case "STREAM_NETWORK_ERROR":
        return "Connection issue. Please check your network and try again.";
      case "PROVIDER_ERROR":
      case "PROVIDER_UNAVAILABLE":
        return "The AI service is temporarily unavailable. Please try again in a moment.";
      case "INVALID_REQUEST":
        return "The request was invalid. Please try rephrasing your input.";
      case "ALL_PROVIDERS_FAILED":
        return "Unable to process your request at this time. Please try again.";
      default:
        return "Something went wrong. Please try again.";
    }
  }
}

// ─── Singleton Export ────────────────────────────────────────────────────

export const AIGateway = new AIGatewayImpl();
