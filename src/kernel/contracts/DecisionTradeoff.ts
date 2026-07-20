/**
 * DecisionTradeoff — A structured trade-off between two options.
 *
 * Trade-offs allow users to compare options across multiple dimensions
 * rather than relying on a single "best" score.
 */

export interface DecisionTradeoff {
  /** The ID of the first option. */
  optionAId: string;

  /** The ID of the second option. */
  optionBId: string;

  /** The dimension this trade-off applies to (e.g., "cost", "speed", "quality"). */
  dimension: string;

  /** Which option performs better on this dimension. */
  betterOptionId: string;

  /** Optional magnitude or delta between the two options. */
  delta?: string;

  /** Confidence in this trade-off assessment (0–1). */
  confidence: number;
}
