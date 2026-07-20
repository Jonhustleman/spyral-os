# ADR-0016: Decision Context

**Status:** Accepted  
**Date:** 2026-07-19  
**Author:** Chief Architect (ChatGPT)  
**Type:** Contract  

## Context

Reality alone is not enough. Every decision should execute within a context that includes the workspace, the reality snapshot, relevant goals, constraints, and assumptions.

## Decision

Create a new kernel contract `DecisionContext` that bundles all inputs required by the Decision Engine.

```typescript
export interface DecisionContext {
  workspaceId: string;
  realitySnapshotId: string;
  goalIds: string[];
  constraints: string[];
  assumptions: string[];
  timestamp: Date;
}
```

The Decision Engine consumes `DecisionContext` instead of directly querying Reality. This keeps the engine deterministic and testable.

## Consequences

- Decision Engine operations are fully deterministic given a fixed context
- Testing becomes straightforward — provide a context, assert the decision
- Context can be serialized, stored, and replayed for audit
- Future engines can extend the context without affecting existing consumers
