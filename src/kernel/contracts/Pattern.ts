/**
 * SPYRAL OS — Kernel Contract
 * Pattern — A recurring behavior observed across multiple Outcomes.
 *
 * Per ADR-0036 (Learning Is Bayesian), Patterns are discovered, not authored.
 * Each repeated Outcome should increase or decrease confidence in a Pattern.
 *
 * Per ADR-0037, Patterns are first-class kernel contracts.
 * They are the foundation of the Learning Engine.
 */

import type { Entity } from "./identity/Entity";
import type { ConfidenceScore } from "./ConfidenceScore";

/**
 * A pattern discovered by the Learning Engine from repeated Outcomes.
 */
export interface Pattern extends Entity {
  /** Human-readable title describing the pattern. */
  title: string;

  /** Detailed description of what this pattern represents. */
  description?: string;

  /** IDs of the Outcomes that serve as evidence for this pattern. */
  evidenceIds: string[];

  /** How many times this pattern has been observed. */
  occurrenceCount: number;

  /** How confident the system is that this is a genuine pattern (0–1). */
  confidence: number;

  /** When this pattern was last observed. */
  lastObserved: Date;

  /** Category for grouping related patterns. */
  category?: string;
}
