# ADR-0025: Everything Is Traceable

**Status:** Accepted  
**Date:** 2026-07-20  
**Author:** Chief Architect (ChatGPT)  
**Type:** Architecture  

## Context

As the system grows, objects proliferate. Without a traceability requirement, objects can become orphaned — present in the system but with no clear purpose or origin, violating ADR-0027.

## Decision

Every execution object must answer: **Why does this exist?**

If the answer cannot be traced to a chain of:

1. **Reality** — what is true about the current state
2. **Goal** — what we want to be true
3. **Decision** — how we chose to bridge the gap

then the object should not exist inside SPYRAL.

This rule keeps the OS focused. Every object is justified by a chain of reasoning that leads back to a perceived reality.

## Consequences

- All execution contracts must include a `trace` field linking to their origin.
- Objects without traceability are candidates for garbage collection.
- The trace chain enables future provenance graphs and audit trails.
- Traceability is enforced at the contract level (type system), not at runtime.
