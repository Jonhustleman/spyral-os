/**
 * CommandCenterComposer — Mission Control (RC7)
 *
 * RC7: Thin formatting utility. Does NOT generate content.
 * Takes the LLM's output and returns it with minimal identity-appropriate framing.
 * The LLM handles all routing and coordination via the system prompt.
 */

import type { ResponseComposer, ComposerInput, ComposerContext } from "./ResponseComposer";

/**
 * Command Center Composer (RC7).
 * Formats the LLM's output for the Command Center agent.
 * No fake routing. No hardcoded responses. Just formatting.
 */
export const CommandCenterComposer: ResponseComposer = (
  input: ComposerInput,
  _context?: ComposerContext,
): string => {
  return input.reasoningResult.content;
};