# ADR-0048: NavigationSession Is a Product Contract

**Status:** Accepted  
**Date:** 2026-07-20  
**Author:** Chief Architect (ChatGPT)  
**Type:** Contract  

## Context

NavigationSession records the user's journey through SPYRAL. It tracks progress, holds context, and enables continuity between sessions. It is not part of the reasoning pipeline — it is a user journey contract.

## Decision

NavigationSession lives in the kernel but is explicitly a **product contract**, not a reasoning pipeline contract. Think of it as the equivalent of a browser session. It records progress. It does not make decisions.

```typescript
interface NavigationSession {
  id: string;
  workspaceId: string;
  prompt: string;
  stage: NavigationStage;
  status: "ACTIVE" | "PAUSED" | "COMPLETED" | "ABANDONED";
  context: NavigationContext;
  history: ConversationTurn[];
  currentWorkspaceId: string;
  currentCapabilityId: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### NavigationContext

A dedicated interface for structured context collected during the conversation.

```typescript
interface NavigationContext {
  intent: string;
  targetDate?: string;
  currentRealityKnown: boolean;
  goalDefined: boolean;
  constraints: string[];
  successMetric?: string;
}
```

### ConversationTurn

Each exchange in the navigation conversation.

```typescript
interface ConversationTurn {
  role: "user" | "system";
  message: string;
  timestamp: Date;
}
```

### Status

- **ACTIVE**: Currently in progress
- **PAUSED**: User left, can resume
- **COMPLETED**: Journey reached a destination
- **ABANDONED**: User stopped without completing

### Recent Destinations

Do not store recent destinations separately. Derive them from completed NavigationSessions. This keeps a single source of truth.

### Continue Journey

Query: `NavigationSession WHERE status == ACTIVE`

The UI becomes a projection of session state rather than maintaining parallel state.

### Returning Users

Never ask them to restate their goal. Instead: "Yesterday we were working toward ₦10M/month. Ready to continue?"

## Consequences

- NavigationSession is a product contract — it has different governance from reasoning contracts.
- The Orchestrator (state machine) reads and writes NavigationSessions.
- NavigationContext provides a stable shape for future AI orchestration.
- Single source of truth for recent destinations and active journeys.
