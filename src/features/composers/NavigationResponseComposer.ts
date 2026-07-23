/**
 * NavigationResponseComposer — Future Planner
 *
 * RC5.1 Identity: Future Planner.
 * Conversation should feel like moving through reality, not filling out templates.
 * No templates. Natural dialogue about direction, obstacles, and momentum.
 *
 * Workflow:
 *   "I'm here" → "I want to be here" → "Let's build the bridge."
 *
 * Never asks for information unless it can immediately use it.
 * Reports are ONLY generated when the user explicitly requests one.
 */

import type { ResponseComposer, ComposerInput, ComposerContext } from "./ResponseComposer";
import { getNaturalTechniqueHint } from "@/features/cognitive-techniques";

// ─── Planning Phase — Understanding direction and momentum ────────────────

const planningResponses = [
  "The hardest part of any journey isn't the distance — it's knowing which direction actually matters. Where are you right now, and what's telling you it's time to move?",
  "Before we map the route — where are you starting from? Understanding the starting point is as important as the destination.",
  "What's the gap between where you are and where you want to be? Not the distance — the real gap.",
  "Every journey starts with a decision to move. What's making this the right time?",
];

const obstacleResponses = [
  "What's the biggest obstacle between where you are and where you want to be?",
  "If there was one thing that could derail this, what would it be?",
  "What have you already tried that didn't work? That's often more useful than what did.",
];

const momentumResponses = [
  "What's the smallest step you could take right now that would create momentum?",
  "Momentum comes from action, not planning. What can you do this week that would prove the direction?",
  "The first step doesn't need to be perfect — it needs to be real. What's real enough to start?",
];

const discoveryQuestions = [
  "If you could be exactly where you want to be six months from now, what would that look like?",
  "What have you already figured out about the path forward?",
  "Who's already made this journey that you could learn from?",
  "What does success actually look like — not in theory, but in reality?",
  "What resources do you already have that you're not fully using?",
];

// ─── Helper ─────────────────────────────────────────────────────────────────

function pick<T>(arr: T[], seed: string): T {
  return arr[seed.length % arr.length];
}

/**
 * Navigation Response Composer.
 * RC5.1: Future planner — no templates, just direction and momentum.
 * Conversation feels like moving through reality.
 * Only generates structured output when the user explicitly requests one.
 */
export const NavigationResponseComposer: ResponseComposer = (
  input: ComposerInput,
  context?: ComposerContext,
): string => {
  const strategy = input.response.intent.reasoningStrategy;
  const seed = input.input.input;
  const turnCount = context?.turnCount || 0;
  const text = input.input.input.toLowerCase();

  // Check if user explicitly requested a report
  const isExplicitReportRequest = /generate.*plan|create.*plan|write.*plan|navigation plan|execution plan|roadmap|timeline/i.test(text);

  if (isExplicitReportRequest) {
    return "Let me pull together what we've discussed into a clear direction. Here's what I see as the path forward.";
  }

  let response: string;

  if (turnCount === 0 && (strategy === "planning" || turnCount === 0)) {
    response = pick(planningResponses, seed);
  } else if (turnCount === 1) {
    response = pick(obstacleResponses, seed + "obs");
  } else if (turnCount === 2) {
    response = pick(momentumResponses, seed + "mom");
  } else {
    response = pick(discoveryQuestions, seed + String(turnCount));
  }

  // Optionally weave in a cognitive technique hint
  if (turnCount > 1 && Math.random() < 0.25) {
    const hint = getNaturalTechniqueHint(seed, "navigation", turnCount);
    if (hint && !response.includes(hint)) {
      response = `${response}\n\n${hint}`;
    }
  }

  return response;
};
