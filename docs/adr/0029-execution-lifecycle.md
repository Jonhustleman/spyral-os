# ADR-0029: Execution Lifecycle

**Status:** Accepted  
**Date:** 2026-07-20  
**Author:** Chief Architect (ChatGPT)  
**Type:** Contract  

## Context

The execution lifecycle needs a status model that distinguishes between:
- Work that has been reviewed and approved
- Work that is ready to begin immediately
- Work that is actually in progress

Without this distinction, forecasting and resource allocation are inaccurate.

## Decision

The execution lifecycle is:

```
PLANNED
   ↓
APPROVED
   ↓
READY
   ↓
IN_PROGRESS
   ↓
BLOCKED
   ↓
COMPLETED
```

Alternative exits:

```
READY → CANCELLED
IN_PROGRESS → FAILED
```

The **READY** state is the key addition. It distinguishes between:

- **APPROVED** — The work has been reviewed and authorized.
- **READY** — All dependencies are met and the work can start immediately.

BLOCKED can transition back to IN_PROGRESS once the impediment is resolved.

```typescript
export enum ExecutionStatus {
  PLANNED = "planned",
  APPROVED = "approved",
  READY = "ready",
  IN_PROGRESS = "in_progress",
  BLOCKED = "blocked",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  FAILED = "failed",
}
```

## Consequences

- All execution contracts use the unified `ExecutionStatus` enum.
- The READY state enables accurate "ready-to-start" reporting.
- Forecasting algorithms use READY vs APPROVED ratios for prediction.
- The lifecycle is shared across ExecutionPlan, Milestone, WorkItem, and Task.
