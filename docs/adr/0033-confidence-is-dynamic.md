# ADR-0033: Confidence Is Dynamic

**Status:** Accepted  
**Date:** 2026-07-20  
**Author:** Chief Architect (ChatGPT)  
**Type:** Architecture  

## Context

The system has multiple places where confidence is relevant: reality assessments, validation results, learning outcomes. Using a single confidence value everywhere conflates different concepts and loses semantic meaning.

## Decision

Confidence is context-specific. There are three distinct confidence concepts:

1. **Reality Confidence** — How sure we are that a reality observation is accurate. Changes over time as more data becomes available.
2. **Validation Confidence** — How sure we are that the observed variance was caused by the execution. Changes after each validation run.
3. **Learning Confidence** — How sure we are that a learned pattern generalizes. Changes after repetition.

These are **different concepts**. Never reuse one confidence score everywhere.

```typescript
// Context-specific confidence, not a single global value
interface ConfidenceScore {
  value: number;    // 0–1
  label: string;    // e.g. "Reality", "Validation", "Learning"
  rationale?: string;
}
```

## Consequences

- Each engine manages its own confidence semantics.
- Confidence is always accompanied by a label describing what it refers to.
- Cross-engine confidence comparison requires explicit mapping.
- The ConfidenceScore contract is a value object, not an entity.
