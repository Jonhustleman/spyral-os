# ADR-0059: Engineering Observability

**Status:** Accepted  
**Date:** 2026-07-20  
**Author:** Implementation Engineer (GitHub Copilot)  
**Type:** Infrastructure  

## Context

SPYRAL OS has grown to include 8 studios, a navigation state machine, error boundaries, a structured logger, and an E2E canonical journey test suite. As the system scales, we need a unified observability strategy to:

1. **Detect failures** before users report them  
2. **Trace user journeys** across studio transitions  
3. **Measure performance** at every layer (render, store, localStorage, AI calls)  
4. **Debug production issues** with structured context  
5. **Validate trust** by proving the system behaves correctly  

Currently, observability is ad-hoc: `console.log` statements exist in several studios, the logger (`src/lib/logger.ts`) is only partially adopted, and there is no centralized monitoring dashboard.

## Decision

We adopt a **layered observability architecture** with three tiers:

### Tier 1 — Structured Event Logging (Client-Side)

Every significant user interaction and system event is recorded as a structured event through the existing `logger` module.

```typescript
// src/lib/logger.ts — Enhanced event types
type SpyralEvent =
  | "SessionCreated"
  | "SessionResumed"
  | "StageTransition"
  | "QuestionAsked"
  | "AnswerReceived"
  | "DecisionMade"
  | "ExecutionStarted"
  | "ExecutionCompleted"
  | "ValidationPerformed"
  | "PatternDetected"
  | "ErrorCaught"
  | "CapabilityInvoked"
  | "WorkspaceSwitched"
  | "AICallStarted"
  | "AICallCompleted"
  | "AICallFailed"
  | "localStorageWrite"
  | "localStorageRead"
  | "StudioRender"
  | "NavigationAction";
```

Each event carries a consistent payload:

```typescript
interface SpyralEventPayload {
  event: SpyralEvent;
  sessionId?: string;
  workspaceId?: string;
  studio?: string;
  timestamp: number;
  duration?: number;
  metadata?: Record<string, unknown>;
}
```

### Tier 2 — Error Tracking & Recovery

All errors flow through the error boundary hierarchy (`ErrorFallback`, per-studio `error.tsx`, `global-error.tsx`). The logger's `error(context, data)` method captures:

- Error message and stack trace (dev mode)
- Studio context where the error occurred  
- Session state at time of failure  
- User action that triggered the error  

Error events are persisted to localStorage under the key `spyral_error_log` for post-session analysis.

### Tier 3 — Performance Budgets & Monitoring

Performance metrics are collected at key interaction points:

| Metric | Collection Point | Target |
|--------|-----------------|--------|
| Studio render time | `SpyralEvent.StudioRender` with `performance.now()` | < 100ms |
| localStorage read/write | `SpyralEvent.localStorageRead/Write` with duration | < 50ms |
| AI call duration | `SpyralEvent.AICallStarted/Completed` | < 5000ms |
| Navigation transition | `SpyralEvent.StageTransition` with timestamp delta | < 150ms |
| Initial page load | `window.performance.timing` or Navigation API | < 200KB JS |

## Implementation Plan

### Phase 1 — Logger Adoption (Current Sprint)

1. **Replace all `console.log` calls** with structured `logger.event()` calls across all 8 studios  
2. **Add session context** to every event (sessionId, workspaceId, studio name)  
3. **Instrument the navigation store** with stage transition events  
4. **Instrument AI interactions** with start/completed/failed events  

### Phase 2 — Error Diagnostics (Next Sprint)

1. **Persist error log** to localStorage with session context  
2. **Add Developer Mode** a runtime diagnostics panel (`src/components/dev/DeveloperMode.tsx`) showing live event stream  
3. **Create `/debug` route** for viewing stored event/error logs (disabled in production)  

### Phase 3 — Performance Dashboard (Future)

1. **Export event log** as JSON for external analysis  
2. **Build a simple performance dashboard** accessible from Developer Mode  
3. **Set up performance budgets** that warn when metrics exceed targets  

## Consequences

### Positive

- **Debugging becomes data-driven** — every failure has context  
- **Trust is measurable** — we can prove the system handles errors gracefully  
- **Performance regressions are detectable** in development  
- **User journeys are traceable** across studio transitions  
- **Error boundaries are validated** by real usage data  

### Negative

- **Increased event volume** — high-traffic interactions (localStorage reads) may need sampling  
- **Storage overhead** — localStorage has a 5-10MB limit; need a retention/cleanup strategy  
- **Dev-only concerns** — debug routes and Developer Mode must be gated behind environment checks  

### Mitigations

- Sample high-frequency events at 1:10 ratio  
- Cap error log at 100 entries with FIFO eviction  
- Gate `/debug` route and Developer Mode behind `process.env.NODE_ENV !== 'production'`  

## Engineering Principles Addressed

- **#7 Tests Are Contracts** — Observability data validates test assumptions  
- **#8 Fail Fast, Fail Visibly** — Structured errors with recovery context  
- **#10 Measure What Matters** — Explicit performance budgets  
- **#11 Trust Is Earned Incrementally** — Observable, traceable system behaviour  
