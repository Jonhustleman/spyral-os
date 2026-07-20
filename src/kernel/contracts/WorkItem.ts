/**
 * SPYRAL OS — Kernel Contract
 * WorkItem — The base unit of work in the Execution Engine.
 *
 * Per ADR-0031, Execution should not own Tasks directly.
 * Instead, the hierarchy is:
 *   Execution Plan → Work Item → Task → Checklist → Evidence
 *
 * Today, WorkItem and Task may be synonymous.
 * Tomorrow, WorkItem can be extended to represent:
 *   - Task (concrete work)
 *   - Approval (a sign-off gate)
 *   - Meeting (synchronous collaboration)
 *   - Experiment (hypothesis testing)
 *   - Review (evaluation of completed work)
 *
 * WorkItem is a kernel contract for internal architecture only.
 * It is not exposed in the UI directly during Sprint 6.
 */

import type { Entity } from "./identity/Entity";
import type { ExecutionStatus } from "./ExecutionStatus";
import type { TraceReference } from "./TraceReference";

/**
 * The base unit of execution. All concrete work types derive from this.
 */
export interface WorkItem extends Entity {
  /** Human-readable title. */
  title: string;

  /** Optional detailed description of what this work entails. */
  description?: string;

  /** The Milestone this work item belongs to. */
  readonly milestoneId: string;

  /** Current status in the execution lifecycle (ADR-0029). */
  status: ExecutionStatus;

  /** Who is responsible for this work item. */
  owner: string;

  /** Traceability anchor — why does this exist? (ADR-0025, ADR-0028) */
  readonly trace: TraceReference;

  /** Priority relative to other work items. */
  priority: "critical" | "high" | "medium" | "low";
}
