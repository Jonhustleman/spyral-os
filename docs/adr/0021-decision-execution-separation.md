# ADR-0021: Decision ≠ Execution

**Status:** Accepted  
**Date:** 2026-07-20  
**Author:** Chief Architect (ChatGPT)  
**Type:** Architecture  

## Context

The `Decision.outcome` field conflates two distinct concerns: the decision itself (which is immutable) and its execution (which is mutable).

## Decision

Separate Decision from Execution:

- **Decision** — Creates an execution plan. Never mutates.
- **Execution** — Produces the outcome. Mutates as work progresses.

The `Decision.outcome` field is deprecated and will be relocated to the Execution Engine in Sprint 6.

```typescript
// Current (deprecated):
export interface Decision extends Entity {
  outcome?: DecisionOutcome; // @deprecated — will relocate to Execution Engine in Sprint 6
  // ...
}
```

## Consequences

- Decision immutability is preserved
- Execution flexibility is maintained
- Future Execution Engine owns the outcome lifecycle
- Backward compatible — no breaking changes
