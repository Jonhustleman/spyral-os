/**
 * SPYRAL OS — Kernel Contract
 * ConfidenceScore — A measure of certainty attached to a statement or observation.
 *
 * Per ADR-0033, confidence is dynamic and context-specific:
 *   - Reality confidence changes over time
 *   - Validation confidence changes after execution
 *   - Learning confidence changes after repetition
 *
 * These are distinct concepts. Never reuse one confidence score everywhere.
 * ConfidenceScore is a value object — it describes a spot assessment, not a tracked entity.
 */

/**
 * A confidence assessment value.
 * Value is between 0 and 1 (0% to 100%).
 */
export interface ConfidenceScore {
  /** Numeric confidence between 0 and 1. */
  readonly value: number;

  /** What this confidence refers to. */
  readonly label: string;

  /** Optional explanation of how this confidence was determined. */
  readonly rationale?: string;
}

/**
 * Predefined confidence levels for convenience.
 */
export const ConfidenceLevel = {
  CERTAIN: 1.0,
  HIGH: 0.85,
  MEDIUM: 0.65,
  LOW: 0.4,
  UNCERTAIN: 0.15,
  NONE: 0,
} as const;

/**
 * Get a human-readable label for a confidence value.
 */
export function describeConfidence(value: number): string {
  if (value >= 0.95) return "Certain";
  if (value >= 0.75) return "High";
  if (value >= 0.55) return "Medium";
  if (value >= 0.25) return "Low";
  return "Uncertain";
}
