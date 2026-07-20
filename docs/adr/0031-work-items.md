# ADR-0031: Work Items

**Status:** Accepted  
**Date:** 2026-07-20  
**Author:** Chief Architect (ChatGPT)  
**Type:** Contract  

## Context

Execution should not own Tasks directly. Tasks are one specific kind of work, but the system may need to represent:

- **Tasks** — concrete, assignable work units
- **Approvals** — sign-off gates
- **Meetings** — synchronous collaboration events
- **Experiments** — hypothesis testing
- **Reviews** — evaluation of completed work

Without a base abstraction, each new work type requires a separate contract with duplicate fields.

## Decision

Introduce a `WorkItem` base contract. The hierarchy becomes:

```
Execution Plan
   ↓
Milestone
   ↓
WorkItem
   ↓
Task
   ↓
Checklist
   ↓
Evidence
```

```typescript
export interface WorkItem extends Entity {
  title: string;
  description?: string;
  milestoneId: string;
  status: ExecutionStatus;
  owner: string;
  trace: TraceReference;
  priority: "critical" | "high" | "medium" | "low";
}
```

Today, `WorkItem` and `Task` are effectively synonymous. Tomorrow, other work types can derive from `WorkItem` without changing the core contracts.

**Implementation Guidance:** WorkItem is an internal architectural foundation. It is defined as a kernel contract but not exposed in the UI during Sprint 6.

## Consequences

- `WorkItem` is a kernel contract that `Task` extends conceptually.
- The UI only displays `Task` for Sprint 6.
- New work types can be added in future sprints without contract changes.
- The execution hierarchy is intentionally shallow and composable.
