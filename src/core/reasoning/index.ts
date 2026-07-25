/**
 * Reasoning Module — RC7
 *
 * The universal reasoning infrastructure for SPYRAL OS.
 * Routes structured thought (ReasoningPackage) to the best available LLM
 * and returns structured results (ReasoningResult).
 *
 * Architecture:
 *   ReasoningPackage → ReasoningRouter → Adapter → LLM → ReasoningResult
 *                                          → MockAdapter (dev fallback)
 *
 * No adapter knows about pages, React, or application state.
 * The router is the ONLY entry point for reasoning.
 */

import { registerAdapter } from "./ReasoningRouter";
export { getAdapter, getAllAdapters, routeReasoning, routeReasoningStream } from "./ReasoningRouter";

export type { ReasoningResult } from "./ReasoningResult";

export type { ReasoningAdapter } from "./ReasoningAdapter";

export type {
  ProviderType,
  ProviderConfig,
  ModelConfig,
  ModelProfile,
} from "./ReasoningProvider";

export {
  AGENT_PROFILES,
  getAvailableProviders,
  resolveProvider,
} from "./ReasoningProvider";

// ─── Adapter imports (for use in initReasoningSystem) ─────────────────────

import { OpenAIAdapter } from "./adapters/OpenAIAdapter";
export { OpenAIAdapter } from "./adapters/OpenAIAdapter";

import { MockAdapter } from "./adapters/MockAdapter";
export { MockAdapter } from "./adapters/MockAdapter";

import { ClaudeAdapter } from "./adapters/ClaudeAdapter";
export { ClaudeAdapter } from "./adapters/ClaudeAdapter";

import { GeminiAdapter } from "./adapters/GeminiAdapter";
export { GeminiAdapter } from "./adapters/GeminiAdapter";

import { DeepSeekAdapter } from "./adapters/DeepSeekAdapter";
export { DeepSeekAdapter } from "./adapters/DeepSeekAdapter";

import { AIMLAdapter } from "./adapters/AIMLAdapter";
export { AIMLAdapter } from "./adapters/AIMLAdapter";

import { OllamaAdapter } from "./adapters/OllamaAdapter";
export { OllamaAdapter } from "./adapters/OllamaAdapter";

import { OpenRouterAdapter } from "./adapters/OpenRouterAdapter";
export { OpenRouterAdapter } from "./adapters/OpenRouterAdapter";

/**
 * Initialize the reasoning system with all available adapters.
 * Call once at app startup.
 * Each adapter checks its own API key availability.
 * Priority: OpenRouter → Ollama → AIMLAPI → OpenAI → Claude → Gemini → DeepSeek → Mock
 */
export function initReasoningSystem(): void {
  registerAdapter(new OpenRouterAdapter());
  registerAdapter(new OllamaAdapter());
  registerAdapter(new AIMLAdapter());
  registerAdapter(new MockAdapter());
  registerAdapter(new OpenAIAdapter());
  registerAdapter(new ClaudeAdapter());
  registerAdapter(new GeminiAdapter());
  registerAdapter(new DeepSeekAdapter());
}
