/**
 * DecisionScore — Multi-dimensional scoring for a single option.
 *
 * Per ADR-0020, scores MUST be multi-dimensional. No single "best" score.
 * Each dimension is scored independently so the model stays explainable.
 */

export interface DecisionScore {
  /** The ID of the option this score belongs to. */
  optionId: string;

  /** Individual dimension scores. */
  dimensions: DecisionDimensionScore[];
}

export interface DecisionDimensionScore {
  /** The dimension name (e.g., "Impact", "Cost", "Risk", "Time", "Confidence"). */
  name: string;

  /** Score value. Higher is better unless noted. */
  value: number;

  /** Maximum possible value for this dimension. */
  max: number;

  /** Optional weight to indicate relative importance. */
  weight?: number;
}
