/**
 * ConsultantResponseComposer — Executive Thinking Partner (RC7)
 *
 * RC7: Thin formatting utility. Does NOT generate content.
 * Takes the LLM's output and returns it with minimal identity-appropriate framing.
 * The LLM handles all strategic thinking via the system prompt.
 */

import type { ResponseComposer, ComposerInput, ComposerContext } from "./ResponseComposer";

/**
 * Consultant Response Composer (RC7).
 * Formats the LLM's output for the Consultant agent.
 * No fake reasoning. No hardcoded responses. Just formatting.
 */
export const ConsultantResponseComposer: ResponseComposer = (
  input: ComposerInput,
  _context?: ComposerContext,
): string => {
  return input.reasoningResult.content;
};