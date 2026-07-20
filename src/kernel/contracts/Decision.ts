/**
 * Decision — A choice made within a DecisionContext.
 *
 * Per ADR-0017, once made, a decision is immutable.
 * Corrections are new decisions that supersede the old one.
 *
 * Per ADR-0021, Decision owns the intent. Execution owns the result.
 * Decision.outcome is deprecated and will be relocated to the Execution Engine.
 */

import type { Entity } from "./identity/Entity";
import type { DecisionContext } from "./DecisionContext";
import type { DecisionOption } from "./DecisionOption";
import type { DecisionScore } from "./DecisionScore";
import type { DecisionOutcome } from "./DecisionOutcome";
import type { Explainability } from "./Explainability";

export interface Decision extends Entity {
  /** The context in which this decision was made. */
  context: DecisionContext;

  /** Human-readable title. */
  title: string;

  /** Optional detailed description. */
  description?: string;

  /** The options that were considered. At least one is required. */
  options: DecisionOption[];

  /** Multi-dimensional scores for each option (same order as options). */
  scores: DecisionScore[];

  /** The ID of the selected option, or null if no selection was made. */
  selectedOptionId: string | null;

  /**
   * The outcome of executing this decision, if available.
   * @deprecated — Will be relocated to the Execution Engine in Sprint 6.
   *              The Decision owns the intent. Execution owns the result.
   */
  outcome?: DecisionOutcome;

  /** Explanation per ADR-0019 and ADR-0023: why this decision was made. */
  explanation: Explainability;

  /** Relationships to other decisions in the Decision Graph (ADR-0022). */
  relationships?: string[];

  /** Tags for categorization. */
  tags?: string[];

  /** Current lifecycle status. */
  status: "draft" | "made" | "executing" | "executed" | "superseded";

  /** When the decision was made. */
  createdAt: Date;

  /** Who or what made the decision. */
  madeBy: string;
}
