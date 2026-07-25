/**
 * ReasoningProvider — Types for provider configuration and model profiles.
 *
 * RC7: Each agent type maps to a model profile that determines
 * which model/provider to use and how to configure it.
 */

import type { AgentType } from "../SpyralCognitiveCore";

// ─── Provider Types ──────────────────────────────────────────────────────

export type ProviderType =
  | "openrouter"
  | "aimlapi"
  | "ollama"
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

// ─── Available Models by Provider ───────────────────────────────────────

const AIMLAPI_MODELS: ModelConfig[] = [
  { id: "openai/gpt-5-5", label: "GPT-5.5 (OpenAI)", temperature: 0.4, maxOutputTokens: 8192, supportsReasoning: true, reasoningEffort: "high" },
  { id: "openai/gpt-4o", label: "GPT-4o (OpenAI)", temperature: 0.4, maxOutputTokens: 4096 },
  { id: "deepseek/deepseek-r1", label: "DeepSeek R1", temperature: 0.5, maxOutputTokens: 4096, supportsReasoning: true, reasoningEffort: "high" },
  { id: "deepseek/deepseek-v3", label: "DeepSeek V3", temperature: 0.7, maxOutputTokens: 8192 },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", temperature: 0.4, maxOutputTokens: 8192, supportsReasoning: true },
  { id: "anthropic/claude-4-sonnet", label: "Claude 4 Sonnet", temperature: 0.4, maxOutputTokens: 8192 },
  { id: "meta/llama-3.3", label: "Llama 3.3", temperature: 0.4, maxOutputTokens: 4096 },
  { id: "qwen/qwen3", label: "Qwen 3", temperature: 0.4, maxOutputTokens: 4096 },
  { id: "mistral-large", label: "Mistral Large", temperature: 0.4, maxOutputTokens: 4096 },
];

const OLLAMA_MODELS: ModelConfig[] = [
  { id: "llama3.2:3b", label: "Llama 3.2 (3B) - Local", temperature: 0.4, maxOutputTokens: 4096 },
  { id: "llama3.2:1b", label: "Llama 3.2 (1B) - Local", temperature: 0.4, maxOutputTokens: 2048 },
  { id: "qwen2.5:7b", label: "Qwen 2.5 (7B) - Local", temperature: 0.4, maxOutputTokens: 4096 },
  { id: "qwen2.5:1.5b", label: "Qwen 2.5 (1.5B) - Local", temperature: 0.4, maxOutputTokens: 2048 },
  { id: "deepseek-r1:7b", label: "DeepSeek R1 (7B) - Local", temperature: 0.5, maxOutputTokens: 4096, supportsReasoning: true },
];

const OPENROUTER_MODELS: ModelConfig[] = [
  { id: "openai/gpt-4o", label: "OpenAI GPT-4o", temperature: 0.4, maxOutputTokens: 3500, supportsReasoning: true },
  { id: "openai/gpt-4.1", label: "OpenAI GPT-4.1", temperature: 0.4, maxOutputTokens: 3500, supportsReasoning: true },
  { id: "anthropic/claude-4-sonnet", label: "Claude 4 Sonnet", temperature: 0.4, maxOutputTokens: 3500 },
  { id: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro", temperature: 0.4, maxOutputTokens: 3500 },
  { id: "deepseek/deepseek-r1", label: "DeepSeek R1", temperature: 0.5, maxOutputTokens: 2000, supportsReasoning: true, reasoningEffort: "high" },
  { id: "deepseek/deepseek-v3", label: "DeepSeek V3", temperature: 0.7, maxOutputTokens: 3500 },
];

// ─── Agent Profiles ─────────────────────────────────────────────────────

export const AGENT_PROFILES: Record<AgentType, ModelProfile> = {
  research: {
    preferredProvider: "openrouter",
    preferredModel: "openai/gpt-4o",
    fallbackProvider: "ollama",
    temperature: 0.4,
    maxOutputTokens: 1000,
    reasoningEffort: "high",
    chainOfThought: true,
    systemPromptExtra:
      `You are an Investigative Scientist.

Your purpose is to explore ideas, challenge assumptions, and build understanding forward.

Rules:
- Contribute before questioning.
- Build the investigation forward with each response.
- Explore ideas deeply. Make cross-domain connections.
- Challenge assumptions — including the user's and your own.
- Never interview the user. Questions are rare and valuable.
- When you ask a question, it should open a new dimension, not fill a form field.`,
  },
  content: {
    preferredProvider: "openrouter",
    preferredModel: "openai/gpt-4o",
    fallbackProvider: "ollama",
    temperature: 0.8,
    maxOutputTokens: 1000,
    creativity: "high",
    reasoningEffort: "medium",
    systemPromptExtra:
      `You are a Creative Director.

Your purpose is to discover emotional truth and shape raw ideas into narratives.

Rules:
- Discover emotional truth before structure.
- Imagine first. Build strategy after vision.
- Think like someone pitching a campaign — every response should feel like a creative spark.
- Never begin with \"Target audience?\" or similar questionnaires.
- Begin thinking. The strategy emerges from the vision.`,
  },
  consultant: {
    preferredProvider: "openrouter",
    preferredModel: "openai/gpt-4o",
    fallbackProvider: "ollama",
    temperature: 0.3,
    maxOutputTokens: 1000,
    reasoningEffort: "high",
    chainOfThought: true,
    systemPromptExtra:
      `You are an Executive Strategy Partner.

Your purpose is to analyze decisions, reveal trade-offs, and recommend direction.

Rules:
- Challenge assumptions — yours and theirs.
- Compare options before recommending.
- Explain trade-offs transparently.
- Recommend only after reasoning through alternatives.
- Never produce reports unless explicitly requested.
- Think out loud, but concisely.`,
  },
  navigation: {
    preferredProvider: "openrouter",
    preferredModel: "openai/gpt-4o",
    fallbackProvider: "ollama",
    temperature: 0.4,
    maxOutputTokens: 1000,
    reasoningEffort: "high",
    systemPromptExtra:
      `You are a Mission Architect.

Your purpose is to map journeys from current reality to desired reality.

Rules:
- Think in milestones, not tasks.
- Identify dependencies between every step.
- Surface risks before they become problems.
- Always consider multiple paths.
- Every journey has alternatives — show them.
- Focus on trajectories, transformations, and decision points.`,
  },
  command: {
    preferredProvider: "openrouter",
    preferredModel: "openai/gpt-4o",
    fallbackProvider: "ollama",
    temperature: 0.2,
    maxOutputTokens: 1000,
    reasoningEffort: "low",
    systemPromptExtra:
      `You are a Chief of Staff.

Your purpose is to coordinate, remember, connect projects, and maintain continuity.

Rules:
- Coordinate across agents and projects.
- Remember context across the entire conversation.
- Connect related work — you see the full picture.
- Maintain continuity between sessions.
- Keep responses concise and actionable.
- Delegate deep analysis to specialized agents.`,
  },
};

// ─── Available Models by Provider ───────────────────────────────────────

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
  { id: "deepseek-chat", label: "DeepSeek Chat (V3)", temperature: 0.7, maxOutputTokens: 8192 },
  { id: "deepseek-reasoner", label: "DeepSeek Reasoner (R1)", temperature: 0.5, maxOutputTokens: 4096 },
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
/**
 * Get all available providers.
 * Checks for API keys and returns availability status.
 * Priority: OpenRouter → AIMLAPI → Ollama → OpenAI → Claude → Gemini → DeepSeek → Mock
 */
export function getAvailableProviders(): ProviderConfig[] {
  const hasOpenRouter = !!process.env.OPENROUTER_API_KEY || !!process.env.OpenrouterAPI;
  const hasAIMLAPI = !!process.env.AIMLAPI_API_KEY;
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasAnthropic = !!process.env.ANTHROPIC_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;
  const hasDeepSeek = !!process.env.DEEPSEEK_API_KEY;
  const hasLlama = false; // Future: Local LLM detection

  return [
    {
      type: "openrouter",
      label: "OpenRouter (Live)",
      available: hasOpenRouter,
      models: OPENROUTER_MODELS,
    },
    {
      type: "aimlapi",
      label: "AIMLAPI (Unified)",
      available: hasAIMLAPI,
      models: AIMLAPI_MODELS,
    },
    {
      type: "ollama",
      label: "Ollama (Local)",
      available: true,
      models: OLLAMA_MODELS,
    },
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
