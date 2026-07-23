/**
 * ContentResponseComposer — Creative Director
 *
 * RC5.1 Identity: Creative Director + Brand Strategist + Psychologist + Storyteller.
 * Never behaves like Research.
 *
 * Workflow:
 *   Objective → Emotion → Audience → Narrative →
 *   Hook → Campaign → Assets → Execution
 *
 * Never interrogates users with forms.
 * Discovers information naturally through conversation.
 * Max 2-3 questions. Infers everything else.
 * Reports are ONLY generated when the user explicitly requests one.
 */

import type { ResponseComposer, ComposerInput, ComposerContext } from "./ResponseComposer";
import { getNaturalTechniqueHint } from "@/features/cognitive-techniques";

// ─── Creative Direction — Not interrogation, natural discovery ────────────

const creativeOpeners = [
  "What reaction do you want someone to have after experiencing this?",
  "If this worked perfectly, what would someone feel? Think? Do?",
  "What's the one thing you need people to understand that they don't already?",
  "Who is this really for — and what keeps them up at night?",
  "What's the story here that only you can tell?",
  "What emotion is this supposed to create? Let's start there.",
  "Every great piece of content comes from a tension. What's the tension here?",
];

const narrativeResponses = [
  "That's interesting. If this was a story, what would the turning point be?",
  "Stories work because of contrast — before and after, problem and solution. Where's the contrast here?",
  "The best narratives make the audience feel something before they think something. What should they feel first?",
];

const hookResponses = [
  "The first moment is everything. What's the one thing someone needs to see or hear to want more?",
  "If you had three seconds to capture attention, what would you say?",
  "A great hook makes a promise. What promise are you making?",
];

const campaignResponses = [
  "Let's think about this across touchpoints. Where does this come to life first?",
  "A campaign isn't one piece of content — it's an ecosystem. What's the centerpiece?",
  "How does this evolve over time? Day one, week one, month one?",
];

const fallbacks = [
  "Before we figure out the format, let's figure out the feeling. What should someone walk away feeling after they've seen this?",
  "The best content starts with a truth that needs to be shared. What truth are you sitting on?",
  "Let's skip the strategy deck for a second. What would you make if there were no constraints at all?",
  "Creative work is about making choices. What's the boldest choice here?",
];

// ─── Helper ─────────────────────────────────────────────────────────────────

function pick<T>(arr: T[], seed: string): T {
  return arr[seed.length % arr.length];
}

/**
 * Content Response Composer.
 * RC5.1: Creative Director persona — sharp, intuitive, no-nonsense.
 * Never asks more than 2-3 questions. Infers everything else.
 * Only generates structured output when the user explicitly requests it.
 */
export const ContentResponseComposer: ResponseComposer = (
  input: ComposerInput,
  context?: ComposerContext,
): string => {
  const strategy = input.response.intent.reasoningStrategy;
  const seed = input.input.input;
  const turnCount = context?.turnCount || 0;
  const text = input.input.input.toLowerCase();

  // Check if user explicitly requested a report or structured output
  const isExplicitReportRequest = /generate|create.*report|write.*brief|creative brief|campaign plan|content plan/i.test(text);

  // Build response based on the stage of the creative workflow
  let response: string;

  if (isExplicitReportRequest) {
    response = "Let's put together what we know. What's the core message that everything else supports?";
  } else if (turnCount === 0) {
    // First turn — understand the objective and emotion
    response = pick(creativeOpeners, seed);
  } else if (turnCount === 1) {
    // Second turn — narrative and hook
    response = pick(narrativeResponses, seed);
  } else if (turnCount === 2) {
    // Third turn — campaign and execution
    response = pick(campaignResponses, seed);
  } else {
    // Deeper into the process
    response = pick(hookResponses, seed + String(turnCount));
  }

  // Optionally weave in a cognitive technique hint
  if (turnCount > 1 && Math.random() < 0.2) {
    const hint = getNaturalTechniqueHint(seed, "content", turnCount);
    if (hint && !response.includes(hint)) {
      response = `${response}\n\n${hint}`;
    }
  }

  return response;
};
