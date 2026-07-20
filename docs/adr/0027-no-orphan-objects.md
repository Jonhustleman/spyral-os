# ADR-0027: No Orphan Objects

**Status:** Accepted  
**Date:** 2026-07-20  
**Author:** Chief Architect (ChatGPT)  
**Type:** Architecture  

## Context

Objects without parent references accumulate in the system. Without a formal dependency graph, the system cannot determine which objects are active, which are stale, and which can be safely archived or removed.

## Decision

Nothing exists independently. The formal dependency graph is:

```
Workspace
   ↓
Reality
   ↓
Goal
   ↓
Decision
   ↓
Execution
   ↓
Validation
   ↓
Learning
```

Every object must have a parent in this chain. An object without a valid parent reference is an orphan and should be flagged for cleanup.

## Consequences

- All kernel contracts enforce parent references through trace fields.
- The dependency graph is enforced at the type level, not at runtime.
- Orphan detection can be implemented as a system health check.
- Future garbage collection can safely identify and archive orphaned objects.
