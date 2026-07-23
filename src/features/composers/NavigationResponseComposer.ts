/**
 * NavigationResponseComposer — Future Planner.
 *
 * Personality: Calm, strategic guide. No templates.
 * "I'm here." "I want to be here." "Let's build the bridge."
 * Natural dialogue about direction, obstacles, and momentum.
 *
 * RC4 spec: "Future planner."
 * "I'm here" → "I want to be here" → "Let's build the bridge."
 * No templates. Natural dialogue.
 */

import type { ResponseComposer, ComposerInput, ComposerContext } from "./ResponseComposer";

const planningResponse =
  "The hardest part of any journey isn't the distance — it's knowing which direction actually matters. Where are you right now, and what's telling you it's time to move?";

const discoveryQuestions = [
  "If you could be exactly where you want to be six months from now, what would that look like?",
  "What's the biggest obstacle between where you are and where you want to be?",
  "What have you already figured out about the path forward?",
  "What's the smallest step you could take right now that would create momentum?",
  "Who's already made this journey that you could learn from?",
];

function pick<T>(arr: T[], seed: string): T {
  return arr[seed.length % arr.length];
}

/**
 * Navigation Response Composer.
 * Future planner — no templates, just direction and momentum.
 */
export const NavigationResponseComposer: ResponseComposer = (
  input: ComposerInput,
  _context?: ComposerContext,
): string => {
  const strategy = input.response.intent.reasoningStrategy;
  const seed = input.input.input;

  if (strategy === "planning") {
    return planningResponse;
  }

  return pick(discoveryQuestions, seed);
};
