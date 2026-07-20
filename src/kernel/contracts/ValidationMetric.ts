/**
 * SPYRAL OS — Kernel Contract
 * ValidationMetric — A single measurable dimension within a ValidationRun.
 *
 * Captures what was expected, what was observed, the variance between them,
 * and the confidence in the validation result.
 *
 * Per ADR-0032, Validation compares:
 *   Expected → Observed → Variance → Confidence
 */

import type { Variance } from "./Variance";

/**
 * A single validated metric within a ValidationRun.
 */
export interface ValidationMetric {
  /** The ID of the metric being validated (References RealityMetric or custom). */
  readonly metricId: string;

  /** The value that was expected (from the execution plan or goal). */
  expectedValue: number;

  /** The value that was actually observed (from the reality snapshot). */
  observedValue: number;

  /** The computed variance between expected and observed. */
  variance: Variance;

  /** Confidence in this validation result (0–1). */
  confidence: number;
}
