/**
 * SPYRAL OS — Kernel Contract
 * Recommendation — An evidence-backed suggestion derived from Insights.
 *
 * Per ADR-0037, Recommendations derive from Insights.
 * Per ADR-0019 (Explainability), every Recommendation must contain:
 *   - explanation (why this is recommended)
 *   - confidence (how sure we are)
 *   - supporting evidence (traceable data)
 *   - alternative interpretations (other valid viewpoints)
 *
 * Per ADR-0039 (Explainability Is Recursive), every Recommendation should
 * be traceable back through: Insight → Pattern → Outcome → Validation → Execution → Decision → Reality
 */

import type { Entity } from "./identity/Entity";
import type { Explainability } from "./Explainability";

/**
 * An evidence-backed suggestion for action.
 */
export interface Recommendation extends Entity {
  /** The Insight IDs that generated this recommendation. */
  insightIds: string[];

  /** Human-readable title. */
  title: string;

  /** Detailed description of the recommended action. */
  description?: string;

  /** Full explainability per ADR-0019 and ADR-0039. */
  explanation: Explainability;

  /** Priority for implementation. */
  priority: "critical" | "high" | "medium" | "low";

  /** Status of this recommendation. */
  status: "active" | "implemented" | "dismissed" | "superseded";
}
