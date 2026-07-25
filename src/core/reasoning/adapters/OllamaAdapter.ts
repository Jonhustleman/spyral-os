/**
 * OllamaAdapter — Local reasoning via Ollama.
 *
 * RC7.2: SPYRAL connects to local Ollama for offline-first reasoning.
 * Uses the Ollama API at http://127.0.0.1:11434/api/chat.
 * Falls back gracefully if Ollama is not running.
 *
 * Accepts ONLY a ReasoningPackage. Returns ONLY a ReasoningResult.
 * No UI logic. No React. No formatting.
 *
 * Configuration:
 *   OLLAMA_BASE_URL - Optional override (default: http://127.0.0.1:11434)
 *   OLLAMA_MODEL    - Optional override (default: llama3.2:3b)
 */

import type { ReasoningPackage } from "@/core/mind";
import type { ReasoningResult } from "../ReasoningResult";
import type { ReasoningAdapter } from "../ReasoningAdapter";
import type { ModelProfile } from "../ReasoningProvider";
import { buildCognitivePackage } from "./cognitivePackage";

const DEFAULT_BASE_URL = "http://127.0.0.1:11434";
const DEFAULT_MODEL = "llama3.2:3b";

interface OllamaChatResponse {
  model: string;
  created_at: string;
  message?: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

interface OllamaTagsResponse {
  models?: {
    name: string;
    modified_at: string;
    size: number;
  }[];
}

export class OllamaAdapter implements ReasoningAdapter {
  readonly provider = "ollama";
  readonly label = "Ollama (Local)";

  private baseUrl: string;
  private defaultModel: string;

  constructor(baseUrl?: string, defaultModel?: string) {
    this.baseUrl = baseUrl ?? process.env.OLLAMA_BASE_URL ?? DEFAULT_BASE_URL;
    this.defaultModel = defaultModel ?? process.env.OLLAMA_MODEL ?? DEFAULT_MODEL;
  }

  isAvailable(): boolean {
    // We can't do async checks here synchronously, so assume available
    // The Router will handle fallback if the API call fails
    return true;
  }

  /**
   * Check if Ollama is actually running (async version).
   * Used by getAvailableProviders to determine if Ollama should be listed.
   */
  async checkRunning(): Promise<boolean> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 2000);
      const r = await fetch(`${this.baseUrl}/api/tags`, {
        signal: controller.signal,
      });
      clearTimeout(timeout);
      return r.ok;
    } catch {
      return false;
    }
  }

  getModels(): { id: string; label: string }[] {
    // Return common Ollama models - actual available models are queried dynamically
    return [
      { id: "llama3.2:3b", label: "Llama 3.2 (3B)" },
      { id: "llama3.2:1b", label: "Llama 3.2 (1B)" },
      { id: "llama3.1:8b", label: "Llama 3.1 (8B)" },
      { id: "llama3.1:70b", label: "Llama 3.1 (70B)" },
      { id: "qwen2.5:7b", label: "Qwen 2.5 (7B)" },
      { id: "qwen2.5:1.5b", label: "Qwen 2.5 (1.5B)" },
      { id: "mistral:7b", label: "Mistral (7B)" },
      { id: "gemma2:9b", label: "Gemma 2 (9B)" },
      { id: "phi3:3.8b", label: "Phi-3 (3.8B)" },
      { id: "deepseek-r1:7b", label: "DeepSeek R1 (7B)" },
      { id: "deepseek-coder:6.7b", label: "DeepSeek Coder (6.7B)" },
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
    const model = options?.model ?? process.env.OLLAMA_MODEL ?? profile.preferredModel ?? this.defaultModel;
    const maxTokens = options?.maxTokens ?? profile.maxOutputTokens;
    const temperature = options?.temperature ?? profile.temperature;

    const { systemPrompt, userMessage } = buildCognitivePackage(pkg, profile);

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          stream: false,
          options: {
            temperature,
            num_predict: maxTokens,
          },
        }),
        signal: options?.abortSignal,
      });

      if (!response.ok) {
        const errorBody = await response.text().catch(() => "Unknown error");
        return {
          content: "",
          model,
          provider: "ollama",
          usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
          cached: false,
          error: {
            code: `API_ERROR_${response.status}`,
            message: `Ollama returned ${response.status}: ${errorBody}`,
            recoverable: response.status >= 500,
          },
        };
      }

      const data: OllamaChatResponse = await response.json();

      // Developer logging (dev mode only)
      if (process.env.NODE_ENV === "development" || process.env.DEV_MODE === "true") {
        console.log(`[OllamaAdapter] Model used: ${data.model ?? model}`);
        console.log(`[OllamaAdapter] Eval count: ${data.eval_count}`);
      }

      return {
        content: data.message?.content ?? "",
        model: data.model ?? model,
        provider: "ollama",
        usage: {
          inputTokens: data.prompt_eval_count ?? 0,
          outputTokens: data.eval_count ?? 0,
          totalTokens: (data.prompt_eval_count ?? 0) + (data.eval_count ?? 0),
        },
        cached: false,
      };
    } catch (err: any) {
      return {
        content: "",
        model,
        provider: "ollama",
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        cached: false,
        error: {
          code: "NETWORK_ERROR",
          message: err?.message ?? "Failed to reach Ollama. Is it running?",
          recoverable: true,
        },
      };
    }
  }
}
