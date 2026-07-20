# ADR-0007: The Dependency Rule

**Status:** Ratified (Sprint 3)  
**Rule:** #008 (informal)

## Decision

From this point forward, every dependency must point toward abstraction,
never toward implementation.

## Dependency Graph

```
Experience → Features → Capability Registry → Kernel Contracts → Kernel → Infrastructure
```

## Rationale

This means we can replace React, Next.js, Zustand, Prisma, PostgreSQL,
or any infrastructure component without rewriting the Kernel.

That is the entire purpose of the architecture.
