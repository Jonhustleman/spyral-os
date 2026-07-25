/**
 * OpenRouterAdapter — Live intelligence via OpenRouter.
 *
 * RC8: SPYRAL connects to OpenRouter as the primary reasoning provider.
 * OpenRouter provides access to 300+ models (GPT, Claude, Gemini, DeepSeek, Llama, etc.)
 * through a single OpenAI-compatible API endpoint.
 *
 * Accepts ONLY a ReasoningPackage. Returns ONLY a ReasoningResult.
 * No UI logic. No React. No formatting. No business logic.
 *
 * Configuration (environment variables):
 *   OPENROUTER_API_KEY   - Required. OpenRouter API key.
 *   OPENROUTER_MODEL     - Model identifier (default: "openai/gpt-4o")
 *   OPENROUTER_REFERER   - HTTP Referer header (default: "https://spyral-os.vercel.app")
 *   OPENROUTER_TITLE     - X-Title header (default: "SPYRAL OS")
 */

import type { ReasoningPackage } from "@/core/mind";
import type { ReasoningResult } from "../ReasoningResult";
import type { ReasoningAdapter } from "../ReasoningAdapter";
import type { ModelProfile } from "../ReasoningProvider";
import { buildCognitivePackage } from "./cognitivePackage";

const OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1";

interface OpenRouterResponse {
  id: string;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class OpenRouterAdapter implements ReasoningAdapter {
  readonly provider = "openrouter";
  readonly label = "OpenRouter (Live)";

  private apiKey: string;
  private defaultModel: string;
  private referer: string;
  private title: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.OPENROUTER_API_KEY ?? "";
    this.defaultModel = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o";
    this.referer = process.env.OPENROUTER_REFERER ?? "https://spyral-os.vercel.app";
    this.title = process.env.OPENROUTER_TITLE ?? "SPYRAL OS";
  }

  isAvailable(): boolean {
    return this.apiKey.length > 0;
  }

  getModels(): { id: string; label: string }[] {
    return [
      { id: "openai/gpt-4o", label: "OpenAI GPT-4o" },
      { id: "openai/gpt-4.1", label: "OpenAI GPT-4.1" },
      { id: "anthropic/claude-4-sonnet", label: "Claude 4 Sonnet" },
      { id: "anthropic/claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
      { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { id: "google/gemini-2.0-flash", label: "Gemini 2.0 Flash" },
      { id: "deepseek/deepseek-r1", label: "DeepSeek R1" },
      { id: "deepseek/deepseek-v3", label: "DeepSeek V3" },
      { id: "meta-llama/llama-3.3-70b", label: "Llama 3.3 70B" },
      { id: "qwen/qwen3-72b", label: "Qwen 3 72B" },
      { id: "mistral/mistral-large", label: "Mistral Large" },
    ];
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
    if (!this.isAvailable()) {
      return {
        content: "",
        model: options?.model ?? "none",
        provider: "openrouter",
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        cached: false,
        error: {
          code: "API_KEY_MISSING",
          message: "OpenRouter API key is not configured.",
          recoverable: true,
        },
      };
    }

    const model = options?.model ?? this.defaultModel;
    const maxTokens = options?.maxTokens ?? profile.maxOutputTokens;
    const temperature = options?.temperature ?? profile.temperature;

    // Build the complete cognitive package
    const { systemPrompt, userMessage } = buildCognitivePackage(pkg, profile);

    const startTime = Date.now();

    try {
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer": this.referer,
          "X-Title": this.title,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          max_tokens: maxTokens,
          temperature,
          stream: false,
        }),
        signal: options?.abortSignal,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "Unknown error");
        return {
          content: "",
          model,
          provider: "openrouter",
          usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
          reasoning: { durationMs: Date.now() - startTime },
          cached: false,
          error: {
            code: `API_ERROR_${response.status}`,
            message: `OpenRouter returned ${response.status}: ${errorBody}`,
            recoverable: response.status >= 500,
          },
        };
      }

      const data: OpenRouterResponse = await response.json();
      const choice = data.choices?.[0];
      const durationMs = Date.now() - startTime;

      // Developer logging (dev mode only)
      if (process.env.NODE_ENV === "development" || process.env.DEV_MODE === "true") {
        console.log(`[OpenRouter] Model: ${data.model ?? model}`);
        console.log(`[OpenRouter] Tokens: ${JSON.stringify(data.usage)}`);
        console.log(`[OpenRouter] Latency: ${durationMs}ms`);
      }

      return {
        content: choice?.message?.content ?? "",
        model: data.model ?? model,
        provider: "openrouter",
        usage: {
          inputTokens: data.usage?.prompt_tokens ?? 0,
          outputTokens: data.usage?.completion_tokens ?? 0,
          totalTokens: data.usage?.total_tokens ?? 0,
        },
        reasoning: { durationMs },
        cached: false,
      };
    } catch (err: any) {
      return {
        content: "",
        model,
        provider: "openrouter",
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        reasoning: { durationMs: Date.now() - startTime },
        cached: false,
        error: {
          code: "NETWORK_ERROR",
          message: err?.message ?? "Failed to reach OpenRouter",
          recoverable: true,
        },
      };
    }
  }

  /**
   * streamReason — Stream a response from OpenRouter.
   *
   * Uses the OpenAI-compatible streaming API (SSE).
   * Yields content chunks as they arrive from the model.
   * Returns the complete ReasoningResult when the stream ends.
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
    if (!this.isAvailable()) {
      return {
        content: "",
        model: options?.model ?? "none",
        provider: "openrouter",
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        cached: false,
        error: {
          code: "API_KEY_MISSING",
          message: "OpenRouter API key is not configured.",
          recoverable: true,
        },
      };
    }

    const model = options?.model ?? this.defaultModel;
    const maxTokens = options?.maxTokens ?? profile.maxOutputTokens;
    const temperature = options?.temperature ?? profile.temperature;
    const { systemPrompt, userMessage } = buildCognitivePackage(pkg, profile);
    const startTime = Date.now();

    let fullContent = "";
    let finalModel = model;
    let inputTokens = 0;
    let outputTokens = 0;
    let totalTokens = 0;

    try {
      const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
          "HTTP-Referer": this.referer,
          "X-Title": this.title,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          max_tokens: maxTokens,
          temperature,
          stream: true,
        }),
        signal: options?.abortSignal,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "Unknown error");
        return {
          content: "",
          model,
          provider: "openrouter",
          usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
          reasoning: { durationMs: Date.now() - startTime },
          cached: false,
          error: {
            code: `API_ERROR_${response.status}`,
            message: `OpenRouter returned ${response.status}: ${errorBody}`,
            recoverable: response.status >= 500,
          },
        };
      }

      // Read the streamed response
      const reader = response.body?.getReader();
      if (!reader) {
        return {
          content: "",
          model,
          provider: "openrouter",
          usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
          reasoning: { durationMs: Date.now() - startTime },
          cached: false,
          error: {
            code: "STREAM_ERROR",
            message: "Failed to read streaming response",
            recoverable: true,
          },
        };
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data:")) continue;

          const data = trimmed.slice(5).trim();
          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              fullContent += delta;
              yield delta;
            }

            // Track model and usage from the final chunk
            if (parsed.model) finalModel = parsed.model;
            if (parsed.usage) {
              inputTokens = parsed.usage.prompt_tokens ?? 0;
              outputTokens = parsed.usage.completion_tokens ?? 0;
              totalTokens = parsed.usage.total_tokens ?? 0;
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }

      const durationMs = Date.now() - startTime;

      // Developer logging
      if (process.env.NODE_ENV === "development" || process.env.DEV_MODE === "true") {
        console.log(`[OpenRouter] Stream complete — Model: ${finalModel}, Tokens: ${totalTokens}, Latency: ${durationMs}ms`);
      }

      return {
        content: fullContent,
        model: finalModel,
        provider: "openrouter",
        usage: { inputTokens, outputTokens, totalTokens },
        reasoning: { durationMs },
        cached: false,
      };
    } catch (err: any) {
      return {
        content: fullContent,
        model,
        provider: "openrouter",
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        reasoning: { durationMs: Date.now() - startTime },
        cached: false,
        error: {
          code: "STREAM_NETWORK_ERROR",
          message: err?.message ?? "Streaming failed",
          recoverable: true,
        },
      };
    }
  }
}
