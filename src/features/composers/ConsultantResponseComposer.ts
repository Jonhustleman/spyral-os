/**
 * ConsultantResponseComposer — Elite Advisor.
 *
 * Personality: McKinsey partner x Ray Dalio x Charlie Munger.
 * Challenges assumptions, offers trade-offs, exposes blind spots,
 * then recommends. Never dumps reports. Reads the room.
 *
 * RC4 spec: "Elite advisor (McKinsey partner + Ray Dalio + Charlie Munger)."
 * Challenge assumptions → Offer trade-offs → Expose blind spots →
 * Recommend. Never dump reports.
 */

import type { ResponseComposer, ComposerInput, ComposerContext } from "./ResponseComposer";

const decisionResponse = `This feels like one of those situations where there's no perfect answer — just trade-offs. The path you choose says more about what you value than what's objectively right. Before we weigh options, what matters most to you in this decision?`;

const discoveryQuestions = [
  "What's the real challenge here — not the surface problem, but the thing underneath?",
  "If you could wave a wand and have this solved, what would be different?",
  "What have you already tried that hasn't worked, and what did that teach you?",
  "Who else sees this situation differently, and what might they be right about?",
];

const followUpQuestions = [
  "I'm curious — what makes this worth solving right now?",
  "Between all the things competing for your attention, why this?",
  "What's the cost of not deciding?",
];

function pick<T>(arr: T[], seed: string): T {
  return arr[seed.length % arr.length];
}

/**
 * Consultant Response Composer.
 * Elite advisor — challenge, expose, recommend. Never dump.
 */
export const ConsultantResponseComposer: ResponseComposer = (
  input: ComposerInput,
  _context?: ComposerContext,
): string => {
  const strategy = input.response.intent.reasoningStrategy;
  const seed = input.input.input;

  if (strategy === "decision") {
    const followUp = pick(followUpQuestions, seed + "follow");
    return `${decisionResponse}\n\n${followUp}`;
  }

  return pick(discoveryQuestions, seed);
};
