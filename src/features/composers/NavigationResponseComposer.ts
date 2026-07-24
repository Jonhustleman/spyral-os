/**
 * NavigationResponseComposer — Future Planner (RC5)
 *
 * IDENTITY: Future Planner. A strategic navigator, not an interviewer.
 * Always thinks in journeys. Never interviews.
 *
 * Every response follows: Understand → Think → Contribute → (Optional) One question
 * The contribution MUST stand on its own if the question were removed.
 *
 * Workflow:
 *   "I'm here" → "I want to be here" → "Let's build the bridge."
 *
 * Never asks for information unless it can immediately use it.
 * Conversation should feel like moving through reality, not filling out forms.
 */

import type { ResponseComposer, ComposerInput, ComposerContext } from "./ResponseComposer";

// ─── Internal Navigation Thinking ───────────────────────────────────────────

/**
 * Think about the user's direction, obstacles, and momentum.
 * Always sees journeys, not questions to answer.
 */
function think(input: string, turnCount: number): string[] {
  const thoughts: string[] = [];
  const lower = input.toLowerCase();

  // Detect journey language
  if (lower.includes("want") || lower.includes("goal") || lower.includes("future") || lower.includes("next")) {
    thoughts.push("Direction is more important than speed. Getting somewhere meaningful beats getting anywhere fast.");
  }

  // Detect obstacle awareness
  if (lower.includes("hard") || lower.includes("difficult") || lower.includes("stuck") || lower.includes("problem")) {
    thoughts.push("Obstacles aren't roadblocks — they're data. The nature of the resistance tells you something about the terrain ahead.");
  }

  // Detect momentum signals
  if (lower.includes("start") || lower.includes("begin") || lower.includes("first step") || lower.includes("ready")) {
    thoughts.push("The first step doesn't need to be perfect — it needs to be real. Action reveals information that planning never can.");
  }

  // First-turn orientation
  if (turnCount === 0) {
    thoughts.push("Every journey exists in three dimensions: where you are, where you want to be, and what's between them. Understanding all three is the only way to find a real path.");
  }

  return thoughts;
}

/**
 * Contribute navigation value — direction, mapping, momentum.
 */
function contribute(input: string, thoughts: string[], turnCount: number): string {
  const lower = input.toLowerCase();

  // Handle resistance
  if (lower.includes("i don't know") || lower.includes("not sure") || lower.includes("no idea")) {
    return "You don't need to know the whole path to start moving. What matters is knowing your next step — just the next one. What's one thing you're certain about, even if it's just the direction you want to face?";
  }

  // Handle frustration
  if (lower.includes("this isn't helpful") || lower.includes("not what i") || lower.includes("wrong")) {
    return "Let me recalibrate. The path forward needs to make sense from where you're actually standing, not from where I assumed you were. What's actually true about your situation right now?";
  }

  // Core navigation contribution
  if (turnCount === 0) {
    return "The most important question isn't where you want to be — it's understanding where you actually are right now. Most people underestimate the starting point and overestimate the destination. The real work is in the gap between them, and that gap is full of assumptions that need testing. Let's start by mapping what's real about your current position.";
  } else if (turnCount <= 2) {
    return "Here's what I see: the gap between current reality and desired reality is rarely a straight line. The path isn't a roadmap — it's a series of experiments. Each step teaches you something that changes the next step. The goal isn't to plan the whole journey upfront. It's to build enough momentum that the path reveals itself as you move.";
  } else {
    return "Let me zoom out for a moment. The journey isn't just about reaching a destination — it's about what you learn about yourself and your direction along the way. Sometimes the most valuable outcome isn't getting where you thought you wanted to go, but discovering a better destination through the process of moving.";
  }
}

/**
 * Optionally ask one navigational question — only if it clarifies direction.
 */
function maybeAskQuestion(input: string, turnCount: number): string | null {
  const lower = input.toLowerCase();

  // Never ask on first turn
  if (turnCount <= 0) return null;

  // Don't ask if user is stuck or frustrated
  if (lower.length < 15 || lower.includes("not what") || lower.includes("isn't helpful")) return null;

  // Navigation questions — always about direction, never padding
  if (turnCount <= 2) return null; // Contribute more first

  const questions = [
    "What's the smallest step you could take right now that would create momentum?",
    "What would success look like at this point — not the final destination, but the next milestone?",
    "What resource do you already have that you're not fully using?",
  ];

  const idx = (input.length + turnCount) % questions.length;
  return questions[idx];
}

// ─── Main Composer ──────────────────────────────────────────────────────────

/**
 * Navigation Response Composer (RC5).
 * Future Planner — thinks in journeys, never interviews.
 * Direction, obstacles, momentum. Natural dialogue.
 */
export const NavigationResponseComposer: ResponseComposer = (
  input: ComposerInput,
  context?: ComposerContext,
): string => {
  const turnCount = context?.turnCount || 0;
  const text = input.input.input;

  // Step 1: Think about the journey
  const thoughts = think(text, turnCount);

  // Step 2: Contribute navigation value
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
