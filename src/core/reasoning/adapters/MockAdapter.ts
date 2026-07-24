/**
 * MockAdapter — Development-only mock reasoner.
 *
 * RC7: Exists ONLY for development when no real LLM is available.
 * Never market it as intelligence. Never fake reasoning.
 *
 * Displays a fallback message instead of pretending to be intelligent.
 */

import type { ReasoningPackage } from "@/core/mind";
import type { ReasoningResult } from "../ReasoningResult";
import type { ReasoningAdapter } from "../ReasoningAdapter";
import type { ModelProfile } from "../ReasoningProvider";

export class MockAdapter implements ReasoningAdapter {
  readonly provider = "mock";
  readonly label = "Mock Reasoner (Dev)";

  isAvailable(): boolean {
    return true;
  }

  getModels(): { id: string; label: string }[] {
    return [{ id: "mock", label: "Mock Reasoner" }];
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
    // Simulate a small delay like a real LLM
    await new Promise(resolve => setTimeout(resolve, 300));

    const { mind, identity } = pkg;

    // Build a simple mock response based on the WorkingMind state
    const entityCount = mind.entities.length;
    const relCount = mind.relationships.length;
    const hasHypotheses = mind.hypotheses.length > 0;
    const hasSimulations = mind.simulations.length > 0;

    const response = buildMockResponse(identity.name, mind.goal, entityCount, relCount, hasHypotheses, hasSimulations);

    return {
      content: response,
      model: "mock",
      provider: "mock",
      usage: {
        inputTokens: 150 + entityCount * 20 + relCount * 15,
        outputTokens: response.split(/\s+/).length,
        totalTokens: 200 + entityCount * 20 + relCount * 15 + response.split(/\s+/).length,
      },
      cached: false,
      reasoning: {
        durationMs: 300,
        trace: "Mock reasoner — no actual reasoning performed",
      },
    };
  }
}

function buildMockResponse(
  name: string,
  goal: string,
  entityCount: number,
  relCount: number,
  hasHypotheses: boolean,
  hasSimulations: boolean,
): string {
  const lines: string[] = [];

  lines.push(`*This is a mock response from ${name}. No LLM is connected.*`);
  lines.push(``);
  lines.push(`I've received your input and prepared the following understanding:`);
  lines.push(``);

  if (goal) {
    lines.push(`**Goal**: ${goal}`);
    lines.push(``);
  }

  if (entityCount > 0) {
    lines.push(`I identified ${entityCount} key concepts in your input.`);
  }

  if (relCount > 0) {
    lines.push(`I found ${relCount} relationships between these concepts.`);
  }

  if (hasHypotheses) {
    lines.push(`I've prepared some hypotheses to explore.`);
  }

  if (hasSimulations) {
    lines.push(`I've outlined some what-if scenarios worth considering.`);
  }

  lines.push(``);
  lines.push(`---`);
  lines.push(`**Reasoning service temporarily unavailable.**`);
  lines.push(``);
  lines.push(`To enable real reasoning:`);
  lines.push(`1. Add \`OPENAI_API_KEY\` to your \`.env.local\` file`);
  lines.push(`2. Restart the development server`);
  lines.push(`3. SPYRAL will automatically route to the best available model`);
  lines.push(``);
  lines.push(`In the meantime, I can still help with basic queries using the WorkingMind system.`);

  return lines.join("\n");
}
