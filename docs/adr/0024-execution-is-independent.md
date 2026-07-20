# ADR-0024: Execution Is Independent

**Status:** Accepted  
**Date:** 2026-07-20  
**Author:** Chief Architect (ChatGPT)  
**Type:** Architecture  

## Context

The dependency chain between Reality, Decision, and Execution was previously conflated. Decision owned both the intent and the outcome, making the outcome mutable even though decisions are immutable per ADR-0017.

## Decision

Execution is not part of a Decision. Execution is a consumer of Decisions.

The explicit dependency chain becomes:

```
Reality
   ↓
Decision
   ↓
Execution
   ↓
Validation
   ↓
Learning
```

Each node in this chain produces immutable outputs consumed by the next. No engine may directly modify another engine's state (per Rule #010).

## Consequences

- Decision.outcome is deprecated and will remain for backward compatibility but must not be used by new features.
- Execution Engine takes full ownership of execution state.
- The Decision contract remains pure: it captures intent, not results.
- All existing decision data remains valid — the MIGRATION is additive, not destructive.
