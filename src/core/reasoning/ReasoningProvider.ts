/**
 * ReasoningProvider — Types for provider configuration and model profiles.
 *
 * RC7: Each agent type maps to a model profile that determines
 * which model/provider to use and how to configure it.
 */

import type { AgentType } from "../SpyralCognitiveCore";

// ─── Provider Types ──────────────────────────────────────────────────────

export type ProviderType =
  | "openai"
  | "claude"
  | "gemini"
  | "deepseek"
  | "llama"
  | "mock";

export interface ProviderConfig {
  /** Provider type */
  type: ProviderType;
  /** Display name (e.g. "OpenAI GPT-5") */
  label: string;
  /** Whether this provider is available (has API key configured) */
  available: boolean;
  /** Supported models for this provider */
  models: ModelConfig[];
}

export interface ModelConfig {
  /** Model ID (e.g. "gpt-5", "claude-4") */
  id: string;
  /** Display name */
  label: string;
  /** Default temperature */
  temperature: number;
  /** Max output tokens */
  maxOutputTokens: number;
  /** Whether this model supports reasoning efforts */
  supportsReasoning?: boolean;
  /** Default reasoning effort */
  reasoningEffort?: "low" | "medium" | "high";
}

// ─── Model Profiles ──────────────────────────────────────────────────────
// Each agent type requests different reasoning behavior.

export interface ModelProfile {
  /** Preferred provider */
  preferredProvider: ProviderType;
  /** Preferred model */
  preferredModel: string;
  /** Fallback provider if preferred unavailable */
  fallbackProvider: ProviderType;
  /** Temperature (0-2) */
  temperature: number;
  /** Max output tokens */
  maxOutputTokens: number;
  /** Reasoning effort */
  reasoningEffort?: "low" | "medium" | "high" | "auto";
  /** Creativity level (used by creative models) */
  creativity?: "low" | "medium" | "high";
  /** Whether to include chain-of-thought */
  chainOfThought?: boolean;
  /** System prompt instructions specific to this profile */
  systemPromptExtra?: string;
}

// ─── Profile Definitions ─────────────────────────────────────────────────

export const AGENT_PROFILES: Record<AgentType, ModelProfile> = {
  research: {
    preferredProvider: "openai",
    preferredModel: "gpt-5",
    fallbackProvider: "claude",
    temperature: 0.4,
    maxOutputTokens: 4096,
    reasoningEffort: "high",
    chainOfThought: true,
    systemPromptExtra:
      "You are a research partner. Explore ideas deeply. Challenge assumptions. Make cross-domain connections. Never interview — collaborate. The best insights come from pushing past the obvious.",
  },
  content: {
    preferredProvider: "openai",
    preferredModel: "gpt-5",
    fallbackProvider: "gemini",
    temperature: 0.8,
    maxOutputTokens: 8192,
    creativity: "high",
    reasoningEffort: "medium",
    systemPromptExtra:
      "You are a creative director. Shape raw ideas into narratives. Think in metaphors, imagery, and structure. Guide the user's creative expression without writing for them. Focus on what makes stories memorable.",
  },
  consultant: {
    preferredProvider: "openai",
    preferredModel: "gpt-5",
    fallbackProvider: "claude",
    temperature: 0.3,
    maxOutputTokens: 4096,
    reasoningEffort: "high",
    chainOfThought: true,
    systemPromptExtra:
      "You are an executive strategist. Analyze decisions, reveal trade-offs, and recommend direction. Be honest about uncertainty. Challenge assumptions. Every recommendation must consider alternatives.",
  },
  navigation: {
    preferredProvider: "openai",
    preferredModel: "gpt-5",
    fallbackProvider: "claude",
    temperature: 0.4,
    maxOutputTokens: 4096,
    reasoningEffort: "high",
    systemPromptExtra:
      "You are a future planner. Map journeys from current reality to desired reality. Think in trajectories, transformations, and milestones. Identify obstacles and enablers. Always consider multiple paths.",
  },
  command: {
    preferredProvider: "openai",
    preferredModel: "gpt-5",
    fallbackProvider: "mock",
    temperature: 0.2,
    maxOutputTokens: 2048,
    reasoningEffort: "low",
    systemPromptExtra:
      "You are mission control. Route requests to the appropriate agent. Coordinate work and track progress. Keep responses concise and actionable. Delegate deep analysis to specialized agents.",
  },
};

// ─── Available Providers ─────────────────────────────────────────────────

const OPENAI_MODELS: ModelConfig[] = [
  { id: "gpt-5", label: "GPT-5", temperature: 0.4, maxOutputTokens: 8192, supportsReasoning: true, reasoningEffort: "high" },
  { id: "gpt-4.1", label: "GPT-4.1", temperature: 0.4, maxOutputTokens: 8192, supportsReasoning: true, reasoningEffort: "medium" },
  { id: "gpt-4o", label: "GPT-4o", temperature: 0.4, maxOutputTokens: 4096 },
];

const CLAUDE_MODELS: ModelConfig[] = [
  { id: "claude-4", label: "Claude 4", temperature: 0.4, maxOutputTokens: 8192 },
  { id: "claude-3.5-sonnet", label: "Claude 3.5 Sonnet", temperature: 0.4, maxOutputTokens: 4096 },
];

const GEMINI_MODELS: ModelConfig[] = [
  { id: "gemini-2.5-pro", label: "Gemini 2.5 Pro", temperature: 0.4, maxOutputTokens: 8192 },
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", temperature: 0.4, maxOutputTokens: 4096 },
];

const DEEPSEEK_MODELS: ModelConfig[] = [
  { id: "deepseek-v3", label: "DeepSeek V3", temperature: 0.4, maxOutputTokens: 4096 },
  { id: "deepseek-r1", label: "DeepSeek R1", temperature: 0.4, maxOutputTokens: 4096 },
];

const LLAMA_MODELS: ModelConfig[] = [
  { id: "qwen2.5-coder-1.5b", label: "Qwen2.5 Coder 1.5B (Local)", temperature: 0.3, maxOutputTokens: 2048 },
  { id: "qwen3.5-9b", label: "Qwen3.5 9B (Local)", temperature: 0.3, maxOutputTokens: 4096 },
];

const MOCK_MODELS: ModelConfig[] = [
  { id: "mock", label: "Mock Reasoner (Development)", temperature: 0.5, maxOutputTokens: 1024 },
];

/**
 * Get all available providers.
 * Checks for API keys and returns availability status.
 */
export function getAvailableProviders(): ProviderConfig[] {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasDeepSeek = !!process.env.DEEPSEEK_API_KEY;
  const hasLlama = false; // Local LLM detection not implemented yet

  return [
    {
      type: "openai",
      label: "OpenAI",
      available: hasOpenAI,
      models: OPENAI_MODELS,
    },
    {
      type: "claude",
      label: "Anthropic Claude",
      available: hasAnthropic,
      models: CLAUDE_MODELS,
    },
    {
      type: "gemini",
      label: "Google Gemini",
      available: hasGemini,
      models: GEMINI_MODELS,
    },
    {
      type: "deepseek",
      label: "DeepSeek",
      available: hasDeepSeek,
      models: DEEPSEEK_MODELS,
    },
    {
      type: "llama",
      label: "Local LLM",
      available: hasLlama,
      models: LLAMA_MODELS,
    },
    {
      type: "mock",
      label: "Mock Reasoner (Dev)",
      available: true,
      models: MOCK_MODELS,
    },
  ];
}

/**
 * Get the best available provider and model for an agent type.
 * Falls back through the chain: preferred → fallback → mock.
 */
export function resolveProvider(agentType: AgentType): {
  provider: ProviderType;
  model: string;
  profile: ModelProfile;
} {
  const profile = AGENT_PROFILES[agentType];

  // Try preferred provider
  const providers = getAvailableProviders();
  const preferred = providers.find(p => p.type === profile.preferredProvider);
  if (preferred?.available) {
    return {
      provider: profile.preferredProvider,
      model: profile.preferredModel,
      profile,
    };
  }

  // Try fallback
  const fallback = providers.find(p => p.type === profile.fallbackProvider);
  if (fallback?.available) {
    return {
      provider: profile.fallbackProvider,
      model: fallback.models[0]?.id ?? "mock",
      profile,
    };
  }

  // Last resort: any available provider
  const anyAvailable = providers.find(p => p.available);
  if (anyAvailable) {
    return {
      provider: anyAvailable.type,
      model: anyAvailable.models[0]?.id ?? "mock",
      profile,
    };
  }

  // No providers available — use mock
  return {
    provider: "mock",
    model: "mock",
    profile,
  };
}
