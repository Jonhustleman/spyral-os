/**
 * SPYRAL OS — Kernel Contract
 * ExecutionStatus — The full lifecycle of execution objects.
 *
 * Per ADR-0029, the execution lifecycle is:
 *   PLANNED → APPROVED → READY → IN_PROGRESS → BLOCKED → COMPLETED
 * With alternative exits:
 *   READY → CANCELLED
 *   IN_PROGRESS → FAILED
 *
 * The READY state distinguishes "approved to exist" from "ready to start now."
 * This distinction is critical for accurate forecasting and resource allocation.
 */

export enum ExecutionStatus {
  /** Created but not yet reviewed or approved. */
  PLANNED = "planned",

  /** Reviewed and approved, but not yet ready to begin execution. */
  APPROVED = "approved",

  /** All dependencies met — can start immediately. */
  READY = "ready",

  /** Actively being worked on. */
  IN_PROGRESS = "in_progress",

  /** Execution is impeded by an external dependency or issue. */
  BLOCKED = "blocked",

  /** Successfully finished. All requirements met. */
  COMPLETED = "completed",

  /** Terminated before completion, without prejudice. */
  CANCELLED = "cancelled",

  /** Terminated due to an unrecoverable issue. */
  FAILED = "failed",
}
