/**
 * SPYRAL OS — Kernel Contract
 * Insight — A human-readable observation generated from one or more Patterns.
 *
 * Per ADR-0037, Insights are observations, not advice.
 * Example: "Marketing campaigns launched within 48 hours of product release
 * showed 22% higher success."
 *
 * That is an observation. Not advice.
 * Recommendations derive from Insights.
 */

import type { Entity } from "./identity/Entity";

/**
 * A human-readable observation derived from Patterns.
 */
export interface Insight extends Entity {
  /** The Pattern IDs that generated this insight. */
  patternIds: string[];

  /** Human-readable observation statement. */
  description: string;

  /** What domain or category this insight belongs to. */
  category?: string;

  /** How confident the system is in this insight (0–1). */
  confidence: number;

  /** Supporting evidence summary. */
  evidence?: string;

  /** Tags for categorization and search. */
  tags: string[];
}
