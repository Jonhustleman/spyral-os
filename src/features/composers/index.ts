/**
 * Composers — Agent-specific response composers.
 *
 * Each composer transforms think() output into a unique
 * conversational experience per agent type.
 */

export { ResearchResponseComposer } from "./ResearchResponseComposer";
export { ContentResponseComposer } from "./ContentResponseComposer";
export { ConsultantResponseComposer } from "./ConsultantResponseComposer";
export { NavigationResponseComposer } from "./NavigationResponseComposer";
export { CommandCenterComposer } from "./CommandCenterComposer";

export type {
  ResponseComposer,
  ComposerInput,
  ComposerContext,
} from "./ResponseComposer";
