/**
 * AIMLAdapter — Unified reasoning provider via AIMLAPI.
 *
 * RC7.2: SPYRAL connects to AIMLAPI as the default reasoning gateway.
 * AIMLAPI provides access to multiple models (GPT, Claude, Gemini, DeepSeek, etc.)
 * through a single API endpoint. The model is selected via configuration.
 *
 * Accepts ONLY a ReasoningPackage. Returns ONLY a ReasoningResult.
 * No UI logic. No React. No formatting.
 *
 * Configuration:
 *   AIMLAPI_API_KEY       - Required environment variable
 *   DEFAULT_REASONING_MODEL - Model identifier (e.g. "openai/gpt-5-5")
 */

import type { ReasoningPackage } from "@/core/mind";
import type { ReasoningResult } from "../ReasoningResult";
import type { ReasoningAdapter } from "../ReasoningAdapter";
import type { ModelProfile } from "../ReasoningProvider";
import { buildCognitivePackage } from "./cognitivePackage";

const AIMLAPI_BASE_URL = "https://api.aimlapi.com/v1";

interface AIMLAPIResponse {
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

export class AIMLAdapter implements ReasoningAdapter {
  readonly provider = "aimlapi";
  readonly label = "AIMLAPI (Unified)";

  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.AIMLAPI_API_KEY ?? "";
  }

  isAvailable(): boolean {
    return this.apiKey.length > 0;
  }

  getModels(): { id: string; label: string }[] {
    return [
      { id: "openai/gpt-5-5", label: "OpenAI GPT-5.5" },
      { id: "openai/gpt-4o", label: "OpenAI GPT-4o" },
      { id: "deepseek/deepseek-r1", label: "DeepSeek R1" },
      { id: "deepseek/deepseek-v3", label: "DeepSeek V3" },
      { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { id: "anthropic/claude-4-sonnet", label: "Claude 4 Sonnet" },
      { id: "meta/llama-3.3", label: "Llama 3.3" },
      { id: "qwen/qwen3", label: "Qwen 3" },
      { id: "mistral-large", label: "Mistral Large" },
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
        provider: "aimlapi",
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        cached: false,
        error: {
          code: "API_KEY_MISSING",
          message: "AIMLAPI key is not configured.",
          recoverable: true,
        },
      };
    }

    const model = options?.model ?? process.env.DEFAULT_REASONING_MODEL ?? profile.preferredModel;
    const maxTokens = options?.maxTokens ?? profile.maxOutputTokens;
    const temperature = options?.temperature ?? profile.temperature;

    const { systemPrompt, userMessage } = buildCognitivePackage(pkg, profile);

    try {
      const response = await fetch(`${AIMLAPI_BASE_URL}/chat/completions`, {
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
        }),
        signal: options?.abortSignal,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "Unknown error");
        return {
          content: "",
          model,
          provider: "aimlapi",
          usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
          cached: false,
          error: {
            code: `API_ERROR_${response.status}`,
            message: `AIMLAPI returned ${response.status}: ${errorBody}`,
            recoverable: response.status >= 500,
          },
        };
      }

      const data: AIMLAPIResponse = await response.json();
      const choice = data.choices?.[0];

      // Developer logging (dev mode only)
      if (process.env.NODE_ENV === "development" || process.env.DEV_MODE === "true") {
        console.log(`[AIMLAdapter] Model used: ${data.model ?? model}`);
        console.log(`[AIMLAdapter] Tokens: ${JSON.stringify(data.usage)}`);
      }

      return {
        content: choice?.message?.content ?? "",
        model: data.model ?? model,
        provider: "aimlapi",
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
        provider: "aimlapi",
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        cached: false,
        error: {
          code: "NETWORK_ERROR",
          message: err?.message ?? "Failed to reach AIMLAPI",
          recoverable: true,
        },
      };
    }
  }
}
