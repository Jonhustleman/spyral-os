/**
 * ContentResponseComposer — Creative Director (RC5)
 *
 * IDENTITY: Creative Director + Brand Strategist + Psychologist + Storyteller.
 * Never interviews. Never templates. Never behaves like Research.
 *
 * Every response follows: Understand → Think → Contribute → (Optional) One question
 * The contribution MUST stand on its own if the question were removed.
 *
 * Workflow:
 *   Feel the emotion → Imagine the audience → Build the narrative →
 *   Test the angle → Explore the hook → Deliver creative direction
 *
 * Content creation is about making people feel something before they think something.
 * The response itself should demonstrate great content — not just talk about it.
 */

import type { ResponseComposer, ComposerInput, ComposerContext } from "./ResponseComposer";

// ─── Internal Creative Thinking ─────────────────────────────────────────────

/**
 * Think creatively about the user's input.
 * Feels emotion, imagines audience, finds the narrative tension.
 */
function think(input: string, turnCount: number): string[] {
  const thoughts: string[] = [];
  const lower = input.toLowerCase();

  // Feel the emotional core
  if (lower.includes("frustrat") || lower.includes("angry") || lower.includes("tired")) {
    thoughts.push("There's real energy in frustration. The best creative work comes from tension that needs resolution.");
  } else if (lower.includes("excited") || lower.includes("love") || lower.includes("amazing")) {
    thoughts.push("Passion is contagious. The challenge is translating that feeling into something someone else can feel.");
  } else if (lower.includes("confus") || lower.includes("overwhelm") || lower.includes("lost")) {
    thoughts.push("Complexity is an opportunity. When something is confusing, clarity becomes the most valuable creative asset.");
  }

  // Find the narrative tension
  if (lower.includes("but") || lower.includes("however") || lower.includes("although")) {
    thoughts.push("The 'but' is always where the story lives. That tension between what is and what could be — that's the hook.");
  }

  // Audience instinct
  if (turnCount === 0) {
    thoughts.push("Every great piece of content makes someone feel understood before it asks them to understand something new.");
  }

  return thoughts;
}

/**
 * Contribute creative direction — this is the value.
 * Demonstrates great content instincts, not just questions.
 */
function contribute(input: string, thoughts: string[], turnCount: number): string {
  const lower = input.toLowerCase();

  // Handle resistance
  if (lower.includes("i don't know") || lower.includes("not sure") || lower.includes("nothing")) {
    return "Sometimes the best creative work comes from constraints. If you had to make something — anything — today, what's the one truth you know for sure? That's where you start.";
  }

  // Handle frustration
  if (lower.includes("this isn't helpful") || lower.includes("not what i") || lower.includes("wrong")) {
    return "Let me step back. Creative blocks usually come from trying to be original instead of trying to be true. What's one thing you actually believe that no one else is saying? Start there.";
  }

  // Core creative contribution
  if (turnCount === 0) {
    return "The most memorable content doesn't inform — it transforms. It makes someone see something familiar in a new light. That moment of recognition — 'yes, that's exactly how it feels' — that's what we're building toward. The format comes later. The feeling comes first.";
  } else if (turnCount <= 2) {
    return "Here's what I'm sensing: the narrative isn't about what you're saying — it's about what the audience discovers about themselves through what you're saying. The best stories don't tell people what to think. They hold up a mirror and let people recognize their own reflection. What's the mirror here?";
  } else {
    return "Let me test an angle: what if the story isn't about the product, solution, or idea at all? What if it's about the transformation the audience experiences by engaging with it? People don't buy what you make — they buy what your thing makes them feel about themselves.";
  }
}

/**
 * Optionally ask one creative question — only if it unlocks direction.
 */
function maybeAskQuestion(input: string, turnCount: number): string | null {
  const lower = input.toLowerCase();

  // Never ask on first turn
  if (turnCount <= 0) return null;

  // Don't ask if user is stuck or frustrated
  if (lower.length < 15 || lower.includes("not what")) return null;

  const questions = [
    "What emotion does this need to create in the first three seconds?",
    "Who's the one person this needs to resonate with most?",
    "What's the contrast — before and after — that makes this story worth telling?",
    "If this was the only thing someone ever saw from you, what would you want them to feel?",
  ];

  const idx = (input.length + turnCount) % questions.length;
  return questions[idx];
}

// ─── Main Composer ──────────────────────────────────────────────────────────

/**
 * Content Response Composer (RC5).
 * Creative Director — feels emotion, imagines audiences, builds narratives.
 * Never interviews. Never more than one optional question.
 */
export const ContentResponseComposer: ResponseComposer = (
  input: ComposerInput,
  context?: ComposerContext,
): string => {
  const turnCount = context?.turnCount || 0;
  const text = input.input.input;

  // Step 1: Think creatively
  const thoughts = think(text, turnCount);

  // Step 2: Contribute creative direction
  const contribution = contribute(text, thoughts, turnCount);

  // Step 3: Optional question
  const question = maybeAskQuestion(text, turnCount);

  // Build response
  const parts: string[] = [];

  if (thoughts.length > 0) {
    parts.push(thoughts[thoughts.length - 1]);
  }

  parts.push(contribution);

  if (question) {
    parts.push(question);
  }

  return parts.join("\n\n");
};
