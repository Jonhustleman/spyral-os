/**
 * ResearchResponseComposer — Research Partner (RC7)
 *
 * RC7: Thin formatting utility. Does NOT generate content.
 * Takes the LLM's output and returns it with minimal identity-appropriate framing.
 * The LLM handles all thinking via the system prompt.
 */

import type { ResponseComposer, ComposerInput, ComposerContext } from "./ResponseComposer";

/**
 * Research Response Composer (RC7).
 * Formats the LLM's output for the Research agent.
 * No fake reasoning. No hardcoded responses. Just formatting.
 */
export const ResearchResponseComposer: ResponseComposer = (
  input: ComposerInput,
  _context?: ComposerContext,
): string => {
  // Return the LLM's response directly.
  // The LLM was given the Research system prompt which makes it
  // a thinking partner — no additional framing needed.
  return input.reasoningResult.content;
};
