/**
 * OpenAIAdapter — OpenAI Responses API integration.
 *
 * RC7: Uses the Responses API (preferred over Chat Completions).
 * Accepts ONLY a ReasoningPackage. Returns ONLY a ReasoningResult.
 *
 * Configuration:
 *   OPENAI_API_KEY - Required environment variable
 *   OPENAI_MODEL - Optional override (default: gpt-5)
 *
 * Settings (can be overridden per-request via ModelProfile):
 *   temperature, max_output_tokens, reasoning effort
 */

import type { ReasoningPackage } from "@/core/mind";
import type { ReasoningResult } from "../ReasoningResult";
import type { ReasoningAdapter } from "../ReasoningAdapter";
import type { ModelProfile } from "../ReasoningProvider";
import { buildCognitivePackage } from "./cognitivePackage";

const OPENAI_BASE_URL = "https://api.openai.com/v1";

interface OpenAIResponse {
  id: string;
  object: string;
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

export class OpenAIAdapter implements ReasoningAdapter {
  readonly provider = "openai";
  readonly label = "OpenAI";

  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.OPENAI_API_KEY ?? "";
  }

  isAvailable(): boolean {
    return this.apiKey.length > 0;
  }

  getModels(): { id: string; label: string }[] {
    return [
      { id: "gpt-5", label: "GPT-5" },
      { id: "gpt-4.1", label: "GPT-4.1" },
      { id: "gpt-4o", label: "GPT-4o" },
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
        provider: "openai",
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        cached: false,
        error: {
          code: "API_KEY_MISSING",
          message: "OpenAI API key is not configured. Set OPENAI_API_KEY in .env.local",
          recoverable: true,
        },
      };
    }

    const model = options?.model ?? profile.preferredModel;
    const maxTokens = options?.maxTokens ?? profile.maxOutputTokens;
    const temperature = options?.temperature ?? profile.temperature;

    const { systemPrompt, userMessage } = buildCognitivePackage(pkg, profile);

    try {
      const response = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          max_tokens: maxTokens,
          temperature,
          ...(profile.reasoningEffort && profile.reasoningEffort !== "low"
            ? { reasoning_effort: profile.reasoningEffort }
            : {}),
        }),
        signal: options?.abortSignal,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "Unknown error");
        return {
          content: "",
          model,
          provider: "openai",
          usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
          cached: false,
          error: {
            code: `API_ERROR_${response.status}`,
            message: `OpenAI API returned ${response.status}: ${errorBody}`,
            recoverable: response.status >= 500,
          },
        };
      }

      const data: OpenAIResponse = await response.json();
      const choice = data.choices?.[0];

      return {
        content: choice?.message?.content ?? "",
        model: data.model ?? model,
        provider: "openai",
        usage: {
          inputTokens: data.usage?.prompt_tokens ?? 0,
          outputTokens: data.usage?.completion_tokens ?? 0,
          totalTokens: data.usage?.total_tokens ?? 0,
        },
        cached: false,
      };
    } catch (err: any) {
      return {
        content: "",
        model,
        provider: "openai",
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        cached: false,
        error: {
          code: "NETWORK_ERROR",
          message: err?.message ?? "Failed to reach OpenAI API",
          recoverable: true,
        },
      };
    }
  }
}
