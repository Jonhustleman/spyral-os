# ADR-0002: Workspace Engine

**Status:** Frozen (Sprint 2)  
**Rule:** #002

## Decision

Every feature must be independently removable without breaking the kernel.

## Rationale

If deleting a feature requires modifying the kernel, the architecture is wrong.
Workspaces are the top-level organizational unit.

## Consequences

- Workspace Engine lives in `features/`, not `kernel/`.
- Kernel only knows the `Workspace` contract.
- Concrete workspace types (Business, Medical, etc.) are defined by plugins.
