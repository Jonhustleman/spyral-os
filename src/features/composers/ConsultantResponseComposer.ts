/**
 * ConsultantResponseComposer — Executive Thinking Partner (RC5)
 *
 * IDENTITY: Executive Thinking Partner. Senior strategist, not an interviewer.
 * Challenges assumptions. Presents trade-offs. Reveals hidden consequences.
 * Recommends direction. Never generates reports automatically.
 *
 * Every response follows: Understand → Think → Contribute → (Optional) One question
 * The contribution MUST stand on its own if the question were removed.
 *
 * Workflow:
 *   Read the room → Challenge assumptions → Present trade-offs →
 *   Reveal hidden consequences → Recommend direction
 *
 * Never asks questions that pad the conversation. Every question earns its place.
 */

import type { ResponseComposer, ComposerInput, ComposerContext } from "./ResponseComposer";

// ─── Internal Strategic Thinking ────────────────────────────────────────────

/**
 * Think strategically about the user's situation.
 * Identifies hidden dynamics, second-order effects, and assumptions worth testing.
 */
function think(input: string, strategy: string, turnCount: number): string[] {
  const thoughts: string[] = [];
  const lower = input.toLowerCase();

  // Detect decision-making patterns
  if (lower.includes("should i") || lower.includes("which") || lower.includes("compare") || lower.includes("option")) {
    thoughts.push("The best decision isn't about choosing the right option — it's about understanding which assumptions make one option better than the other.");
  }

  // Detect trade-off territory
  if (lower.includes("but") || lower.includes("cost") || lower.includes("risk") || lower.includes("trade")) {
    thoughts.push("Every choice has a hidden cost. The question isn't what you gain — it's what you're willing to lose.");
  }

  // Detect overconfidence
  if (lower.includes("obvious") || lower.includes("clearly") || lower.includes("definitely")) {
    thoughts.push("When something seems obvious, that's usually where the most dangerous assumptions hide.");
  }

  // First-turn strategic framing
  if (turnCount === 0) {
    thoughts.push("The quality of any decision is determined by the quality of the framing. Let me make sure I understand the real question before we dive into answers.");
  }

  // Second-order thinking
  if (turnCount >= 1) {
    thoughts.push("Beyond the immediate outcome, what second-order effects might ripple from this choice? The consequences you don't see are usually the ones that matter most.");
  }

  return thoughts;
}

/**
 * Contribute strategic value — challenge, reveal, recommend.
 * This is the core of the consultant's value.
 */
function contribute(input: string, thoughts: string[], strategy: string, turnCount: number): string {
  const lower = input.toLowerCase();

  // Handle resistance
  if (lower.includes("i don't know") || lower.includes("not sure") || lower.includes("maybe")) {
    return "Uncertainty is useful — it tells us where the real work is. Let's identify what you're uncertain about and figure out whether more information would actually change the decision. Often, we already know enough to act. The question is whether we're willing to act on what we know.";
  }

  // Handle frustration
  if (lower.includes("this isn't helpful") || lower.includes("not what i") || lower.includes("wrong")) {
    return "You're right to push back. Let me reframe. What matters here isn't my analysis — it's your reality. What constraint or dynamic am I missing that's actually driving this?";
  }

  // Strategic contribution
  if (strategy === "decision" || lower.includes("should i") || lower.includes("which") || lower.includes("option")) {
    if (turnCount === 0) {
      return "Every decision is a bet on a particular view of the future. The goal isn't to eliminate uncertainty — it's to understand what you're betting on and whether you're okay with losing that bet. Let's work through what evidence would change your confidence in each path.";
    } else {
      return "Here's what I see: the trade-off isn't between good and bad options. It's between different kinds of risk. One path has known risks you can mitigate. The other has unknown risks you can't plan for. The question is which type of uncertainty you're better positioned to handle.";
    }
  }

  // Default: challenge mode
  if (turnCount === 0) {
    return "Most challenges aren't what they first appear. The surface problem is rarely the real one. Let me test a hypothesis: the thing you think is the obstacle — what if it's actually a signal pointing toward the right direction?";
  }

  return "Stepping back, I see a pattern worth examining. The constraints you're describing aren't obstacles — they're the structure of the problem itself. The solution usually emerges not from removing constraints, but from understanding why they exist and working within their logic.";
}

/**
 * Optionally ask one strategic question — only if it would change the analysis.
 */
function maybeAskQuestion(input: string, strategy: string, turnCount: number): string | null {
  const lower = input.toLowerCase();

  // First turn: no question, just contribute
  if (turnCount <= 0) return null;

  // Don't ask if user is frustrated
  if (lower.includes("not what") || lower.includes("wrong") || lower.includes("isn't helpful")) return null;

  // Decision context: ask if there's a real fork
  if (strategy === "decision" || lower.includes("should i") || lower.includes("option")) {
    if (turnCount <= 2) return null; // contribute more first
    const decisionQuestions = [
      "What would have to be true for each option to be the right one?",
      "What's the cost of being wrong about each path?",
      "What would you advise someone else in this exact situation?",
    ];
    return decisionQuestions[(input.length + turnCount) % decisionQuestions.length];
  }

  // General strategic question
  const questions = [
    "What assumption here is the most dangerous if it's wrong?",
    "What would you do if you couldn't make the wrong choice?",
    "What's the hidden cost of not deciding?",
  ];

  const idx = (input.length + turnCount) % questions.length;
  return idx === 0 ? null : questions[idx]; // Often no question
}

// ─── Main Composer ──────────────────────────────────────────────────────────

/**
 * Consultant Response Composer (RC5).
 * Executive Thinking Partner — challenge, reveal, recommend.
 * Never interviews. Strategic value first.
 */
export const ConsultantResponseComposer: ResponseComposer = (
  input: ComposerInput,
  context?: ComposerContext,
): string => {
  const strategy = input.response.intent.reasoningStrategy;
  const turnCount = context?.turnCount || 0;
  const text = input.input.input;

  // Step 1: Think strategically
  const thoughts = think(text, strategy, turnCount);

  // Step 2: Contribute strategic value
  const contribution = contribute(text, thoughts, strategy, turnCount);

  // Step 3: Optional question
  const question = maybeAskQuestion(text, strategy, turnCount);

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
