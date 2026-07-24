/**
 * DeepSeekAdapter — DeepSeek Chat API integration.
 *
 * RC7: Accepts ONLY a ReasoningPackage. Returns ONLY a ReasoningResult.
 * Follows the same interface as all other adapters.
 *
 * DeepSeek uses an OpenAI-compatible API, so this adapter is structurally
 * similar to OpenAIAdapter but with different base URL and models.
 *
 * Configuration:
 *   DEEPSEEK_API_KEY - Required environment variable
 *
 * DeepSeek becomes the free/default fallback where appropriate.
 */

import type { ReasoningPackage } from "@/core/mind";
import type { ReasoningResult } from "../ReasoningResult";
import type { ReasoningAdapter } from "../ReasoningAdapter";
import type { ModelProfile } from "../ReasoningProvider";

const DEEPSEEK_BASE_URL = "https://api.deepseek.com/v1";

interface DeepSeekResponse {
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

export class DeepSeekAdapter implements ReasoningAdapter {
  readonly provider = "deepseek";
  readonly label = "DeepSeek";

  private apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey ?? process.env.DEEPSEEK_API_KEY ?? "";
  }

  isAvailable(): boolean {
    return this.apiKey.length > 0;
  }

  getModels(): { id: string; label: string }[] {
    return [
      { id: "deepseek-chat", label: "DeepSeek Chat (V3)" },
      { id: "deepseek-reasoner", label: "DeepSeek Reasoner (R1)" },
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
        provider: "deepseek",
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        cached: false,
        error: {
          code: "API_KEY_MISSING",
          message: "DeepSeek API key is not configured. Set DEEPSEEK_API_KEY in .env.local",
          recoverable: true,
        },
      };
    }

    const model = options?.model ?? profile.preferredModel;
    const maxTokens = options?.maxTokens ?? profile.maxOutputTokens;
    const temperature = options?.temperature ?? profile.temperature;

    const systemPrompt = buildSystemPrompt(pkg, profile);
    const userMessage = buildUserMessage(pkg);

    try {
      const response = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
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
          provider: "deepseek",
          usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
          cached: false,
          error: {
            code: `API_ERROR_${response.status}`,
            message: `DeepSeek API returned ${response.status}: ${errorBody}`,
            recoverable: response.status >= 500,
          },
        };
      }

      const data: DeepSeekResponse = await response.json();
      const choice = data.choices?.[0];

      return {
        content: choice?.message?.content ?? "",
        model: data.model ?? model,
        provider: "deepseek",
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
        provider: "deepseek",
        usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
        cached: false,
        error: {
          code: "NETWORK_ERROR",
          message: err?.message ?? "Failed to reach DeepSeek API",
          recoverable: true,
        },
      };
    }
  }
}

// ─── System Prompt Builder ────────────────────────────────────────────────

function buildSystemPrompt(pkg: ReasoningPackage, profile: ModelProfile): string {
  const { identity, instructions } = pkg;
  const sections: string[] = [
    `You are ${identity.name}, a cognitive agent within the SPYRAL operating system.`,
    ``,
    `Your role: ${identity.role}`,
    `Your traits: ${identity.traits.join(", ")}`,
    ``,
    `CRITICAL RULES:`,
    `1. LANGUAGE IS THE LAST STEP. Think before you speak.`,
    `2. NEVER expose internal architecture.`,
    `3. NEVER say "I understand," "Let me know if," "What do you think?," or any template phrases.`,
    `4. If you're uncertain, say so — but always contribute something useful first.`,
    `5. Your job is to move the user's thinking forward, not to demonstrate how smart you are.`,
    `6. Each response should: Understand → Think → Connect → Contribute → (Optional) One question.`,
    `7. Never ask a question without contributing something first.`,
    ``,
  ];

  if (profile.systemPromptExtra) {
    sections.push(profile.systemPromptExtra);
    sections.push(``);
  }

  if (instructions.constraints.length > 0) {
    sections.push(`CONSTRAINTS:`);
    for (const c of instructions.constraints) sections.push(`- ${c}`);
    sections.push(``);
  }

  return sections.join("\n");
}

// ─── User Message Builder ─────────────────────────────────────────────────

function buildUserMessage(pkg: ReasoningPackage): string {
  const { mind } = pkg;
  const parts: string[] = [];

  if (mind.currentMission || mind.currentInvestigation) {
    parts.push(`Current Mission: ${mind.currentMission ?? mind.currentInvestigation}`);
    parts.push(``);
  }

  parts.push(`Goal: ${mind.goal}`);
  parts.push(``);
  parts.push(`Context: ${mind.context}`);
  parts.push(``);

  if (mind.entities.length > 0) {
    parts.push(`Key Concepts:`);
    for (const e of mind.entities) parts.push(`- ${e.name} (${e.type})`);
    parts.push(``);
  }

  if (mind.relationships.length > 0) {
    parts.push(`Relationships:`);
    for (const r of mind.relationships) {
      const source = mind.entities.find(e => e.id === r.sourceId)?.name ?? r.sourceId;
      const target = mind.entities.find(e => e.id === r.targetId)?.name ?? r.targetId;
      parts.push(`- ${source} → ${target}: ${r.type}`);
    }
    parts.push(``);
  }

  if (mind.constraints.length > 0) {
    parts.push(`Constraints:`);
    for (const c of mind.constraints) parts.push(`- ${c}`);
    parts.push(``);
  }

  if (mind.unknowns.length > 0) {
    parts.push(`Unknowns / Gaps:`);
    for (const u of mind.unknowns) parts.push(`- ${u}`);
    parts.push(``);
  }

  if (mind.hypotheses.length > 0) {
    parts.push(`Hypotheses to consider:`);
    for (const h of mind.hypotheses) parts.push(`## ${h.title}: ${h.description}`);
    parts.push(``);
  }

  if (mind.simulations.length > 0) {
    parts.push(`What-If Scenarios:`);
    for (const s of mind.simulations) parts.push(`## ${s.title}: ${s.description}`);
    parts.push(``);
  }

  const memoryEntries = [
    ...mind.activeMemory.identity,
    ...mind.activeMemory.patterns,
    ...mind.activeMemory.preferences,
    ...mind.activeMemory.previousDiscoveries,
  ];
  if (memoryEntries.length > 0) {
    parts.push(`Relevant Memory:`);
    for (const m of memoryEntries) parts.push(`- ${m}`);
    parts.push(``);
  }

  if (mind.openQuestions.length > 0) {
    parts.push(`Questions to Consider:`);
    for (const q of mind.openQuestions) parts.push(`- ${q.text}`);
    parts.push(``);
  }

  parts.push(`Based on the above, provide your reasoning and response.`);

  return parts.join("\n");
}