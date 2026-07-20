/**
 * Explainability — Reusable interface for self-explaining platform entities.
 *
 * Per ADR-0023, every engine that produces output should be able to
 * explain itself. This interface is shared across Reality, Decision,
 * Learning, Report, and Recommendation engines.
 */

export interface Explainability {
  /** Why this result was produced — the reasoning chain. */
  reasoning: string;

  /** What data or evidence supports it. */
  evidence: string;

  /** Confidence level (0–1). */
  confidence: number;

  /** What information is missing that would improve confidence. */
  missingInformation?: string;

  /** Alternative views or interpretations. */
  alternativeViews?: string[];
}
