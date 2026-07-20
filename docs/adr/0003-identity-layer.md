# ADR-0003: Identity Layer

**Status:** Frozen (Sprint 2)  
**Rule:** #003

## Decision

Every domain object in the system should inherit consistent identity semantics.

## Contracts Created

- `kernel/contracts/identity/Entity.ts` — id, createdAt, updatedAt
- `kernel/contracts/identity/ValueObject.ts` — structural equality
- `kernel/contracts/identity/Aggregate.ts` — aggregate root with versioning

## Rationale

All domain objects share a common identity contract. This enables generic
persistence, auditing, and synchronization without per-type special cases.
