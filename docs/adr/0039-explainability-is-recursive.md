# ADR-0039: Explainability Is Recursive

**Status:** Accepted  
**Date:** 2026-07-20  
**Author:** Chief Architect (ChatGPT)  
**Type:** Architecture  

## Context

A recommendation without traceable evidence is an opinion. For SPYRAL to be trusted as a decision operating system, every conclusion must be defensible all the way back to the reality it's based on.

## Decision

Every Recommendation should expose the full traceability chain:

```
Recommendation → Insight → Pattern → Outcome → Validation → Execution → Decision → Reality
```

Every conclusion must be traceable to evidence.

This is recursive explainability: you can ask "why" at any level and get a meaningful answer backed by the level below it.

## Consequences

- Explainability is not a single field — it's a chain of references.
- The Recommendation contract references Insight IDs, which reference Pattern IDs, which reference Outcome IDs, etc.
- This chain can be traversed programmatically for audit and compliance.
- The full chain is available in the Learning Studio UI for any Recommendation.
