# ADR-0042: Self-Evaluation

**Status:** Accepted  
**Date:** 2026-07-20  
**Author:** Chief Architect (ChatGPT)  
**Type:** Architecture  

## Context

As the platform grows, engineers and operators need a way to assess the health of each engine. Without a standard self-evaluation interface, diagnostics become ad-hoc and engine-specific.

## Decision

Each engine should report a standard diagnostics interface:

```typescript
interface EngineDiagnostics {
  engine: string;
  health: EngineHealth;
  dependencies: string[];
  lastRun: Date;
  warnings: string[];
}
```

Where `EngineHealth` is:

```typescript
interface EngineHealth {
  coverage: number;
  confidence: number;
  lastUpdated: Date;
  status: EngineStatus;
}
```

Eventually, a Diagnostics Studio will monitor the platform itself, aggregating EngineDiagnostics from every registered engine.

## Consequences

- Every engine must implement or expose EngineHealth.
- The Diagnostics contract is in the kernel and shared across all engines.
- A future Diagnostics Studio will provide a system health dashboard.
- Self-evaluation enables proactive monitoring and alerting.
