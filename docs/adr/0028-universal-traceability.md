# ADR-0028: Universal Traceability

**Status:** Accepted  
**Date:** 2026-07-20  
**Author:** Chief Architect (ChatGPT)  
**Type:** Contract  

## Context

The initial design used `traceId` as a simple string reference. However, `traceId` is ambiguous — it does not indicate what kind of source it references, making resolution dependent on external context.

## Decision

Do not use `traceId`. Instead, introduce a first-class value object:

```typescript
export interface TraceReference {
  sourceId: string;
  sourceType: TraceSourceType;
}

export enum TraceSourceType {
  REALITY = "reality",
  GOAL = "goal",
  DECISION = "decision",
  EXECUTION = "execution",
  VALIDATION = "validation",
  LEARNING = "learning",
}
```

Every traceable object contains:

```typescript
trace: TraceReference;
```

A structured trace is self-describing. Over time, this enables:

```
Task → Decision → Goal → Reality
```

without changing the Task contract.

## Consequences

- `TraceReference` is a required field on all execution contracts.
- `traceId` is not used anywhere in the Execution Engine.
- Provenance graphs can be constructed by following the trace chain.
- The enum is extensible — new source types can be added as the system evolves.
