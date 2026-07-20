/**
 * DecisionOption — A single option within a Decision.
 *
 * Every option contains a title, description, and structured expectations
 * for benefit, cost, risk, and effort. No AI — only structure.
 */

export interface DecisionOption {
  /** Unique identifier within the parent Decision. */
  id: string;

  /** Human-readable title. */
  title: string;

  /** Detailed description of this option. */
  description: string;

  /** Expected benefit of choosing this option. */
  expectedBenefit: string;

  /** Expected cost of choosing this option. */
  expectedCost: string;

  /** Expected risk of choosing this option. */
  expectedRisk: string;

  /** Required effort to execute this option. */
  requiredEffort: string;

  /** Confidence in this option's projections (0–1). */
  confidence: number;
}
