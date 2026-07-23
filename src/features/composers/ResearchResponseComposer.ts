/**
 * ResearchResponseComposer — Two scientists exploring together.
 *
 * Personality: Curious peer, not an oracle. Observes, questions
 * assumptions, generates possibilities, then asks ONE excellent
 * question. Waits. Expands. Remembers everything.
 *
 * RC4 spec: "Two scientists exploring together."
 * Observe → Question assumptions → Generate possibilities →
 * Ask ONE excellent question → Wait → Expand → Remember
 */

import type { ResponseComposer, ComposerInput, ComposerContext } from "./ResponseComposer";

const discoveryQuestions = [
  "What made this idea stick with you?",
  "If we understood this completely, what would change?",
  "What's the biggest assumption people make about this?",
  "Where would we start if we wanted to test this?",
  "What part of this fascinates you most?",
];

const experimentResponse =
  "The interesting part about this is figuring out what we'd actually need to observe to know we're on the right track. What would a meaningful test look like from where you're standing?";

const literatureResponse =
  "There's probably more written about this than anyone could read in a lifetime. The real question is which parts actually matter for what you're trying to do. What's the core question you're hoping existing knowledge can answer?";

const theoryResponse =
  "Sometimes the best way forward is to flip the whole thing upside down. If we assumed everything conventional about this is wrong — where would we start looking instead?";

const reportResponse =
  "A few angles worth surfacing here. Though honestly, the most valuable thing isn't a summary of what's known — it's figuring out what's missing. What question, if answered, would change everything?";

const debateResponse =
  "Let me play with this for a moment. There's a case to be made for the conventional view — it's conventional for a reason. But the most interesting insights usually come from the arguments against it. What's the strongest criticism of your current position that you've encountered?";

const fallbacks = [
  "That's a fascinating direction. What draws you to it?",
  "There's something interesting lurking here. What's the first thread you want to pull?",
  "This is one of those topics where the deeper you go, the more interesting it gets. Where should we start?",
];

function pick<T>(arr: T[], seed: string): T {
  return arr[seed.length % arr.length];
}

/**
 * Research Response Composer.
 * Always conversational. Never reports. Never quotes the user.
 * Asks one excellent question per turn.
 */
export const ResearchResponseComposer: ResponseComposer = (
  input: ComposerInput,
  _context?: ComposerContext,
): string => {
  const mode = input.input.researchMode || "discovery";
  const seed = input.input.input;

  switch (mode) {
    case "discovery":
      return pick(discoveryQuestions, seed);

    case "experiment":
      return experimentResponse;

    case "literature":
      return literatureResponse;

    case "theory":
      return theoryResponse;

    case "report":
      return reportResponse;

    case "debate":
      return debateResponse;

    default:
      return pick(fallbacks, seed);
  }
};
