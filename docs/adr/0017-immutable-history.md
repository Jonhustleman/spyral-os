# ADR-0017: Immutable History

**Status:** Accepted  
**Date:** 2026-07-19  
**Author:** Chief Architect (ChatGPT)  
**Type:** Architecture  

## Context

As the platform records reality snapshots, decisions, and executions, we must define which data is immutable for historical integrity.

## Decision

Establish the following immutability rules:

| Entity | Mutability |
|--------|-----------|
| Reality | ✅ Immutable |
| Decision | ✅ Immutable |
| Execution | ❌ Mutable |
| Learning | 📈 Accumulative |

- **Reality** — Once recorded, a reality snapshot is never mutated. New snapshots supersede old ones.
- **Decision** — A decision, once made, is never changed. Corrections are new decisions.
- **Execution** — Execution state can change as work progresses (pending → in-progress → completed → failed).
- **Learning** — Knowledge accumulates; new insights supplement rather than replace old ones.

## Consequences

- Full audit trail of all reality states and decisions
- Historical analysis can replay the exact state at any point in time
- Immutable data enables caching, memoization, and event sourcing patterns
- Execution flexibility is preserved for ongoing work
