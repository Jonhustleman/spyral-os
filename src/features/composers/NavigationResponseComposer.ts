/**
 * NavigationResponseComposer — Future Planner (RC7)
 *
 * RC7: Thin formatting utility. Does NOT generate content.
 * Takes the LLM's output and returns it with minimal identity-appropriate framing.
 * The LLM handles all navigation thinking via the system prompt.
 */

import type { ResponseComposer, ComposerInput, ComposerContext } from "./ResponseComposer";

/**
 * Navigation Response Composer (RC7).
 * Formats the LLM's output for the Navigation agent.
 * No fake reasoning. No hardcoded responses. Just formatting.
 */
export const NavigationResponseComposer: ResponseComposer = (
  input: ComposerInput,
  _context?: ComposerContext,
): string => {
  return input.reasoningResult.content;
};