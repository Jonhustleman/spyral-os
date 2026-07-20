# ADR-0004: Registry Pattern

**Status:** Frozen (Sprint 2)  
**Rule:** #004

## Decision

The kernel never knows concrete workspace types. Types are resolved through
a registry in the features layer.

## Rationale

Concrete types (Business, Medical, Restaurant) are defined by plugins.
The kernel only understands the generic `Workspace` contract. This allows
third-party workspace types without kernel modifications.

## Consequences

- `WorkspaceRegistry` lives in `features/workspace/`.
- `kernel/contracts/Workspace.ts` uses `type: string` instead of a union.
- Plugins register types via the registry at import time.
