/**
 * GeminiAdapter — Google Gemini API integration.
 *
 * RC7: Accepts ONLY a ReasoningPackage. Returns ONLY a ReasoningResult.
 * Follows the same interface as all other adapters.
 *
 * Configuration:
 *   GEMINI_API_KEY - Required environment variable
 *   GEMINI_MODEL   - Model identifier (default: "gemini-2.5-flash")
 *
 * Uses the Gemini API with streaming support for all responses.
 */

import type { ReasoningPackage } from "@/core/mind";
import type { ReasoningResult } from "../ReasoningResult";
import type { ReasoningAdapter } from "../ReasoningAdapter";
import type { ModelProfile } from "../ReasoningProvider";
import { buildCognitivePackage } from "./cognitivePackage";

const GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta";

interface GeminiResponse {
  candidates: {
    content: {
      parts: { text: string }[];
    };
    finishReason: string;
  }[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

interface GeminiStreamChunk {
  candidates?: {
    content: {
      parts: { text: string }[];
    };
    finishReason?: string;
  }[];
  usageMetadata?: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

export class GeminiAdapter implements ReasoningAdapter {
  readonly provider = "gemini";
  readonly label = "Google Gemini";

  private apiKey: string;
  private defaultModel: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.GEMINI_API_KEY ?? "";
    this.defaultModel = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
  }

  isAvailable(): boolean {
    return this.apiKey.length > 0;
  }

  getModels(): { id: string; label: string }[] {
    return [
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
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
        provider: "gemini",
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        cached: false,
        error: {
          code: "API_KEY_MISSING",
          message: "Gemini API key is not configured. Set GEMINI_API_KEY in .env.local",
          recoverable: true,
        },
      };
    }

    const model = options?.model ?? this.defaultModel;
    const maxTokens = options?.maxTokens ?? profile.maxOutputTokens;
    const temperature = options?.temperature ?? profile.temperature;

    const { systemPrompt, userMessage } = buildCognitivePackage(pkg, profile);

    const startTime = Date.now();

    try {
      const url = `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${this.apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              parts: [{ text: userMessage }],
            },
          ],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature,
          },
        }),
        signal: options?.abortSignal,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "Unknown error");
        return this.classifyError(response.status, errorBody, model, startTime);
      }

      const data: GeminiResponse = await response.json();
      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
      const durationMs = Date.now() - startTime;

      return {
        content: textContent,
        model,
        provider: "gemini",
        usage: {
          inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
          outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
          totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
        },
        reasoning: { durationMs },
        cached: false,
      };
    } catch (err: any) {
      return {
        content: "",
        model,
        provider: "gemini",
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        reasoning: { durationMs: Date.now() - startTime },
        cached: false,
        error: {
          code: "NETWORK_ERROR",
          message: err?.message ?? "Failed to reach Gemini API",
          recoverable: true,
        },
      };
    }
  }

  /**
   * streamReason — Stream a response from Gemini using SSE.
   *
   * Uses Gemini's server-sent events streaming endpoint.
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
        provider: "gemini",
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        cached: false,
        error: {
          code: "API_KEY_MISSING",
          message: "Gemini API key is not configured.",
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
    let inputTokens = 0;
    let outputTokens = 0;
    let totalTokens = 0;

    try {
      // Gemini streaming endpoint: streamGenerateContent with alt=sse
      const url = `${GEMINI_BASE_URL}/models/${model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          contents: [
            {
              parts: [{ text: userMessage }],
            },
          ],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature,
          },
        }),
        signal: options?.abortSignal,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "Unknown error");
        const errorResult = this.classifyError(response.status, errorBody, model, startTime);
        return errorResult;
      }

      // Read the SSE stream
      const reader = response.body?.getReader();
      if (!reader) {
        return {
          content: "",
          model,
          provider: "gemini",
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
          if (!data || data === "[DONE]") continue;

          try {
            const parsed: GeminiStreamChunk = JSON.parse(data);
            const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
            if (text) {
              fullContent += text;
              yield text;
            }

            // Track usage from metadata if present
            if (parsed.usageMetadata) {
              inputTokens = parsed.usageMetadata.promptTokenCount ?? 0;
              outputTokens = parsed.usageMetadata.candidatesTokenCount ?? 0;
              totalTokens = parsed.usageMetadata.totalTokenCount ?? 0;
            }
          } catch {
            // Skip malformed SSE lines
          }
        }
      }

      const durationMs = Date.now() - startTime;

      return {
        content: fullContent,
        model,
        provider: "gemini",
        usage: { inputTokens, outputTokens, totalTokens },
        reasoning: { durationMs },
        cached: false,
      };
    } catch (err: any) {
      return {
        content: fullContent,
        model,
        provider: "gemini",
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

  /**
   * Classify HTTP errors into structured error codes with user-friendly messages.
   */
  private classifyError(
    status: number,
    body: string,
    model: string,
    startTime: number,
  ): ReasoningResult {
    const base = {
      content: "",
      model,
      provider: "gemini",
      usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 } as const,
      reasoning: { durationMs: Date.now() - startTime },
      cached: false,
    };

    // Try to extract a meaningful message from the response body
    let apiMessage = body;
    try {
      const parsed = JSON.parse(body);
      if (parsed.error?.message) {
        apiMessage = parsed.error.message;
      }
    } catch {
      // Use raw body
    }

    switch (status) {
      case 400:
        // Gemini returns 400 for invalid API keys — detect and reclassify
        if (/api.?key|invalid key|authentication/i.test(apiMessage)) {
          return {
            ...base,
            error: {
              code: "AUTHENTICATION_ERROR",
              message: apiMessage,
              recoverable: true,
            },
          };
        }
        return {
          ...base,
          error: {
            code: "INVALID_REQUEST",
            message: apiMessage,
            recoverable: true,
          },
        };
      case 401:
      case 403:
        return {
          ...base,
          error: {
            code: "AUTHENTICATION_ERROR",
            message: apiMessage,
            recoverable: false,
          },
        };
      case 429:
        return {
          ...base,
          error: {
            code: "RATE_LIMIT_EXCEEDED",
            message: "Too many requests. Please wait a moment and try again.",
            recoverable: true,
          },
        };
      case 402:
        return {
          ...base,
          error: {
            code: "QUOTA_EXCEEDED",
            message: apiMessage,
            recoverable: true,
          },
        };
      case 500:
      case 502:
      case 503:
        return {
          ...base,
          error: {
            code: "PROVIDER_ERROR",
            message: apiMessage,
            recoverable: true,
          },
        };
      default:
        return {
          ...base,
          error: {
            code: `API_ERROR_${status}`,
            message: apiMessage,
            recoverable: status >= 500,
          },
        };
    }
  }
}