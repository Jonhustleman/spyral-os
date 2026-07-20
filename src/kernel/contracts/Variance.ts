/**
 * SPYRAL OS — Kernel Contract
 * Variance — A dedicated value object measuring the difference between expected and observed.
 *
 * Per ADR-0032, Variance captures the gap between what an execution was expected
 * to achieve and what was actually observed. Direction is semantic (improved/unchanged/regressed),
 * NOT numeric (positive/negative), because the meaning of a numeric delta depends on the metric.
 */

/**
 * The semantic direction of a variance.
 */
export type VarianceDirection = "improved" | "unchanged" | "regressed";

/**
 * A value object that describes how an observed value differs from its expected value.
 */
export interface Variance {
  /** Absolute difference (observed - expected). */
  readonly absolute: number;

  /** Percentage change relative to expected value. */
  readonly percentage: number;

  /** Semantic direction — what the variance means, not its arithmetic sign. */
  readonly direction: VarianceDirection;
}

/**
 * Create a Variance from expected and observed values.
 * Automatically computes absolute, percentage, and direction.
 */
export function createVariance(expected: number, observed: number): Variance {
  const absolute = observed - expected;
  const percentage = expected !== 0 ? (absolute / expected) * 100 : 0;
  const direction: VarianceDirection =
    absolute > 0 ? "improved" :
    absolute < 0 ? "regressed" :
    "unchanged";
  return { absolute, percentage, direction };
}
