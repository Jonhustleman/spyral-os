/**
 * DecisionContext — The canonical input bundle for the Decision Engine.
 *
 * Per ADR-0016, every decision executes within a context that includes
 * the workspace, reality snapshot, goals, constraints, and assumptions.
 * This keeps the Decision Engine deterministic and testable.
 */

import type { StatementType } from "./StatementType";

export interface DecisionContext {
  /** The workspace this decision belongs to. */
  workspaceId: string;

  /** The reality snapshot that provides the "current state" for this decision. */
  realitySnapshotId: string;

  /** The goals this decision should help achieve. */
  goalIds: string[];

  /** Constraints that limit the decision space. */
  constraints: string[];

  /** Assumptions being made. Each should include its statement classification. */
  assumptions: { text: string; type: StatementType }[];

  /** When this context was captured. */
  timestamp: Date;
}
