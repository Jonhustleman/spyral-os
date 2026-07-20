/**
 * SPYRAL OS — Kernel Contract
 * NavigationContext — Structured context collected during a navigation journey.
 *
 * Per ADR-0048, NavigationContext is a dedicated interface that provides
 * a stable shape for future AI orchestration without freezing implementation details.
 */

/**
 * Structured context collected during a navigation conversation.
 * Fields are progressively filled as the user answers clarifying questions.
 */
export interface NavigationContext {
  /** The user's stated intent/destination. */
  intent: string;

  /** Optional target date for achieving the goal. */
  targetDate?: string;

  /** Whether the user's current reality has been assessed. */
  currentRealityKnown: boolean;

  /** Whether the goal has been clearly defined. */
  goalDefined: boolean;

  /** Known constraints or limitations. */
  constraints: string[];

  /** How success will be measured. */
  successMetric?: string;
}

/**
 * A single turn in the navigation conversation.
 */
export interface ConversationTurn {
  /** Who said it. */
  role: "user" | "system";

  /** What was said. */
  message: string;

  /** When it was said. */
  timestamp: Date;
}
