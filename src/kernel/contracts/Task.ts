/**
 * SPYRAL OS — Kernel Contract
 * Task — The concrete, actionable unit of work within the Execution Engine.
 *
 * Per ADR-0031, Task extends WorkItem as the primary concrete work type.
 * Every Task must be traceable to a Decision or Goal via TraceReference (ADR-0028).
 *
 * The hierarchy:
 *   Execution Plan → Milestone → WorkItem → Task → Checklist → Evidence
 */

import type { Entity } from "./identity/Entity";
import type { ExecutionStatus } from "./ExecutionStatus";
import type { TraceReference } from "./TraceReference";

/**
 * A concrete, assignable unit of work.
 */
export interface Task extends Entity {
  /** Human-readable title. */
  title: string;

  /** Optional detailed description. */
  description?: string;

  /** The WorkItem this task belongs to. */
  readonly workItemId: string;

  /** Current status in the execution lifecycle (ADR-0029). */
  status: ExecutionStatus;

  /** Who is responsible for completing this task. */
  owner: string;

  /** Priority relative to other tasks. */
  priority: "critical" | "high" | "medium" | "low";

  /** Optional deadline. */
  dueDate?: string;

  /** Estimated effort in hours. */
  estimate: number;

  /** Actual effort spent in hours, populated on completion. */
  actual?: number;

  /** IDs of tasks that must be completed before this one can start. */
  dependencies: string[];

  /** Evidence produced by completing this task (ADR-0026). */
  evidence: string[];

  /** Traceability anchor — why does this exist? (ADR-0025, ADR-0028) */
  readonly trace: TraceReference;
}
