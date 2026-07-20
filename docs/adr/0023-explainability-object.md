# ADR-0023: Explainability Object

**Status:** Accepted  
**Date:** 2026-07-20  
**Author:** Chief Architect (ChatGPT)  
**Type:** Contract  

## Context

The `DecisionExplanation` interface currently lives inside `Decision.ts`. However, explainability is a cross-cutting concern — Reality, Decisions, Learning, Reports, and Recommendations all need to explain themselves.

## Decision

Extract a reusable `Explainability` interface that can be shared across the platform.

```typescript
export interface Explainability {
  /** Why this result was produced — the reasoning chain. */
  reasoning: string;

  /** What data or evidence supports it. */
  evidence: string;

  /** Confidence level (0–1). */
  confidence: number;

  /** What information is missing that would improve confidence. */
  missingInformation?: string;

  /** Alternative views or interpretations. */
  alternativeViews?: string[];
}
```

`Decision.explanation` should use this shared type. Future engines (Reality, Learning, Report, Recommendation) will also use it.

## Consequences

- Consistent explainability across all engines
- UI components can be reused
- `missingInformation` drives the stretch goal assistant panel
- `alternativeViews` preserves ADR-0020 (No Single Best Option)
- Backward compatible — existing Decision.explanation field structure is preserved
