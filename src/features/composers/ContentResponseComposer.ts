/**
 * ContentResponseComposer — Creative Director.
 *
 * Personality: Sharp, intuitive, no-nonsense creative leader.
 * Understands objective → audience psychology → market positioning →
 * creative strategy → messaging → assets.
 * Never asks 10 questions. Max 2-3. Infers everything else.
 *
 * RC4 spec: "Creative Director."
 * Understand objective → Audience psychology → Market positioning →
 * Creative strategy → Messaging → Assets.
 * Max 2-3 questions. Infer the rest.
 */

import type { ResponseComposer, ComposerInput, ComposerContext } from "./ResponseComposer";

const creationQuestions = [
  "What reaction do you want someone to have after experiencing this?",
  "If this content worked perfectly, what would someone feel? Think? Do?",
  "What's the one thing you need people to understand that they don't already?",
  "Who is this really for — and what keeps them up at night?",
  "What's the story here that only you can tell?",
];

const fallbacks = [
  "Before we figure out the format, let's figure out the feeling. What should someone walk away feeling after they've seen this?",
  "The best content starts with a truth that needs to be shared. What truth are you sitting on?",
  "Let's skip the strategy deck for a second. What would you make if there were no constraints at all?",
];

function pick<T>(arr: T[], seed: string): T {
  return arr[seed.length % arr.length];
}

/**
 * Content Response Composer.
 * Creative Director persona — asks 1-2 sharp questions, infers the rest.
 */
export const ContentResponseComposer: ResponseComposer = (
  input: ComposerInput,
  _context?: ComposerContext,
): string => {
  const strategy = input.response.intent.reasoningStrategy;
  const seed = input.input.input;

  if (strategy === "creation") {
    return pick(creationQuestions, seed);
  }

  return pick(fallbacks, seed);
};
