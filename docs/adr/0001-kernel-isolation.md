# ADR-0001: Kernel Isolation

**Status:** Frozen (Sprint 1)  
**Rule:** #001

## Decision

The Kernel must never import UI components. It must remain framework-agnostic.

## Rationale

This ensures the core domain logic can outlive any UI framework. React, Next.js,
or any other presentation technology can be replaced without touching the kernel.

## Consequences

- Kernel contracts use only vanilla TypeScript.
- No React, Next.js, or UI library imports in `kernel/`.
- The kernel is a pure abstraction layer.
