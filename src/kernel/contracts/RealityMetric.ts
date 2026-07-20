/**
 * SPYRAL OS — Kernel Contract
 * RealityMetric — a measured or estimated data point about reality.
 *
 * Rule #008: Every statement must be classified as Fact, Assumption,
 * Inference, or Recommendation. Never mix them.
 *
 * Rule #009: The Kernel never invents facts.
 * If data is missing: ask for it, estimate it (clearly marked), or leave it unknown.
 *
 * FROZEN — Core API.
 */

import type { Entity } from "./identity/Entity";
import type { StatementType } from "./StatementType";

/**
 * The confidence level of a metric's value.
 * Becomes critical when distinguishing measured data from estimates.
 */
export type MetricConfidence = "measured" | "estimated" | "inferred" | "unknown";

/**
 * A single data point about reality.
 * Every metric has a name, value, unit, confidence level, and source.
 */
export interface RealityMetric extends Entity {
  /** The workspace this metric belongs to. */
  workspaceId: string;

  /** Metric name (e.g. "Monthly Revenue", "Active Users"). */
  name: string;

  /** Numeric value. */
  value: number;

  /** Unit of measurement (e.g. "USD", "users", "%"). */
  unit?: string;

  /** How confident we are in this value. */
  confidence: MetricConfidence;

  /** Classification per Rule #008 — uses shared StatementType enum. */
  statementType: StatementType;

  /** Human-readable source description. */
  source: string;

  /** Optional tags for categorization. */
  tags: string[];
}
