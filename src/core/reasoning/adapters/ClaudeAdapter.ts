/**
 * ClaudeAdapter — Anthropic Claude Messages API integration.
 *
 * RC7: Accepts ONLY a ReasoningPackage. Returns ONLY a ReasoningResult.
 * Follows the same interface as all other adapters.
 *
 * Configuration:
 *   ANTHROPIC_API_KEY - Required environment variable
 *
 * Uses the Messages API (claude-4 or claude-3.5-sonnet).
 */

import type { ReasoningPackage } from "@/core/mind";
import type { ReasoningResult } from "../ReasoningResult";
import type { ReasoningAdapter } from "../ReasoningAdapter";
import type { ModelProfile } from "../ReasoningProvider";
import { buildCognitivePackage } from "./cognitivePackage";

const CLAUDE_BASE_URL = "https://api.anthropic.com/v1";

interface ClaudeResponse {
  id: string;
  type: string;
  model: string;
  content: { type: string; text: string }[];
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

export class ClaudeAdapter implements ReasoningAdapter {
  readonly provider = "claude";
  readonly label = "Anthropic Claude";

  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.ANTHROPIC_API_KEY ?? "";
  }

  isAvailable(): boolean {
    return this.apiKey.length > 0;
  }

  getModels(): { id: string; label: string }[] {
    return [
      { id: "claude-4", label: "Claude 4" },
      { id: "claude-3.5-sonnet", label: "Claude 3.5 Sonnet" },
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
        provider: "claude",
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        cached: false,
        error: {
          code: "API_KEY_MISSING",
          message: "Anthropic API key is not configured. Set ANTHROPIC_API_KEY in .env.local",
          recoverable: true,
        },
      };
    }

    const model = options?.model ?? profile.preferredModel;
    const maxTokens = options?.maxTokens ?? profile.maxOutputTokens;
    const temperature = options?.temperature ?? profile.temperature;

    const { systemPrompt, userMessage } = buildCognitivePackage(pkg, profile);

    try {
      const response = await fetch(`${CLAUDE_BASE_URL}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": this.apiKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model,
          max_tokens: maxTokens,
          temperature,
          system: systemPrompt,
          messages: [
            { role: "user", content: userMessage },
          ],
        }),
        signal: options?.abortSignal,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "Unknown error");
        return {
          content: "",
          model,
          provider: "claude",
          usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
          cached: false,
          error: {
            code: `API_ERROR_${response.status}`,
            message: `Claude API returned ${response.status}: ${errorBody}`,
            recoverable: response.status >= 500,
          },
        };
      }

      const data: ClaudeResponse = await response.json();
      const textContent = data.content?.find(c => c.type === "text")?.text ?? "";

      return {
        content: textContent,
        model: data.model ?? model,
        provider: "claude",
        usage: {
          inputTokens: data.usage?.input_tokens ?? 0,
          outputTokens: data.usage?.output_tokens ?? 0,
          totalTokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
        },
        cached: false,
      };
    } catch (err: any) {
      return {
        content: "",
        model,
        provider: "claude",
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        cached: false,
        error: {
          code: "NETWORK_ERROR",
          message: err?.message ?? "Failed to reach Claude API",
          recoverable: true,
        },
      };
    }
  }
}