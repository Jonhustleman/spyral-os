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

    // Build the system prompt
    const systemPrompt = buildSystemPrompt(pkg, profile);

    // Build the user message from ReasoningPackage
    const userMessage = buildUserMessage(pkg);

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

// ─── System Prompt Builder ────────────────────────────────────────────────
// This is the hidden system prompt that defines SPYRAL's cognitive identity.
// Users never see this.

function buildSystemPrompt(pkg: ReasoningPackage, profile: ModelProfile): string {
  const { identity, instructions } = pkg;

  const sections: string[] = [
    `You are ${identity.name}, a cognitive agent within the SPYRAL operating system.`,
    ``,
    `Your role: ${identity.role}`,
    `Your traits: ${identity.traits.join(", ")}`,
    ``,
    `CRITICAL RULES:`,
    `1. LANGUAGE IS THE LAST STEP. Think before you speak. Your response should reflect genuine reasoning, not templates.`,
    `2. NEVER expose internal architecture. Do not mention WorkingMind, Memory, Knowledge Graph, ReasoningPackage, or any pipeline stages.`,
    `3. NEVER say "I understand," "Let me know if," "What do you think?," or any template phrases.`,
    `4. If you're uncertain, say so — but always contribute something useful first.`,
    `5. Your job is to move the user's thinking forward, not to demonstrate how smart you are.`,
    `6. Do not fabricate confidence. Be honest about what you know and don't know.`,
    `7. Each response should: Understand → Think → Connect → Contribute → (Optional) Ask one question that genuinely deepens the inquiry.`,
    `8. Never ask a question without contributing something first. The response must stand on its own.`,
    `9. INTERNAL REASONING METAPHORS (use naturally, sparingly, only when they genuinely help):`,
    `   - Quantum Processing: How ideas exist in superposition until observed`,
    `   - Reality Compression: Reducing complexity to essential patterns`,
    `   - Constraint Folding: How boundaries create structure and possibility`,
    `   - Semantic Resonance: How ideas connect across domains`,
    `   - Temporal Navigation: Tracing ideas backward and forward in time`,
    `   - Pattern Collapse: How multiple possibilities resolve into one insight`,
    ``,
    `Do not overuse these. They are thinking tools, not marketing.`,
    ``,
  ];

  // Add profile-specific instructions
  if (profile.systemPromptExtra) {
    sections.push(profile.systemPromptExtra);
    sections.push(``);
  }

  // Add constraints from the ReasoningPackage
  if (instructions.constraints.length > 0) {
    sections.push(`CONSTRAINTS:`);
    for (const c of instructions.constraints) {
      sections.push(`- ${c}`);
    }
    sections.push(``);
  }

  return sections.join("\n");
}

// ─── User Message Builder ─────────────────────────────────────────────────
// Converts the ReasoningPackage into a structured message for the LLM.

function buildUserMessage(pkg: ReasoningPackage): string {
  const { mind } = pkg;
  const parts: string[] = [];

  // Current mission/investigation context
  if (mind.currentMission || mind.currentInvestigation) {
    parts.push(`Current Mission: ${mind.currentMission ?? mind.currentInvestigation}`);
    parts.push(``);
  }

  // Goal
  parts.push(`Goal: ${mind.goal}`);
  parts.push(``);

  // Context
  parts.push(`Context: ${mind.context}`);
  parts.push(``);

  // Key concepts
  if (mind.entities.length > 0) {
    parts.push(`Key Concepts:`);
    for (const e of mind.entities) {
      parts.push(`- ${e.name} (${e.type})`);
    }
    parts.push(``);
  }

  // Relationships
  if (mind.relationships.length > 0) {
    parts.push(`Relationships:`);
    for (const r of mind.relationships) {
      const source = mind.entities.find(e => e.id === r.sourceId)?.name ?? r.sourceId;
      const target = mind.entities.find(e => e.id === r.targetId)?.name ?? r.targetId;
      parts.push(`- ${source} → ${target}: ${r.type} (${r.description})`);
    }
    parts.push(``);
  }

  // Constraints
  if (mind.constraints.length > 0) {
    parts.push(`Constraints:`);
    for (const c of mind.constraints) parts.push(`- ${c}`);
    parts.push(``);
  }

  // Unknowns
  if (mind.unknowns.length > 0) {
    parts.push(`Unknowns / Gaps:`);
    for (const u of mind.unknowns) parts.push(`- ${u}`);
    parts.push(``);
  }

  // Hypotheses to consider
  if (mind.hypotheses.length > 0) {
    parts.push(`Possible Hypotheses (consider these):`);
    for (const h of mind.hypotheses) {
      parts.push(`## ${h.title}: ${h.description}`);
    }
    parts.push(``);
  }

  // Simulations to explore
  if (mind.simulations.length > 0) {
    parts.push(`What-If Scenarios (explore these):`);
    for (const s of mind.simulations) {
      parts.push(`## ${s.title}: ${s.description}`);
    }
    parts.push(``);
  }

  // Memory
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

  // Open questions
  if (mind.openQuestions.length > 0) {
    parts.push(`Questions to Consider:`);
    for (const q of mind.openQuestions) parts.push(`- ${q.text}`);
    parts.push(``);
  }

  // Final instruction
  parts.push(`Based on the above, provide your reasoning and response.`);

  return parts.join("\n");
}
