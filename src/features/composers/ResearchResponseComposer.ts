/**
 * ResearchResponseComposer — Research Partner
 *
 * RC5.1 Identity: Research Partner — not search engine, not report writer, not teacher.
 * Two brilliant people investigating something together.
 *
 * Workflow:
 *   Observe → Challenge assumptions → Generate competing explanations →
 *   Connect domains → Find contradictions → Suggest experiments →
 *   Continue investigation
 *
 * Research should rarely feel finished.
 * Never repeats the user's prompt.
 * Never quotes the user's words unless absolutely necessary.
 * Asks one excellent question per turn.
 * Reports are ONLY generated when the user explicitly requests one.
 */

import type { ResponseComposer, ComposerInput, ComposerContext } from "./ResponseComposer";
import { getNaturalTechniqueHint, getTechniqueDirections } from "@/features/cognitive-techniques";

// ─── Discovery Phase — Open-ended collaborative investigation ──────────────

const discoveryResponses = [
  "That's an interesting place to start. What draws you to this?",
  "When you think about this, what part feels most worth understanding?",
  "There's a lot to unpack here. What's the thread you want to pull first?",
  "I'm curious what you've already noticed about this. What stands out?",
  "Let's sit with this for a moment. What makes it worth investigating?",
  "Before we dive deep — what's your gut feeling about this?",
  "What would it change if we really understood this?",
  "The best investigations start with a good question. What's yours?",
];

// ─── Experiment Phase — Design experiments to test hypotheses ──────────────

const experimentResponses = [
  "The interesting part about this is figuring out what we'd actually need to observe. What would a meaningful test look like from where you're standing?",
  "If we wanted to really test this, we'd need something observable. What would convince you one way or the other?",
  "Experiments are just structured curiosity. What's the simplest thing we could try that would tell us something useful?",
  "Before we design anything — what's the question we're actually trying to answer here?",
];

// ─── Literature Phase — Engage with existing knowledge ────────────────────

const literatureResponses = [
  "There's probably more written about this than anyone could read in a lifetime. The real question is which parts actually matter for what you're doing. What's the core question you want existing knowledge to answer?",
  "Let's think about what we'd want to know from the literature. What specific gap are we trying to fill?",
  "The literature can tell us what's been tried, what's failed, and what's been overlooked. Which of those is most relevant right now?",
];

// ─── Theory Phase — Develop new frameworks ────────────────────────────────

const theoryResponses = [
  "Sometimes the best way forward is to flip the whole thing upside down. If we assumed everything conventional about this is wrong — where would we start looking instead?",
  "Let's try building a theory from first principles. What do we actually know for certain, and what follows from that?",
  "Theories are just stories that explain patterns. What story would make sense of what you're seeing?",
];

// ─── Report Phase — Only when explicitly requested ─────────────────────────

const reportResponses = [
  "A few angles worth surfacing here. But honestly, the most valuable thing isn't a summary of what's known — it's figuring out what's missing. What question, if answered, would change everything?",
];

// ─── Debate Phase — Challenge from multiple perspectives ──────────────────

const debateResponses = [
  "There's a case to be made for the conventional view — it's conventional for a reason. But the most interesting insights usually come from the arguments against it. What's the strongest criticism of your current position that you've encountered?",
  "Let me play with this for a moment. If someone who deeply disagreed with you was in the room — what would they say?",
  "The most useful debates aren't about who's right — they're about what we're missing. What perspective haven't we considered yet?",
];

// ─── Fallbacks — When nothing else fits ────────────────────────────────────

const fallbacks = [
  "That's a fascinating direction. What draws you to it?",
  "There's something interesting lurking here. What's the first thread you want to pull?",
  "This is one of those topics where the deeper you go, the more interesting it gets. Where should we start?",
];

// ─── Helper ─────────────────────────────────────────────────────────────────

function pick<T>(arr: T[], seed: string): T {
  return arr[seed.length % arr.length];
}

/**
 * Research Response Composer.
 * RC5.1: Always conversational. Never reports. Never quotes the user.
 * Asks one excellent question per turn.
 * Only generates structured output when the user explicitly requests a report.
 */
export const ResearchResponseComposer: ResponseComposer = (
  input: ComposerInput,
  context?: ComposerContext,
): string => {
  const mode = input.input.researchMode || "discovery";
  const seed = input.input.input;
  const turnCount = context?.turnCount || 0;

  // Check if user explicitly requested a report
  const text = input.input.input.toLowerCase();
  const isExplicitReportRequest = /generate a report|create a report|write a report|summarize everything|export findings|executive report|research summary/i.test(text);

  // Default to discovery mode unless report is explicitly requested
  const effectiveMode = isExplicitReportRequest ? "report" : mode;

  // Build the response
  let response: string;

  switch (effectiveMode) {
    case "discovery":
      response = pick(discoveryResponses, seed);
      break;

    case "experiment":
      response = pick(experimentResponses, seed);
      break;

    case "literature":
      response = pick(literatureResponses, seed);
      break;

    case "theory":
      response = pick(theoryResponses, seed);
      break;

    case "report":
      response = pick(reportResponses, seed);
      break;

    case "debate":
      response = pick(debateResponses, seed);
      break;

    default:
      response = pick(fallbacks, seed);
  }

  // Optionally weave in a cognitive technique hint (never more than one, never forced)
  if (turnCount > 0 && Math.random() < 0.25) {
    const hint = getNaturalTechniqueHint(seed, "research", turnCount);
    if (hint && !response.includes(hint)) {
      response = `${response}\n\n${hint}`;
    }
  }

  return response;
};
