/**
 * ResearchResponseComposer — Research Partner (RC5)
 *
 * IDENTITY: Curious scientist. Two brilliant minds investigating together.
 * Never interviews. Never templates. Never exposes internal reasoning.
 *
 * Every response follows: Understand → Think → Contribute → (Optional) One question
 * The contribution MUST stand on its own if the question were removed.
 * Questions are only asked when the answer would genuinely change the reasoning.
 *
 * Workflow:
 *   Observe what the user actually said
 *   Think — first principles, cross-domain connections, alternative explanations
 *   Contribute something useful — a connection, a reframe, a pattern, a contradiction
 *   Optional: One question if it unlocks deeper thinking
 */

import type { ResponseComposer, ComposerInput, ComposerContext } from "./ResponseComposer";

// ─── Internal Reasoning Helpers ────────────────────────────────────────────

/**
 * Think about the user's input using first principles and cross-domain connections.
 * Returns an array of observations — never questions.
 */
function think(input: string, mode: string, turnCount: number): string[] {
  const thoughts: string[] = [];
  const lower = input.toLowerCase();

  // Extract core concepts
  const words = lower.split(/\s+/).filter(w => w.length > 3);
  const uniqueConcepts = [...new Set(words)].slice(0, 5);

  // First principles: strip away assumptions
  if (lower.includes("always") || lower.includes("never") || lower.includes("everyone")) {
    thoughts.push("That assumption might be hiding the real structure. What if the opposite were also true?");
  }

  // Cross-domain connection
  if (turnCount === 0) {
    thoughts.push("Let me sit with this for a moment. The shape of this pattern reminds me of how constraints often reveal the most creative solutions.");
  }

  // Mode-specific thinking
  if (mode === "theory") {
    thoughts.push("Building from first principles: if we strip away everything we assume, what irreducible truths are we left with?");
  } else if (mode === "experiment") {
    thoughts.push("The interesting question isn't what we believe — it's what we could observe that would change our mind.");
  } else if (mode === "debate") {
    thoughts.push("The most useful challenge isn't who's right — it's what we're both missing.");
  } else if (mode === "literature") {
    thoughts.push("Existing knowledge tells us what's been tried and what's failed. The gap is where value lives.");
  }

  return thoughts;
}

/**
 * Contribute something of value based on the thinking.
 * This is the core of the response — what makes it worth reading.
 */
function contribute(input: string, thoughts: string[], mode: string, turnCount: number): string {
  const lower = input.toLowerCase();

  // If user showed resistance ("I don't know"), switch to first principles
  if (lower.includes("i don't know") || lower.includes("not sure") || lower.includes("no idea")) {
    return "Let's start from what we do know. Sometimes the most useful thing isn't an answer — it's finding the right question. What's one thing you're certain about here, even if it's small?";
  }

  // If user shows frustration, natural recovery
  if (lower.includes("this isn't helpful") || lower.includes("not what i") || lower.includes("you're not") || lower.includes("wrong")) {
    return "I was thinking about this the wrong way. Let me step back. What matters to you here — not what I think should matter, but what actually does?";
  }

  // Build a contribution from thinking
  let contribution = "";

  if (mode === "theory") {
    contribution = "Let's try building from first principles. What do we actually know for certain? From there, we can follow what logically emerges — even if it challenges the conventional view.";
  } else if (mode === "experiment") {
    contribution = "The most revealing experiments aren't designed to prove a hypothesis — they're designed to disprove it. What would falsify our current understanding?";
  } else if (mode === "debate") {
    contribution = "Here's a perspective worth testing: the strongest argument against your current position usually contains the seed of a better one. What would someone who deeply disagrees with you say?";
  } else if (mode === "literature") {
    contribution = "The real value of existing knowledge isn't answers — it's knowing what questions have already been asked, what failed, and what was overlooked. What's the gap worth exploring?";
  } else {
    // Discovery: make a genuine connection or reframe
    if (turnCount === 0) {
      contribution = "This is interesting territory. The way you're framing it suggests there's something beneath the surface worth pulling up. The most revealing questions often come from the edges — what nearly made it into what you just said?";
    } else if (turnCount <= 2) {
      contribution = "I keep coming back to a pattern here. The tension between what you want and what's in the way — that's usually where the real structure lives. What if the obstacle isn't the problem, but a signal about the right direction?";
    } else {
      contribution = "Stepping back: we've covered some ground. What's shifting in how you see this? Sometimes the most valuable thing isn't a new answer — it's realizing the old question was wrong.";
    }
  }

  return contribution;
}

/**
 * Optionally ask one question — only if the answer would genuinely change reasoning.
 * The response must still be valuable without this question.
 */
function maybeAskQuestion(input: string, mode: string, turnCount: number): string | null {
  const lower = input.toLowerCase();

  // Never ask on first turn — contribute first
  if (turnCount <= 0) return null;

  // Don't ask if user just answered a question
  if (lower.length < 15) return null;

  // Don't ask if user is frustrated
  if (lower.includes("this isn't helpful") || lower.includes("not what i") || lower.includes("wrong")) return null;

  // Only ask if the answer would genuinely change direction
  const questionPool = [
    "What's one thing here that you feel uncertain about?",
    "What would change if we looked at this from the opposite direction?",
    "Of everything we've touched on, what feels most worth pushing further?",
    "What assumption here is the most fragile?",
  ];

  // Pick deterministically to ensure reproducibility
  const idx = (input.length + turnCount) % questionPool.length;
  return questionPool[idx];
}

// ─── Main Composer ──────────────────────────────────────────────────────────

/**
 * Research Response Composer (RC5).
 * Thinking partner, not interviewer.
 * Understand → Think → Contribute → Optional one question.
 */
export const ResearchResponseComposer: ResponseComposer = (
  input: ComposerInput,
  context?: ComposerContext,
): string => {
  const mode = input.input.researchMode || "discovery";
  const turnCount = context?.turnCount || 0;
  const text = input.input.input;

  // Step 1: Think — generate observations
  const thoughts = think(text, mode, turnCount);

  // Step 2: Contribute — build the value
  const contribution = contribute(text, thoughts, mode, turnCount);

  // Step 3: Optional question — only if it earns its place
  const question = maybeAskQuestion(text, mode, turnCount);

  // Build response: thoughts first (showing reasoning), then contribution, then optional question
  const parts: string[] = [];

  // Lead with the most relevant thought
  if (thoughts.length > 0) {
    parts.push(thoughts[thoughts.length - 1]);
  }

  // Core contribution
  parts.push(contribution);

  // Optional question (only if the response would still be valuable without it)
  if (question) {
    parts.push(question);
  }

  return parts.join("\n\n");
};
