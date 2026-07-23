/**
 * ConsultantResponseComposer — Executive Thinking Partner
 *
 * RC5.1 Identity: Executive Thinking Partner.
 * Challenges assumptions. Presents trade-offs. Reveals hidden consequences.
 * Recommends direction. Never generates business reports automatically.
 *
 * Workflow:
 *   Challenge assumptions → Present trade-offs →
 *   Reveal hidden consequences → Recommend direction
 *
 * Reads the room. Never dumps reports.
 * Only generates structured output when the user explicitly requests one.
 */

import type { ResponseComposer, ComposerInput, ComposerContext } from "./ResponseComposer";
import { getNaturalTechniqueHint } from "@/features/cognitive-techniques";

// ─── Decision Mode — Weighing options, revealing trade-offs ───────────────

const decisionOpeners = [
  "This feels like one of those situations where there's no perfect answer — just trade-offs. What matters most to you in this decision?",
  "Every decision is a bet on a particular view of the future. What assumptions are you betting on here?",
  "Before we weigh options, let's clarify what success looks like. What would have to be true for you to feel good about this choice a year from now?",
  "The best decisions come from understanding what you're willing to sacrifice. What are you willing to give up to get this?",
];

const tradeOffResponses = [
  "If you optimize for one thing, something else gets de-prioritized. What are you optimizing for here?",
  "There's always a hidden cost to every choice. What's the cost of choosing this path?",
  "The opposite of this choice also has merits. What would be true if you chose the other option?",
];

const hiddenConsequenceResponses = [
  "There's a second-order effect worth considering here. If this works, what breaks?",
  "This choice doesn't just affect the immediate outcome — it sets a precedent. What precedent does it set?",
  "Sometimes the real consequence isn't the one you're thinking about. What else changes when this happens?",
];

// ─── Discovery Mode — Exploring the real challenge ────────────────────────

const challengeQuestions = [
  "What's the real challenge here — not the surface problem, but the thing underneath?",
  "If you could wave a wand and have this solved, what would be different?",
  "What have you already tried that hasn't worked, and what did that teach you?",
  "Who else sees this situation differently, and what might they be right about?",
  "What would someone who disagrees with you say about this?",
];

const followUpQuestions = [
  "I'm curious — what makes this worth solving right now?",
  "Between all the things competing for your attention, why this?",
  "What's the cost of not deciding?",
  "What are you assuming that, if it weren't true, would change everything?",
];

// ─── Helper ─────────────────────────────────────────────────────────────────

function pick<T>(arr: T[], seed: string): T {
  return arr[seed.length % arr.length];
}

/**
 * Consultant Response Composer.
 * RC5.1: Executive Thinking Partner — challenge, reveal, recommend.
 * Never dumps reports. Reads the room.
 * Only generates structured output when the user explicitly requests one.
 */
export const ConsultantResponseComposer: ResponseComposer = (
  input: ComposerInput,
  context?: ComposerContext,
): string => {
  const strategy = input.response.intent.reasoningStrategy;
  const seed = input.input.input;
  const turnCount = context?.turnCount || 0;
  const text = input.input.input.toLowerCase();

  // Check if user explicitly requested a report
  const isExplicitReportRequest = /generate.*report|create.*report|write.*report|executive summary|strategy report|analysis report/i.test(text);

  if (isExplicitReportRequest) {
    return "There's a lot to unpack here. Let me pull together what I think are the key threads before we go further.";
  }

  if (strategy === "decision") {
    if (turnCount === 0) {
      return pick(decisionOpeners, seed);
    }
    if (turnCount === 1) {
      return pick(tradeOffResponses, seed + "trade");
    }
    if (turnCount === 2) {
      return pick(hiddenConsequenceResponses, seed + "hidden");
    }
    const followUp = pick(followUpQuestions, seed + "follow" + turnCount);
    return followUp;
  }

  // Default: challenge mode
  if (turnCount === 0) {
    return pick(challengeQuestions, seed);
  }

  const followUp = pick(followUpQuestions, seed + String(turnCount));

  // Optionally weave in a cognitive technique hint
  let response = followUp;
  if (turnCount > 1 && Math.random() < 0.3) {
    const hint = getNaturalTechniqueHint(seed, "consultant", turnCount);
    if (hint && !response.includes(hint)) {
      response = `${hint}\n\n${response}`;
    }
  }

  return response;
};
