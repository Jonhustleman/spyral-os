/**
 * SPYRAL OS — Kernel Contract
 * NavigationSession — A user's journey through SPYRAL.
 *
 * Per ADR-0048, NavigationSession is a product contract.
 * It records progress. It does not make decisions.
 * Think of it as the equivalent of a browser session.
 *
 * Per ADR-0047, Navigation is stateful and conversational.
 * The UI is a projection of session state.
 */

import type { Entity } from "./identity/Entity";
import type { NavigationStage } from "./NavigationStage";
import type { NavigationContext, ConversationTurn } from "./NavigationContext";

/**
 * The status of a navigation session.
 */
export type NavigationSessionStatus = "ACTIVE" | "PAUSED" | "COMPLETED" | "ABANDONED";

/**
 * A user's navigation journey through SPYRAL.
 * Records progress and context. Does not make decisions.
 */
export interface NavigationSession extends Entity {
  /** The workspace this session belongs to. */
  workspaceId: string;

  /** The user's original prompt/intent. */
  prompt: string;

  /** Current navigation stage. */
  stage: NavigationStage;

  /** Session status. */
  status: NavigationSessionStatus;

  /** Structured context collected during the journey. */
  context: NavigationContext;

  /** Conversation history. */
  history: ConversationTurn[];

  /** The current workspace being operated on. */
  currentWorkspaceId: string;

  /** The current capability being used. */
  currentCapabilityId: string;
}
