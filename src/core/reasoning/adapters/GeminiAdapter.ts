/**
 * GeminiAdapter — Google Gemini API integration.
 *
 * RC7: Accepts ONLY a ReasoningPackage. Returns ONLY a ReasoningResult.
 * Follows the same interface as all other adapters.
 *
 * Configuration:
 *   GEMINI_API_KEY - Required environment variable
 *
 * Uses the Gemini API (gemini-2.5-pro or gemini-2.0-flash).
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

export class GeminiAdapter implements ReasoningAdapter {
  readonly provider = "gemini";
  readonly label = "Google Gemini";

  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.GEMINI_API_KEY ?? "";
  }

  isAvailable(): boolean {
    return this.apiKey.length > 0;
  }

  getModels(): { id: string; label: string }[] {
    return [
      { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
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

    const model = options?.model ?? profile.preferredModel;
    const maxTokens = options?.maxTokens ?? profile.maxOutputTokens;
    const temperature = options?.temperature ?? profile.temperature;

    const { systemPrompt, userMessage } = buildCognitivePackage(pkg, profile);

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
        return {
          content: "",
          model,
          provider: "gemini",
          usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
          cached: false,
          error: {
            code: `API_ERROR_${response.status}`,
            message: `Gemini API returned ${response.status}: ${errorBody}`,
            recoverable: response.status >= 500,
          },
        };
      }

      const data: GeminiResponse = await response.json();
      const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

      return {
        content: textContent,
        model,
        provider: "gemini",
        usage: {
          inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
          outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
          totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
        },
        cached: false,
      };
    } catch (err: any) {
      return {
        content: "",
        model,
        provider: "gemini",
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        cached: false,
        error: {
          code: "NETWORK_ERROR",
          message: err?.message ?? "Failed to reach Gemini API",
          recoverable: true,
        },
      };
    }
  }
}