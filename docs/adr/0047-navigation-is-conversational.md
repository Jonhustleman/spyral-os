# ADR-0047: Navigation Is Conversational

**Status:** Accepted  
**Date:** 2026-07-20  
**Author:** Chief Architect (ChatGPT)  
**Type:** Architecture  

## Context

Navigation is the front door of SPYRAL. It must feel like a conversation with a senior strategist — not a form-filling exercise. Users should never wonder "why am I here?"

## Decision

Navigation is **stateful**. A NavigationSession progresses through defined stages.

```typescript
enum NavigationStage {
  INTENT,
  CLARIFICATION,
  REALITY,
  GAP,
  DECISION,
  EXECUTION,
  COMPLETE,
}
```

The UI renders the current stage. Each interaction should produce one of three outcomes:

1. **Enough information** → Proceed to next stage
2. **Need clarification** → Ask one question
3. **Need Reality** → Launch Reality Studio with context

Navigation asks only the **next necessary question**. Never overwhelm the user. This is progressive disclosure.

### Clarification Priority

Questions should always reduce uncertainty. Priority order:
1. Destination (what do you want to achieve?)
2. Time (by when?)
3. Current Reality (where are you now?)
4. Constraints (what limits exist?)
5. Success Metric (how will we know it's done?)

If all five are known, Navigation hands control to the appropriate engine.

## Consequences

- NavigationSession is stateful and persists between sessions.
- The Orchestrator is a state machine, not a router.
- Each Studio receives context explaining why the user is there.
- Navigation feels like guidance, not data entry.
