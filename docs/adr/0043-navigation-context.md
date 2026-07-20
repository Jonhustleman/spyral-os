# ADR-0043: Navigation Context

**Status:** Accepted  
**Date:** 2026-07-20  
**Author:** Chief Architect (ChatGPT)  
**Type:** Architecture  

## Context

The Navigation Studio needs a way to pass context between engines when orchestrating a user's journey. Without a context object, each engine must independently re-derive the user's intent and state, leading to redundancy and inconsistency.

## Decision

Introduce a `NavigationContext` value object that carries the user's current destination, session state, and engine results through the orchestration pipeline.

```typescript
interface NavigationContext {
  sessionId: string;
  destination: string;
  currentWorkspaceId: string;
  activeEngine: string;
  engineResults: Record<string, any>;
  history: { engine: string; timestamp: Date; result: any }[];
}
```

Navigation passes this context between engines. Each engine reads what it needs, appends its results, and passes it forward. The Navigation Studio owns the context lifecycle.

## Consequences

- NavigationContext is a lightweight value object, not an entity.
- Engines do not store NavigationContext — they consume and append to it.
- The context enables the full chain: Navigation → Reality → Gap → Decision → Execution → Validation → Learning.
- NavigationContext is ephemeral — it exists only for the duration of a navigation session.
